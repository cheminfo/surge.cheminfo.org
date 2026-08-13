import { expect, test } from 'vitest';

import { buildHints } from '../hints.ts';

const CONSTITUTION_HINT =
  'Only the connectivity counts. Two structures that differ solely by the shape you drew, or by stereochemistry, are the same answer.';

test('a saturated formula says so and ends with the constitution rule', () => {
  const hints = buildHints('C5H12');

  expect(hints).toHaveLength(3);
  expect(hints[0]).toBe(
    'The degree of unsaturation is 0: every answer is acyclic and saturated, so only the skeleton changes.',
  );
  expect(hints[2]).toBe(CONSTITUTION_HINT);
});

test('one degree of unsaturation is spelled out as a ring or a double bond', () => {
  expect(buildHints('C4H8')[0]).toBe(
    'The degree of unsaturation is 1: each answer holds exactly one ring or one double bond, never both.',
  );
});

test('several degrees of unsaturation name the count', () => {
  expect(buildHints('C6H6')[0]).toBe(
    'The degree of unsaturation is 4: each answer holds that many rings and multiple bonds together, a triple bond counting for two.',
  );
});

test('a saturated oxygen formula offers no carbonyl, which it cannot hold', () => {
  expect(buildHints('C4H10O')).toContain(
    'With oxygen, look for alcohols and ethers.',
  );
});

test('a second oxygen brings in peroxides and diols', () => {
  expect(buildHints('C3H8O2')).toContain(
    'With oxygen, look for alcohols, ethers, peroxides and diols.',
  );
});

test('a carbonyl is offered once the formula allows one', () => {
  expect(buildHints('C3H6O')).toContain(
    'With oxygen, look for alcohols, ethers, aldehydes, ketones and enols.',
  );
});

test('a saturated amine formula is not told to look for nitriles', () => {
  const hints = buildHints('C3H9N');

  expect(hints).toContain(
    'With nitrogen, look for primary, secondary and tertiary amines.',
  );
  expect(hints.join(' ')).not.toContain('nitrile');
  expect(hints.join(' ')).not.toContain('imine');
});

test('one degree of unsaturation allows an imine but not yet a nitrile', () => {
  const hints = buildHints('C3H7N');

  expect(hints).toContain(
    'With nitrogen, look for primary, secondary and tertiary amines and imines.',
  );
  expect(hints.join(' ')).not.toContain('nitrile');
});

test('two degrees of unsaturation finally allow a nitrile', () => {
  expect(buildHints('C3H5N')).toContain(
    'With nitrogen, look for primary, secondary and tertiary amines, imines and nitriles.',
  );
});

test('a halogen is a substituent on whichever atom carries it', () => {
  expect(buildHints('C4H8Cl2')).toContain(
    'A halogen only ever makes one bond, so it is a substituent: the question is which atom carries it.',
  );
});

test('two different halogens do not repeat the same sentence', () => {
  const hints = buildHints('C2H2ClBr');
  const halogen = hints.filter((hint) => hint.startsWith('A halogen'));

  expect(halogen).toHaveLength(1);
});

test('a radical formula gets no counting hint, because half a degree means nothing', () => {
  const hints = buildHints('C2H5');

  expect(hints.join(' ')).not.toContain('degree of unsaturation');
  expect(hints).toContain(CONSTITUTION_HINT);
});

test('a formula no parser understands still gets the general hint', () => {
  const hints = buildHints('C4H11Nx');

  expect(hints).toStrictEqual([CONSTITUTION_HINT]);
});
