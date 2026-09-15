import type { ProgressRecords, ProgressStore } from 'react-cheminfo/core';
import { localStorageProgressStore as browserProgressStore } from 'react-cheminfo/core';

import type { ExerciseProgress } from './exerciseProgress.ts';

/** Everything a student has done, keyed by molecular formula. */
export type ProgressByFormula = ProgressRecords<ExerciseProgress>;

/**
 * Where the results of the exercises are kept. The browser is the only
 * binding there is today; a course hosting its own service implements the
 * same two calls and is plugged in with `setProgressStore`, without anything
 * else in the page knowing where the work went.
 */
export type SurgeProgressStore = ProgressStore<ExerciseProgress>;

/** What an exercise nobody has touched starts from. */
export const EMPTY_PROGRESS: ExerciseProgress = {
  found: [],
  drawings: {},
  gaveUp: false,
  hintsRevealed: 0,
};

/**
 * The default binding: `localStorage`, keyed by formula. Best effort on both
 * sides — a page framed in a course may have no storage at all, and losing
 * what was found must never break the exercise. A stored field whose shape is
 * not the one its default names is dropped, so an entry written by an older
 * version of the page opens on the defaults rather than on nonsense.
 */
export const localStorageProgressStore: SurgeProgressStore =
  browserProgressStore<ExerciseProgress>({
    key: 'surge:exercises',
    version: 1,
    defaults: EMPTY_PROGRESS,
  });
