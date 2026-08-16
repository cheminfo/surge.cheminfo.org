import { checkStructure, fetchAnswers, fetchExercise } from '../api/surge.ts';
import { errorMessage } from '../utils/errorMessage.ts';

import { refreshProgressHints } from './exerciseHints.ts';
import {
  EMPTY_PROGRESS,
  clearProgress,
  progressOf,
  updateProgress,
} from './exerciseProgress.ts';
import { loadSetFromAddress } from './exerciseSets.ts';
import type { Feedback } from './exerciseState.ts';
import { data, isWanted, setWanted, view } from './exerciseState.ts';
import { navigate, searchParameter } from './router.ts';

export {
  drawingOf,
  lastDrawing,
  progress,
  progressOf,
} from './exerciseProgress.ts';
export type { ExerciseProgress } from './exerciseProgress.ts';
export { hintLadder, revealHint } from './exerciseHints.ts';
export {
  foldInstructionsOnDrawing,
  preferences as instructionPreferences,
  setShowInstructions,
} from './exercisePreferences.ts';
export type { Feedback, Hint } from './exerciseState.ts';
export { data, view } from './exerciseState.ts';

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
    view.error.value = errorMessage(error);
  } finally {
    view.isLoadingSet.value = false;
  }
}

/**
 * Open one exercise of the set.
 * @param mf - Molecular formula of the exercise.
 */
export async function openExercise(mf: string): Promise<void> {
  setWanted(mf);
  view.isLoadingExercise.value = true;
  view.feedback.value = null;
  view.error.value = '';
  data.answers.value = null;
  data.progressHints.value = [];
  // Replaced rather than pushed: the address records where the student is, and
  // the back button should leave the activity, not walk back through every
  // exercise they looked at.
  navigate('exercises', { exercise: mf }, { replace: true });
  try {
    const exercise = await fetchExercise(mf);
    if (!isWanted(mf)) return;
    data.current.value = exercise;
    await refreshProgressHints(mf);
    if (progressOf(mf).gaveUp) await revealAnswers(mf);
  } catch (error) {
    if (!isWanted(mf)) return;
    data.current.value = null;
    view.error.value = errorMessage(error);
  } finally {
    if (isWanted(mf)) view.isLoadingExercise.value = false;
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
    if (!isWanted(exercise.mf)) return;

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

    updateProgress(exercise.mf, {
      found: [...current.found, result.idCode],
      // Keep the drawing itself, so a reload gives back the student's own
      // structures and the canvas reopens on the last one.
      drawings: { ...current.drawings, [result.idCode]: idCode.trim() },
    });
    view.feedback.value = {
      intent: 'success',
      message:
        current.found.length + 1 === exercise.count
          ? 'That is the last one. Every isomer found!'
          : 'Correct, that one counts. It stays on the canvas: move a branch to reach the next one.',
    };
    await refreshProgressHints(exercise.mf);
  } catch (error) {
    if (isWanted(exercise.mf)) {
      view.feedback.value = { intent: 'danger', message: errorMessage(error) };
    }
  } finally {
    view.isChecking.value = false;
  }
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
  startOver(mf);
}

/** Forget everything found in every exercise. */
export function clearAllProgress(): void {
  clearProgress();
  startOver(data.current.peek()?.mf);
}

/**
 * Put the page back where an untouched exercise starts: no correction, no
 * feedback, an empty canvas, and a ladder built from nothing found.
 * @param mf - Formula being worked on, when there is one.
 */
function startOver(mf: string | undefined): void {
  data.answers.value = null;
  view.feedback.value = null;
  view.editorGeneration.value++;
  if (mf) void refreshProgressHints(mf);
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
    if (isWanted(mf)) data.answers.value = answers;
  } catch (error) {
    if (isWanted(mf)) view.error.value = errorMessage(error);
  }
}
