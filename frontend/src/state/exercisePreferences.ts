import { signal } from '@preact/signals-react';

import { persistBucket } from './persist.ts';

/**
 * How the page is laid out for this student, kept between visits. The canvas
 * is what the page is for, so the instructions give it their room as soon as
 * one starts drawing.
 */
export const preferences = persistBucket('surge:exercises-view:v1', {
  /** Whether the instructions are open. */
  showInstructions: signal(true),
  /**
   * The one automatic fold has happened. From then on the instructions are
   * wherever the student left them: a text they reopened is not taken away
   * again on the next stroke.
   */
  instructionsFolded: signal(false),
});

/**
 * Open or fold the instructions, because the student asked for it.
 * @param show - Whether they are shown from now on.
 */
export function setShowInstructions(show: boolean): void {
  preferences.instructionsFolded.value = true;
  preferences.showInstructions.value = show;
}

/**
 * Fold the instructions the first time something is drawn: a text that has
 * been read is worth less than the room it takes. Does nothing once the
 * student has said what they want.
 */
export function foldInstructionsOnDrawing(): void {
  if (preferences.instructionsFolded.peek()) return;
  preferences.instructionsFolded.value = true;
  preferences.showInstructions.value = false;
}
