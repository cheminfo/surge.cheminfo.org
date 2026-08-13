import { fetchProgressHints } from '../api/surge.ts';

import { progressOf, updateProgress } from './exerciseProgress.ts';
import type { Hint } from './exerciseState.ts';
import { data, isWanted } from './exerciseState.ts';

/**
 * The ladder of the exercise being solved: what the formula says, then what
 * comparing the answers with the structures found says. The service rebuilds
 * the whole thing from what has been found — a family the student has drawn
 * every answer of is not offered again — so what it sends replaces the opening
 * ladder rather than following it, and a revealed rung is always about where
 * they are now.
 * @returns The hints, vague first.
 */
export function hintLadder(): Hint[] {
  const exercise = data.current.value;
  if (!exercise) return [];
  const progress = data.progressHints.value;
  if (progress.length > 0) {
    return progress.map((hint) => ({
      id: hint.id || hint.kind,
      kind: hint.kind,
      text: hint.text,
    }));
  }
  // Until the service has answered — and if it never does — the exercise still
  // carries what the formula alone says.
  return exercise.hints.map((text, index) => ({
    id: `general-${index}`,
    kind: 'general' as const,
    text,
  }));
}

/** Reveal the next hint of the exercise being solved. */
export function revealHint(): void {
  const exercise = data.current.peek();
  if (!exercise) return;
  const total = data.progressHints.peek().length || exercise.hints.length;
  const { hintsRevealed } = progressOf(exercise.mf);
  updateProgress(exercise.mf, {
    hintsRevealed: Math.min(hintsRevealed + 1, total),
  });
}

/**
 * Ask the service for the ladder that fits what has been found.
 * @param mf - Molecular formula of the exercise.
 */
export async function refreshProgressHints(mf: string): Promise<void> {
  try {
    const hints = await fetchProgressHints(mf, progressOf(mf).found);
    // Advice about one formula must never show up under another.
    if (isWanted(mf)) data.progressHints.value = hints;
  } catch {
    // The ladder still holds what the formula alone says; a failure here must
    // not take the exercise down with it.
    if (isWanted(mf)) data.progressHints.value = [];
  }
}
