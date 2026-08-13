import { runSurge } from './runSurge.ts';

let pending: Promise<string> | undefined;

/**
 * Ask the executable which surge it is, once per process.
 * @returns The version surge prints, or `unknown` when it does not say.
 */
export function getVersion(): Promise<string> {
  if (pending === undefined) {
    pending = readVersion();
    // A run that failed because the service was momentarily saturated must not
    // be remembered, or the version stays broken until a restart.
    pending.catch(() => {
      pending = undefined;
    });
  }
  return pending;
}

async function readVersion(): Promise<string> {
  const run = await runSurge(['-help'], 5000);
  // `Make chemical graphs from a formula. Version 2.0.`
  const match = /Version (?<version>\d+(?:\.\d+)*)/.exec(
    `${run.log}\n${run.lines.join('\n')}`,
  );
  return match?.groups?.version ?? 'unknown';
}
