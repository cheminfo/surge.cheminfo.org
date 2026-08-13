import { expect, test } from 'vitest';

import { buildFlags } from '../buildFlags.ts';

test('SMILES output and aromaticity filtering are on by default', () => {
  expect(buildFlags('C5H10')).toStrictEqual(['-S', '-R', 'C5H10']);
});

test('aromaticity filtering can be turned off', () => {
  expect(buildFlags('C6H6', { aromaticity: false })).toStrictEqual([
    '-S',
    'C6H6',
  ]);
});

test('boolean restrictions map to their surge flag', () => {
  const flags = buildFlags('C6H12', {
    aromaticity: false,
    disallowTripleBonds: true,
    requirePlanarity: true,
    evenRingsOnly: true,
  });

  expect(flags).toStrictEqual(['-S', '-T', '-P', '-b', 'C6H12']);
});

test('ranges keep the order surge documents them in', () => {
  const flags = buildFlags('C6H12', {
    aromaticity: false,
    limit5Rings: '1',
    limit3Rings: '0',
    limitCarbon6Rings: '1:2',
    limitBonds: '2:4',
    limit4Rings: '0',
    limit6Rings: '1',
  });

  expect(flags).toStrictEqual([
    '-S',
    '-e2:4',
    '-t0',
    '-f0',
    '-p1',
    '-h1',
    '-C1:2',
    'C6H12',
  ]);
});

test('a hyphen separates a range just as a colon does', () => {
  expect(
    buildFlags('C6H12', { aromaticity: false, limit3Rings: '1-2' }),
  ).toStrictEqual(['-S', '-t1-2', 'C6H12']);
});

test('an empty range is not a restriction', () => {
  expect(
    buildFlags('C6H12', { aromaticity: false, limit3Rings: '' }),
  ).toStrictEqual(['-S', 'C6H12']);
});

test('a range that is not a number is refused', () => {
  expect(() => buildFlags('C6H12', { limit3Rings: '2; rm -rf /' })).toThrow(
    'Invalid range "2; rm -rf /" for -t, expected # or #:#',
  );
});

test('degree and coordination are appended to their flag', () => {
  expect(
    buildFlags('C6H12', {
      aromaticity: false,
      maxDegree: 3,
      maxCoordination: 4,
    }),
  ).toStrictEqual(['-S', '-d3', '-c4', 'C6H12']);
});

test('substructure filters are collected into one numbered -B flag', () => {
  const flags = buildFlags('C6H12', {
    aromaticity: false,
    noSmallRingsTripleBonds: true,
    bredsRuleTwo: true,
    noAllene: true,
    noSmallRingsCommonAtoms: true,
  });

  expect(flags).toStrictEqual(['-S', '-B1,3,5,9', 'C6H12']);
});
