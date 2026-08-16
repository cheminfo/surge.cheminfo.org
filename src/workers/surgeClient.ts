import type { RunProgress } from '../generate/generateIsomers.ts';

import type { WorkerAnswer, WorkerRequest } from './protocol.ts';

/** A request as a caller writes it: the identifier is added when it is sent. */
type Call = WorkerRequest extends infer Request
  ? Request extends { id: number }
    ? Omit<Request, 'id'>
    : never
  : never;

/** What a call may ask to be told while the worker is at it. */
export interface CallOptions {
  /** Called as the run advances, so a long one can be watched. */
  onProgress?: (progress: RunProgress) => void;
  /**
   * Called with each piece of a document the worker writes, so an export is
   * taken away as it is made rather than held whole.
   */
  onChunk?: (text: string) => void;
}

interface Pending extends CallOptions {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

const pending = new Map<number, Pending>();
let worker: Worker | undefined;
let nextId = 1;

/**
 * Ask the worker for something and wait for its answer.
 *
 * One worker serves the whole page and lives as long as it does, so what it
 * has already enumerated is still there the next time the same exercise is
 * opened. Everything heavy happens there: surge itself, and the openchemlib
 * work over its answers.
 * @param request - What to do, without the identifier the call adds.
 * @param options - What to be told while it runs.
 * @returns Whatever that call answers.
 */
export function ask<T>(request: Call, options: CallOptions = {}): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      ...options,
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    current().postMessage({ ...request, id });
  });
}

/** Why a call failed when the worker was ended rather than broken. */
export class CancelledError extends Error {
  constructor() {
    super('The generation was cancelled');
    this.name = 'CancelledError';
  }
}

/**
 * Throw the worker away, and with it the run in progress. Surge cannot be
 * asked to stop from outside, so a run nobody is waiting for is ended by
 * ending the thread; every call still waiting is failed.
 */
export function cancelEverything(): void {
  if (worker === undefined) return;
  worker.terminate();
  worker = undefined;
  for (const [, waiting] of pending) {
    waiting.reject(new CancelledError());
  }
  pending.clear();
}

function current(): Worker {
  if (worker !== undefined) return worker;

  const started = new Worker(new URL('surge.worker.ts', import.meta.url), {
    type: 'module',
  });
  started.addEventListener('message', (event: MessageEvent<WorkerAnswer>) => {
    const answer = event.data;
    const waiting = pending.get(answer.id);
    if (waiting === undefined) return;
    if (answer.kind === 'progress' || answer.kind === 'chunk') {
      if (answer.kind === 'chunk') waiting.onChunk?.(answer.text);
      waiting.onProgress?.(answer.progress);
      return;
    }
    pending.delete(answer.id);
    if (answer.kind === 'failed') {
      waiting.reject(new Error(answer.message));
    } else {
      waiting.resolve(answer.value);
    }
  });
  started.addEventListener('error', (event) => {
    const message = event.message || 'The worker failed';
    for (const [, waiting] of pending) waiting.reject(new Error(message));
    pending.clear();
    if (worker === started) worker = undefined;
  });

  worker = started;
  return started;
}
