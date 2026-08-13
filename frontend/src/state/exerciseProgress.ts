import { effect, signal } from '@preact/signals-react';

import type { ProgressByFormula, ProgressStore } from './progressStore.ts';
import { localStorageProgressStore } from './progressStore.ts';

export interface ExerciseProgress {
  /** Canonical idCodes of the isomers the student found. */
  found: string[];
  /**
   * What the student actually drew for each canonical idCode they found:
   * the editor value, coordinates included. So a reload gives back their own
   * drawings rather than a layout computed from the answer, and the canvas
   * reopens on the last one they were editing.
   */
  drawings: Record<string, string>;
  /** The correction was asked for, so the answers are on screen. */
  gaveUp: boolean;
  /** How many hints of the ladder are revealed. */
  hintsRevealed: number;
}

export const EMPTY_PROGRESS: ExerciseProgress = {
  found: [],
  drawings: {},
  gaveUp: false,
  hintsRevealed: 0,
};

/**
 * What the student found, kept per molecular formula rather than per set, so
 * the same formula in two courses is the same piece of work. Every change goes
 * to the store bound below — the browser, unless a course bound another one.
 */
export const progress = {
  byFormula: signal<ProgressByFormula>({}),
};

let store: ProgressStore = localStorageProgressStore;

/** Which binding the results are going to. */
export function progressStore(): ProgressStore {
  return store;
}

/**
 * Send the results somewhere else than the browser, and start from what that
 * binding already holds. Bind it before the first exercise is opened.
 * @param next - The binding to use from now on.
 * @returns Once what it holds has been read.
 */
export async function setProgressStore(next: ProgressStore): Promise<void> {
  store = next;
  progress.byFormula.value = await next.load();
}

progress.byFormula.value = asLoaded(store.load());

// Not `effect` around an await: the signal is read synchronously so the
// subscription is on the value itself, whatever the binding then does with it.
effect(() => {
  const byFormula = progress.byFormula.value;
  void store.save(byFormula);
});

function asLoaded(
  loaded: ProgressByFormula | Promise<ProgressByFormula>,
): ProgressByFormula {
  if (loaded instanceof Promise) {
    // A binding that answers over the network fills the page in when it does.
    void loaded.then((byFormula) => {
      progress.byFormula.value = byFormula;
    });
    return {};
  }
  return loaded;
}

/**
 * What the student has already done for one formula. Read over the defaults,
 * so an entry written by an older version of the page is missing a field
 * rather than broken by it.
 * @param mf - Molecular formula of the exercise.
 * @returns Its progress, empty when it was never opened.
 */
export function progressOf(mf: string): ExerciseProgress {
  const stored = progress.byFormula.value[mf];
  return stored ? { ...EMPTY_PROGRESS, ...stored } : EMPTY_PROGRESS;
}

/**
 * The drawing the student made for one of the isomers they found.
 * @param mf - Molecular formula of the exercise.
 * @param idCode - Canonical idCode of the answer.
 * @returns The editor value, coordinates included, or the canonical idCode
 * when the answer was found before drawings were kept.
 */
export function drawingOf(mf: string, idCode: string): string {
  return progressOf(mf).drawings[idCode] ?? idCode;
}

/**
 * The structure the canvas should reopen on: the last answer that was
 * accepted, since editing it is how the next isomer is reached.
 * @param mf - Molecular formula of the exercise.
 * @returns The editor value, empty when nothing was found yet.
 */
export function lastDrawing(mf: string): string {
  const { found } = progressOf(mf);
  const last = found.at(-1);
  return last === undefined ? '' : drawingOf(mf, last);
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
  progress.byFormula.value = {
    ...progress.byFormula.value,
    [mf]: { ...progressOf(mf), ...patch },
  };
}

/** Forget everything found in every exercise. */
export function clearProgress(): void {
  progress.byFormula.value = {};
}
