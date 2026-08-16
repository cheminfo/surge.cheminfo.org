import { expect, test } from 'vitest';

import {
  foldInstructionsOnDrawing,
  preferences,
  setShowInstructions,
} from '../exercisePreferences.ts';

test('the first drawing folds the instructions, and nothing after it does', () => {
  expect(preferences.showInstructions.value).toBe(true);

  foldInstructionsOnDrawing();
  expect(preferences.showInstructions.value).toBe(false);

  // Reopened by the student: the next stroke leaves them alone.
  setShowInstructions(true);
  foldInstructionsOnDrawing();
  expect(preferences.showInstructions.value).toBe(true);
});
