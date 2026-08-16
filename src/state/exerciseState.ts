import { signal } from '@preact/signals-react';

import type {
  Exercise,
  ExerciseAnswer,
  ExerciseSet,
  ProgressHint,
} from '../api/surge.ts';

export interface Feedback {
  intent: 'success' | 'warning' | 'danger';
  message: string;
  /** Formula of the structure that was refused, when that is the reason. */
  mf?: string;
}

export interface Hint {
  /** What the hint was built from, so the same rung keeps its identity. */
  id: string;
  kind: 'general' | 'missing' | 'partial' | 'complete';
  text: string;
}

export const data = {
  set: signal<ExerciseSet | null>(null),
  current: signal<Exercise | null>(null),
  answers: signal<ExerciseAnswer[] | null>(null),
  /**
   * The hints that depend on what has been found: which motifs of the answers
   * the student has never drawn. Reread every time one is accepted.
   */
  progressHints: signal<ProgressHint[]>([]),
};

export const view = {
  isLoadingSet: signal(false),
  isLoadingExercise: signal(false),
  isChecking: signal(false),
  feedback: signal<Feedback | null>(null),
  error: signal(''),
  /** Bumped to remount the editor once a structure has been accepted. */
  editorGeneration: signal(0),
};

/**
 * Whichever exercise the student last asked for. Every answer that comes back
 * is checked against it, so a slow request that resolves after they moved on
 * is dropped rather than shown under the wrong formula.
 */
let wanted: string | undefined;

/**
 * Record which exercise the student is on.
 * @param mf - Molecular formula of that exercise.
 */
export function setWanted(mf: string): void {
  wanted = mf;
}

/**
 * Whether an answer that just came back is still the one being waited for.
 * @param mf - Formula the answer is about.
 * @returns Whether it may be shown.
 */
export function isWanted(mf: string): boolean {
  return wanted === mf;
}
