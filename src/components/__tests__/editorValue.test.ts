import { expect, test } from 'vitest';

import {
  countAtoms,
  drawnFormula,
  isFormula,
  splitEditorValue,
} from '../editorValue.ts';

/** Butane, as the editor hands it over with and without its coordinates. */
const BUTANE = 'gC`@Dij@@';
const DRAWN_BUTANE = 'gC`@Dij@@ !B@Fq?[@@S';
/** What an erased canvas holds: an idCode, of nothing. */
const EMPTY_CANVAS = 'd@';

test('the coordinates are taken off the idCode', () => {
  expect(splitEditorValue(DRAWN_BUTANE)).toStrictEqual({
    idCode: BUTANE,
    coordinates: '!B@Fq?[@@S',
  });
});

test('a value without coordinates carries none', () => {
  expect(splitEditorValue(` ${BUTANE} `)).toStrictEqual({ idCode: BUTANE });
});

test('an empty value has no idCode at all', () => {
  expect(splitEditorValue(' '.repeat(3))).toStrictEqual({ idCode: '' });
});

test('an erased canvas holds no atom', () => {
  expect(countAtoms(EMPTY_CANVAS)).toBe(0);
  expect(countAtoms('')).toBe(0);
  expect(drawnFormula(EMPTY_CANVAS)).toBe('');
});

test('the formula of a drawing is read off the drawing', () => {
  expect(countAtoms(DRAWN_BUTANE)).toBe(4);
  expect(drawnFormula(DRAWN_BUTANE)).toBe('C4H10');
});

test('a drawing is recognized as the formula it holds', () => {
  expect(isFormula(DRAWN_BUTANE, 'C4H10')).toBe(true);
  // The same atoms, written the way another parser would.
  expect(isFormula(DRAWN_BUTANE, 'H10C4')).toBe(true);
  expect(isFormula(DRAWN_BUTANE, 'C4H8')).toBe(false);
  expect(isFormula(DRAWN_BUTANE, 'C4H10O')).toBe(false);
  expect(isFormula(EMPTY_CANVAS, 'C4H10')).toBe(false);
});
