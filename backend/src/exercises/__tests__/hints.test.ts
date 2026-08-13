import { expect, test } from 'vitest';

import type { FragmentCount } from '../fragmentHints.ts';
import { buildCoverage } from '../hintCoverage.ts';
import { buildHints } from '../hints.ts';

/**
 * The coverage of a student who found every answer of some motifs and none of
 * the others.
 * @param entries - Motif, how many answers hold it, how many were found.
 * @returns What a hint asks before it is written.
 */
function coverage(entries: Array<[string, number, number]>) {
  return buildCoverage(
    new Map<string, FragmentCount>(
      entries.map(([id, answers, found]) => [id, { answers, found }]),
    ),
  );
}

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

test('a student who drew every cycle is sent to the multiple bonds instead', () => {
  const hints = buildHints(
    'C4H8',
    coverage([
      ['ring-3', 2, 2],
      ['ring-4', 1, 1],
      ['alkene', 5, 1],
    ]),
  );

  expect(hints[0]).toBe(
    'Every answer that holds a ring is already drawn, so what is left of the unsaturation goes into double and triple bonds.',
  );
});

test('a student who drew every multiple bond is sent to the rings instead', () => {
  const hints = buildHints(
    'C4H8',
    coverage([
      ['ring-3', 2, 0],
      ['alkene', 5, 5],
      ['alkene-terminal', 3, 3],
    ]),
  );

  expect(hints[0]).toBe(
    'Every answer that holds a multiple bond is already drawn, so what is left of the unsaturation goes into rings.',
  );
});

test('neither is suggested once both are exhausted', () => {
  const hints = buildHints(
    'C4H8',
    coverage([
      ['ring-3', 2, 2],
      ['alkene', 5, 5],
    ]),
  );

  expect(hints).toStrictEqual([
    'Every ring and every multiple bond of the answers is already drawn: what is left differs only by where the other atoms sit.',
    CONSTITUTION_HINT,
  ]);
});

test('a family the student has drawn every answer of is not offered again', () => {
  const hints = buildHints(
    'C3H6O',
    coverage([
      ['alcohol', 3, 3],
      ['ether', 1, 1],
    ]),
  );

  expect(hints).toContain(
    'With oxygen, look for aldehydes, ketones and enols.',
  );
});

test('an element whose every family is exhausted is not mentioned at all', () => {
  const hints = buildHints(
    'C4H10O',
    coverage([
      ['alcohol', 4, 4],
      ['ether', 3, 3],
    ]),
  );

  expect(hints.join(' ')).not.toContain('With oxygen');
});

test('the amines are one family, exhausted only when all three are', () => {
  const partly = buildHints(
    'C3H9N',
    coverage([
      ['amine-primary', 2, 2],
      ['amine-secondary', 1, 0],
      ['amine-tertiary', 1, 1],
    ]),
  );
  expect(partly).toContain(
    'With nitrogen, look for primary, secondary and tertiary amines.',
  );

  const wholly = buildHints(
    'C3H9N',
    coverage([
      ['amine-primary', 2, 2],
      ['amine-secondary', 1, 1],
      ['amine-tertiary', 1, 1],
    ]),
  );
  expect(wholly.join(' ')).not.toContain('With nitrogen');
});

test('a motif the answers never hold is not taken for an exhausted one', () => {
  const hints = buildHints(
    'C4H10O',
    coverage([
      ['alcohol', 0, 0],
      ['ether', 3, 3],
    ]),
  );

  expect(hints).toContain('With oxygen, look for alcohols.');
});

test('a halogen already placed everywhere is no longer pointed at', () => {
  const hints = buildHints(
    'C4H9Cl',
    coverage([
      ['halogen-on-ch2', 2, 2],
      ['halogen-on-ch', 1, 1],
      ['halogen-on-c', 1, 1],
    ]),
  );

  expect(hints.join(' ')).not.toContain('A halogen only ever makes one bond');
});

test('the skeletons are no longer walked through once they are all drawn', () => {
  const hints = buildHints(
    'C6H14',
    coverage([
      ['carbon-tertiary', 3, 3],
      ['gem-dimethyl', 2, 2],
    ]),
  );

  expect(hints.join(' ')).not.toContain('Work through the carbon skeletons');
});
