import { signal } from '@preact/signals-react';

import { persistBucket } from './persist.ts';

export interface ExerciseProgress {
  /** Canonical idCodes of the isomers the student found. */
  found: string[];
  /** The correction was asked for, so the answers are on screen. */
  gaveUp: boolean;
  /** How many hints of the ladder are revealed. */
  hintsRevealed: number;
}

export const EMPTY_PROGRESS: ExerciseProgress = {
  found: [],
  gaveUp: false,
  hintsRevealed: 0,
};

/**
 * What the student found, kept per molecular formula rather than per set, so
 * the same formula in two courses is the same piece of work.
 */
export const progress = persistBucket('surge:exercises:v1', {
  byFormula: signal<Record<string, ExerciseProgress>>({}),
});

/**
 * What the student has already done for one formula.
 * @param mf - Molecular formula of the exercise.
 * @returns Its progress, empty when it was never opened.
 */
export function progressOf(mf: string): ExerciseProgress {
  return progress.byFormula.value[mf] ?? EMPTY_PROGRESS;
}

/**
 * Record part of what the student did for one formula.
 * @param mf - Molecular formula of the exercise.
 * @param patch - The fields that changed.
 */
export function updateProgress(
  mf: string,
  patch: Partial<ExerciseProgress>,
): void {
  const previous = progress.byFormula.value[mf] ?? EMPTY_PROGRESS;
  progress.byFormula.value = {
    ...progress.byFormula.value,
    [mf]: { ...previous, ...patch },
  };
}

/** Forget everything found in every exercise. */
export function clearProgress(): void {
  progress.byFormula.value = {};
}
