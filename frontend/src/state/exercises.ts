import { signal } from '@preact/signals-react';

import type { Exercise, ExerciseAnswer, ExerciseSet } from '../api/surge.ts';
import { checkStructure, fetchAnswers, fetchExercise } from '../api/surge.ts';

import {
  EMPTY_PROGRESS,
  clearProgress,
  progressOf,
  updateProgress,
} from './exerciseProgress.ts';
import { loadSetFromAddress } from './exerciseSets.ts';
import { navigate, searchParameter } from './router.ts';

export { progress, progressOf } from './exerciseProgress.ts';
export type { ExerciseProgress } from './exerciseProgress.ts';

export interface Feedback {
  intent: 'success' | 'warning' | 'danger';
  message: string;
  /** Formula of the structure that was refused, when that is the reason. */
  mf?: string;
}

export const data = {
  set: signal<ExerciseSet | null>(null),
  current: signal<Exercise | null>(null),
  answers: signal<ExerciseAnswer[] | null>(null),
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

/** Load the set the address names, then open an exercise of it. */
export async function loadSet(): Promise<void> {
  view.isLoadingSet.value = true;
  view.error.value = '';
  try {
    const set = await loadSetFromAddress();
    data.set.value = set;

    const asked = searchParameter('exercise');
    const target =
      set.exercises.find((exercise) => exercise.mf === asked) ??
      set.exercises[0];
    if (target) await openExercise(target.mf);
  } catch (error) {
    data.set.value = null;
    view.error.value = describe(error);
  } finally {
    view.isLoadingSet.value = false;
  }
}

/**
 * Open one exercise of the set.
 * @param mf - Molecular formula of the exercise.
 */
export async function openExercise(mf: string): Promise<void> {
  wanted = mf;
  view.isLoadingExercise.value = true;
  view.feedback.value = null;
  view.error.value = '';
  data.answers.value = null;
  // Replaced rather than pushed: the address records where the student is, and
  // the back button should leave the activity, not walk back through every
  // exercise they looked at.
  navigate('exercises', { exercise: mf }, { replace: true });
  try {
    const exercise = await fetchExercise(mf);
    if (wanted !== mf) return;
    data.current.value = exercise;
    if (progressOf(mf).gaveUp) await revealAnswers(mf);
  } catch (error) {
    if (wanted !== mf) return;
    data.current.value = null;
    view.error.value = describe(error);
  } finally {
    if (wanted === mf) view.isLoadingExercise.value = false;
  }
}

/**
 * Open the exercise the address names, when the browser moved without us —
 * the back and forward buttons.
 */
export function syncFromAddress(): void {
  const asked = searchParameter('exercise');
  if (!asked || asked === data.current.peek()?.mf) return;
  if (!data.set.peek()?.exercises.some((exercise) => exercise.mf === asked)) {
    return;
  }
  void openExercise(asked);
}

/**
 * Submit a drawn structure as one of the isomers to find.
 * @param idCode - What the editor holds, coordinates included.
 */
export async function submitStructure(idCode: string): Promise<void> {
  const exercise = data.current.peek();
  if (!exercise) return;

  view.isChecking.value = true;
  try {
    const result = await checkStructure(exercise.mf, idCode);
    // The student may have moved on while surge was working.
    if (wanted !== exercise.mf) return;

    if (!result.correct) {
      view.feedback.value = refusal(result.reason, result.mf);
      return;
    }

    const current = progressOf(exercise.mf);
    if (current.found.includes(result.idCode)) {
      view.feedback.value = {
        intent: 'warning',
        message: 'You had already found this one — try another skeleton.',
      };
      return;
    }

    updateProgress(exercise.mf, { found: [...current.found, result.idCode] });
    view.editorGeneration.value++;
    view.feedback.value = {
      intent: 'success',
      message:
        current.found.length + 1 === exercise.count
          ? 'That is the last one. Every isomer found!'
          : 'Correct, that is one of them.',
    };
  } catch (error) {
    if (wanted === exercise.mf) {
      view.feedback.value = { intent: 'danger', message: describe(error) };
    }
  } finally {
    view.isChecking.value = false;
  }
}

/** Reveal the next hint of the exercise being solved. */
export function revealHint(): void {
  const exercise = data.current.peek();
  if (!exercise) return;
  const { hintsRevealed } = progressOf(exercise.mf);
  updateProgress(exercise.mf, {
    hintsRevealed: Math.min(hintsRevealed + 1, exercise.hints.length),
  });
}

/** Show the correction of the exercise being solved. */
export async function giveUp(): Promise<void> {
  const exercise = data.current.peek();
  if (!exercise) return;
  updateProgress(exercise.mf, { gaveUp: true });
  await revealAnswers(exercise.mf);
}

/**
 * Forget everything found for one exercise and hide its correction.
 * @param mf - Molecular formula of the exercise.
 */
export function resetExercise(mf: string): void {
  updateProgress(mf, { ...EMPTY_PROGRESS });
  data.answers.value = null;
  view.feedback.value = null;
  view.editorGeneration.value++;
}

/** Forget everything found in every exercise. */
export function clearAllProgress(): void {
  clearProgress();
  data.answers.value = null;
  view.feedback.value = null;
  view.editorGeneration.value++;
}

function refusal(reason: string, mf: string): Feedback {
  if (reason === 'wrong-formula') {
    return {
      intent: 'danger',
      message: 'That structure has the wrong molecular formula:',
      mf,
    };
  }
  return {
    intent: 'danger',
    message:
      'The formula is right, but that structure is not one of the isomers. Check the valences and the charges.',
  };
}

async function revealAnswers(mf: string): Promise<void> {
  try {
    const answers = await fetchAnswers(mf);
    // Never show one exercise's correction under another one.
    if (wanted === mf) data.answers.value = answers;
  } catch (error) {
    if (wanted === mf) view.error.value = describe(error);
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
