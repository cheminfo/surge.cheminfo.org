import { expect, test } from 'vitest';

import type { RowBox } from '../dropGap.ts';
import { gapAt } from '../dropGap.ts';

/* Three columns of 100, a 20 wide gutter between them, and two lines of 30. */
const BOXES: RowBox[] = [
  { left: 0, right: 100, top: 0, bottom: 30 },
  { left: 120, right: 220, top: 0, bottom: 30 },
  { left: 240, right: 340, top: 0, bottom: 30 },
  { left: 0, right: 100, top: 32, bottom: 62 },
  { left: 120, right: 220, top: 32, bottom: 62 },
];

test('the left half of a row is the gap before it', () => {
  expect(gapAt(BOXES, 130, 15)).toBe(1);
});

test('the right half of a row is the gap after it', () => {
  expect(gapAt(BOXES, 210, 15)).toBe(2);
});

test('the gutter belongs to the row it is nearest', () => {
  expect(gapAt(BOXES, 105, 15)).toBe(1);
  expect(gapAt(BOXES, 115, 15)).toBe(1);
});

test('the ends of the list are the first and the last gap', () => {
  expect(gapAt(BOXES, -20, 15)).toBe(0);
  expect(gapAt(BOXES, 400, 15)).toBe(3);
});

test('a pointer on the second line never lands on the first', () => {
  expect(gapAt(BOXES, 130, 50)).toBe(4);
  expect(gapAt(BOXES, 210, 50)).toBe(5);
});

test('a pointer past the last row of a line stays on that line', () => {
  expect(gapAt(BOXES, 300, 50)).toBe(5);
});

test('an empty list has no gap', () => {
  expect(gapAt([], 10, 10)).toBe(null);
});
