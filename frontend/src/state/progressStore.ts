import type { ExerciseProgress } from './exerciseProgress.ts';

/** Everything a student has done, keyed by molecular formula. */
export type ProgressByFormula = Record<string, ExerciseProgress>;

/**
 * Where the results of the exercises are kept. The browser is the only
 * binding there is today; a course hosting its own service implements the
 * same two calls and is plugged in with `setProgressStore`, without anything
 * else in the page knowing where the work went.
 */
export interface ProgressStore {
  /** How the binding names itself, for a message about it. */
  readonly name: string;
  /**
   * Give back everything that was stored. A binding that answers over the
   * network returns a promise; what it resolves to replaces whatever the page
   * started from.
   */
  load: () => ProgressByFormula | Promise<ProgressByFormula>;
  /** Keep everything, as it stands after a change. */
  save: (byFormula: ProgressByFormula) => void | Promise<void>;
}

/** Namespaced and versioned, so a future shape can ignore today's entries. */
const STORAGE_KEY = 'surge:exercises:v1';

/**
 * The default binding: `localStorage`, keyed by formula. Best effort on both
 * sides — a page framed in a course may have no storage at all, and losing
 * what was found must never break the exercise.
 */
export const localStorageProgressStore: ProgressStore = {
  name: 'this browser',
  load(): ProgressByFormula {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : null;
      return isProgressByFormula(parsed) ? parsed : {};
    } catch {
      return {};
    }
  },
  save(byFormula: ProgressByFormula): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(byFormula));
    } catch {
      // quota exceeded or storage partitioned away: the work simply does not
      // survive the reload
    }
  },
};

function isProgressByFormula(value: unknown): value is ProgressByFormula {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
