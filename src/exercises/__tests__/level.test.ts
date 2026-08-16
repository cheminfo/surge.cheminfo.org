import { expect, test } from 'vitest';

import { levelOfCount, sortByDifficulty } from '../level.ts';

test('a handful of isomers is a beginner exercise', () => {
  expect(levelOfCount(1)).toBe('beginner');
  expect(levelOfCount(5)).toBe('beginner');
});

test('up to fifteen is intermediate', () => {
  expect(levelOfCount(6)).toBe('intermediate');
  expect(levelOfCount(15)).toBe('intermediate');
});

test('over fifteen is advanced', () => {
  expect(levelOfCount(16)).toBe('advanced');
  expect(levelOfCount(26)).toBe('advanced');
});

test('a set is walked through from the easiest formula to the hardest', () => {
  expect(
    sortByDifficulty([
      { mf: 'C4H8O', count: 26 },
      { mf: 'C5H12', count: 3 },
      { mf: 'C4H10O', count: 7 },
      { mf: 'C3H8', count: 1 },
    ]),
  ).toStrictEqual([
    { mf: 'C3H8', count: 1 },
    { mf: 'C5H12', count: 3 },
    { mf: 'C4H10O', count: 7 },
    { mf: 'C4H8O', count: 26 },
  ]);
});

test('formulas asking for as many isomers keep the order they came in', () => {
  expect(
    sortByDifficulty([
      { mf: 'C2H7N', count: 2 },
      { mf: 'CH5N', count: 1 },
      { mf: 'C3H6', count: 2 },
    ]),
  ).toStrictEqual([
    { mf: 'CH5N', count: 1 },
    { mf: 'C2H7N', count: 2 },
    { mf: 'C3H6', count: 2 },
  ]);
});
