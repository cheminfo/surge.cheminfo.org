import { expect, test } from 'vitest';

import { levelOfCount } from '../level.ts';

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
