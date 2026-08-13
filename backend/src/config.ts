import { env } from 'node:process';

import { parseTrustProxy } from './utils/parseTrustProxy.ts';

/**
 * Read a positive integer from the environment.
 * @param name - Variable name.
 * @param fallback - Value used when unset or not a number.
 * @param minimum - Smallest accepted value.
 * @returns The configured value.
 */
function integer(name: string, fallback: number, minimum = 1): number {
  const value = Number(env[name]);
  return Number.isFinite(value) && value >= minimum ? value : fallback;
}

export const config = {
  /** Derived from the project creation date, 2023-12-28. */
  port: integer('PORT', 31228),
  host: env.HOST ?? '0.0.0.0',
  trustProxy: parseTrustProxy(env.TRUST_PROXY),
  /** Explicit path to the surge executable; otherwise it is looked up. */
  surgePath: env.SURGE_PATH,
  /** How many surge processes may run at the same time. */
  maxParallelGenerations: integer('MAX_PARALLEL_GENERATIONS', 4),
  /** How many requests may wait for a free slot before the API answers 503. */
  maxQueuedGenerations: integer('MAX_QUEUED_GENERATIONS', 32, 0),
  /** Largest `timeout` a caller may ask for, in seconds. */
  maxTimeoutSeconds: integer('MAX_TIMEOUT_SECONDS', 30),
  /** Largest `limit` a caller may ask for. */
  maxLimit: integer('MAX_LIMIT', 100_000),
  /**
   * Surge is killed once it has written this many bytes. Its output is copied
   * a few times on the way to a response — joined, split into lines, then
   * deduplicated — so the peak heap is roughly six times this value. 32 MiB is
   * what fits the 1 GB the compose files give the container.
   */
  maxOutputBytes: integer('MAX_OUTPUT_BYTES', 32 * 1024 * 1024),
};
