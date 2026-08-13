import { spawn } from 'node:child_process';

import { config } from '../config.ts';

import { getExecutable } from './getExecutable.ts';

export interface SurgeRun {
  /** One structure per line, in the format the flags asked for. */
  lines: string[];
  /** What surge wrote to stderr, including its summary line. */
  log: string;
  /** Surge was killed before it finished enumerating. */
  timedOut: boolean;
  /** Surge wrote more than `MAX_OUTPUT_BYTES` and was killed. */
  truncated: boolean;
  /** How many structures surge reports having written, when it says so. */
  written: number | null;
  /** Wall-clock duration of the child process, in milliseconds. */
  durationMs: number;
}

let running = 0;
const waiting: Array<() => void> = [];

/**
 * Run surge, limiting how many child processes run at the same time so a
 * single expensive formula cannot starve the service.
 * @param flags - Command line flags, the molecular formula last.
 * @param timeoutMs - Time after which the process is killed.
 * @returns What surge produced, and how it ended.
 */
export async function runSurge(
  flags: string[],
  timeoutMs: number,
): Promise<SurgeRun> {
  await acquire();
  try {
    return await execute(flags, timeoutMs);
  } finally {
    release();
  }
}

function acquire(): Promise<void> {
  if (running < config.maxParallelGenerations) {
    running++;
    return Promise.resolve();
  }
  if (waiting.length >= config.maxQueuedGenerations) {
    const error = Object.assign(
      new Error('Too many generations in progress, please retry later'),
      { statusCode: 503 },
    );
    return Promise.reject(error);
  }
  return new Promise((resolve) => {
    waiting.push(resolve);
  });
}

function release(): void {
  const next = waiting.shift();
  if (next) {
    next();
  } else {
    running--;
  }
}

function execute(flags: string[], timeoutMs: number): Promise<SurgeRun> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(getExecutable(), flags, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
    });

    const chunks: string[] = [];
    let bytes = 0;
    let truncated = false;
    let log = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk: string) => {
      if (truncated) return;
      bytes += chunk.length;
      if (bytes > config.maxOutputBytes) {
        truncated = true;
        child.kill('SIGKILL');
        return;
      }
      chunks.push(chunk);
    });

    child.stderr.on('data', (chunk: string) => {
      log += chunk;
    });

    // The executable could not be run at all: a missing binary must not look
    // like a formula with no isomer, or every answer becomes a confident zero.
    child.on('error', (error) => {
      reject(
        Object.assign(new Error(`surge could not be run: ${error.message}`), {
          statusCode: 503,
        }),
      );
    });

    child.on('close', (_code, signal) => {
      // Only a timeout kill is a partial result: a truncated run was killed by
      // us on purpose, and the structures already written stay valid.
      const timedOut = signal !== null && !truncated;
      if (timedOut) {
        log += `\nsurge was killed after ${timeoutMs} ms (${signal})`;
      }
      resolve(finish(log, timedOut));
    });

    function finish(stderr: string, timedOut: boolean): SurgeRun {
      const text = chunks.join('');
      const lines = text.split('\n');
      // A killed process usually leaves half a line behind.
      if ((timedOut || truncated) && lines.length > 0) lines.pop();
      return {
        lines: lines.filter(Boolean),
        log: stderr.trim(),
        timedOut,
        truncated,
        written: readWrittenCount(stderr),
        durationMs: Date.now() - start,
      };
    }
  });
}

/**
 * Read the structure count out of the surge summary line, which looks like
 * `>Z wrote 8 -> 8 -> 10 in 0.00 sec`.
 * @param log - Everything surge wrote to stderr.
 * @returns The number of structures surge reports, or null when it did not
 * get far enough to say.
 */
function readWrittenCount(log: string): number | null {
  const match = /^>Z (?:wrote|generated) .*?(?<count>\d+) in /m.exec(log);
  const count = match?.groups?.count;
  return count === undefined ? null : Number(count);
}
