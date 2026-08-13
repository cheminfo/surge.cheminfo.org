import { expect, test } from 'vitest';

import type { ExerciseSummary } from '../../../api/surge.ts';
import {
  arrangeExercises,
  dropFormula,
  moveFormula,
} from '../exerciseOrder.ts';

const CANDIDATES: ExerciseSummary[] = [
  { mf: 'C5H12', level: 'beginner', count: 3 },
  { mf: 'C6H14', level: 'beginner', count: 5 },
  { mf: 'C4H8', level: 'intermediate', count: 5 },
  { mf: 'C3H8', level: 'beginner', count: 1 },
];

function formulasOf(exercises: ExerciseSummary[]): string[] {
  return exercises.map((exercise) => exercise.mf);
}

test('an untouched set is handed out as it was loaded', () => {
  expect(formulasOf(arrangeExercises(CANDIDATES, []))).toStrictEqual([
    'C5H12',
    'C6H14',
    'C4H8',
    'C3H8',
  ]);
});

test('what was arranged comes first, the rest keeps its order', () => {
  expect(
    formulasOf(arrangeExercises(CANDIDATES, ['C3H8', 'C4H8'])),
  ).toStrictEqual(['C3H8', 'C4H8', 'C5H12', 'C6H14']);
});

test('an arrangement naming a formula the set no longer holds still reads', () => {
  expect(
    formulasOf(arrangeExercises(CANDIDATES, ['C7H16', 'C3H8'])),
  ).toStrictEqual(['C3H8', 'C5H12', 'C6H14', 'C4H8']);
});

test('the exercises themselves are handed back, counts included', () => {
  const arranged = arrangeExercises(CANDIDATES, ['C4H8']);
  expect(arranged[0]).toStrictEqual({
    mf: 'C4H8',
    level: 'intermediate',
    count: 5,
  });
});

test('a formula moved down lands where it was dropped', () => {
  expect(moveFormula(['a', 'b', 'c', 'd'], 0, 2)).toStrictEqual([
    'b',
    'c',
    'a',
    'd',
  ]);
});

test('a formula moved up lands where it was dropped', () => {
  expect(moveFormula(['a', 'b', 'c', 'd'], 3, 1)).toStrictEqual([
    'a',
    'd',
    'b',
    'c',
  ]);
});

test('a move past the end stops at the end', () => {
  expect(moveFormula(['a', 'b', 'c'], 0, 9)).toStrictEqual(['b', 'c', 'a']);
  expect(moveFormula(['a', 'b', 'c'], 2, -3)).toStrictEqual(['c', 'a', 'b']);
});

test('a formula dropped where it already is changes nothing', () => {
  expect(moveFormula(['a', 'b', 'c'], 1, 1)).toStrictEqual(['a', 'b', 'c']);
});

/* A gap is the place between two rows the bar is drawn in: gap 0 is before the
   first formula, gap 4 after the last of four. Dropping in it must land the
   formula exactly there, whichever side it came from. */

test('a formula dropped in a gap lands in it, coming from the left', () => {
  expect(dropFormula(['a', 'b', 'c', 'd'], 0, 3)).toStrictEqual([
    'b',
    'c',
    'a',
    'd',
  ]);
});

test('a formula dropped in a gap lands in it, coming from the right', () => {
  expect(dropFormula(['a', 'b', 'c', 'd'], 3, 1)).toStrictEqual([
    'a',
    'd',
    'b',
    'c',
  ]);
});

test('the gaps at both ends put the formula first and last', () => {
  expect(dropFormula(['a', 'b', 'c'], 2, 0)).toStrictEqual(['c', 'a', 'b']);
  expect(dropFormula(['a', 'b', 'c'], 0, 3)).toStrictEqual(['b', 'c', 'a']);
});

test('the two gaps around a formula leave it where it is', () => {
  expect(dropFormula(['a', 'b', 'c'], 1, 1)).toStrictEqual(['a', 'b', 'c']);
  expect(dropFormula(['a', 'b', 'c'], 1, 2)).toStrictEqual(['a', 'b', 'c']);
});
