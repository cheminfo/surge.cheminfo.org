import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import { enhanceSmiles } from '../enhanceSmiles.ts';

const PENTENES = [
  'CC(=C)CC',
  'CC(C)=CC',
  'CC(C)C=C',
  'CC1(C)CC1',
  'CC1CCC1',
  'CC1C(C)C1',
  'CCC=CC',
  'CCCC=C',
  'CCC1CC1',
  'C1CCCC1',
];

test('every structure is returned when the limit allows it', () => {
  const result = enhanceSmiles(PENTENES, { limit: 100 });

  expect(result.found).toBe(10);
  expect(result.matched).toBe(10);
  expect(result.entries).toHaveLength(10);
  expect(result.entries[0]).toStrictEqual({ smiles: 'CC(=C)CC' });
});

test('the limit caps what is returned, not what is counted', () => {
  const result = enhanceSmiles(PENTENES, { limit: 3 });

  expect(result.found).toBe(10);
  expect(result.entries).toHaveLength(3);
  expect(result.entries.map((entry) => entry.smiles)).toStrictEqual([
    'CC(=C)CC',
    'CC(C)=CC',
    'CC(C)C=C',
  ]);
});

test('a repeated SMILES is counted once', () => {
  const result = enhanceSmiles(['CCCC=C', 'CCCC=C', 'C1CCCC1'], { limit: 100 });

  expect(result.found).toBe(2);
  expect(result.entries).toHaveLength(2);
});

test('the idCode is appended when it is asked for', () => {
  const result = enhanceSmiles(['CCCC=C'], { limit: 10, idCode: true });

  expect(result.entries).toStrictEqual([
    { smiles: 'CCCC=C', idCode: 'gJP@DkVh@' },
  ]);
});

test('two Kekulé structures of one ring collapse into a single idCode', () => {
  const result = enhanceSmiles(['c1ccccc1', 'C1=CC=CC=C1'], {
    limit: 10,
    idCode: true,
  });

  expect(result.found).toBe(2);
  expect(result.entries).toHaveLength(1);
});

test('a fragment keeps only the structures containing it', () => {
  const cyclopropane = Molecule.fromSmiles('C1CC1');
  const result = enhanceSmiles(PENTENES, {
    limit: 100,
    fragmentCode: cyclopropane.getIDCode(),
  });

  expect(result.matched).toBe(3);
  expect(result.entries.map((entry) => entry.smiles)).toStrictEqual([
    'CC1(C)CC1',
    'CC1C(C)C1',
    'CCC1CC1',
  ]);
});

test('a filtered scan that stopped early does not report a count', () => {
  const cyclopropane = Molecule.fromSmiles('C1CC1');
  const result = enhanceSmiles(PENTENES, {
    limit: 100,
    fragmentCode: cyclopropane.getIDCode(),
    maxParsed: 4,
  });

  expect(result.found).toBe(10);
  expect(result.matched).toBeUndefined();
  expect(result.entries).toHaveLength(1);
});

test('a filtered scan says how far it is, and ends on the whole set', () => {
  const cyclopropane = Molecule.fromSmiles('C1CC1');
  const lines = new Array<string>(2500);
  for (let index = 0; index < lines.length; index++) {
    lines[index] = index % 2 === 0 ? 'CCC1CC1' : 'CCCC=C';
  }
  const reported: Array<[number, number]> = [];

  enhanceSmiles(
    lines,
    { limit: 10, fragmentCode: cyclopropane.getIDCode(), maxParsed: 10_000 },
    (scanned, total) => reported.push([scanned, total]),
  );

  expect(reported).toStrictEqual([
    [1000, 2500],
    [2000, 2500],
    [2500, 2500],
  ]);
});

test('a scan with nothing to parse reports nothing to wait for', () => {
  const reported: number[] = [];

  const result = enhanceSmiles(PENTENES, { limit: 100 }, (scanned) =>
    reported.push(scanned),
  );

  expect(result.entries).toHaveLength(10);
  expect(reported).toStrictEqual([]);
});

test('a SMILES openchemlib cannot read is skipped, not fatal', () => {
  const result = enhanceSmiles(['CCCC=C', 'not a smiles'], {
    limit: 10,
    idCode: true,
  });

  expect(result.found).toBe(2);
  expect(result.entries).toHaveLength(1);
});
