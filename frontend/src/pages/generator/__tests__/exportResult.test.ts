import { expect, test } from 'vitest';

import type { StructureEntry } from '../../../api/surge.ts';
import {
  exportCount,
  exportFileName,
  exportText,
  previewOf,
} from '../exportResult.ts';

/** Ethanol and dimethyl ether, as the service returns them. */
const ENTRIES: StructureEntry[] = [
  { smiles: 'CCO', idCode: 'eMHAIh@' },
  { smiles: 'COC', idCode: 'eMHBN`@' },
];

test('smiles are written one per line', () => {
  expect(exportText(ENTRIES, 'smiles')).toBe('CCO\nCOC\n');
  expect(exportCount(ENTRIES, 'smiles')).toBe(2);
});

test('idCodes are written one per line', () => {
  expect(exportText(ENTRIES, 'idcode')).toBe('eMHAIh@\neMHBN`@\n');
});

test('a search run without idCodes exports the smiles alone', () => {
  const entries: StructureEntry[] = [{ smiles: 'CCO' }];
  expect(exportText(entries, 'idcode')).toBe('');
  expect(exportCount(entries, 'idcode')).toBe(0);
  expect(exportCount(entries, 'smiles')).toBe(1);
});

test('an sdf holds one record per structure, with what identifies it', () => {
  const sdf = exportText(ENTRIES, 'sdf');
  const records = sdf.split('$$$$\n');
  expect(records).toHaveLength(3);
  expect(records[2]).toBe('');

  const first = records[0] as string;
  expect(first.split('\n', 1)[0]).toBe('CCO');
  expect(first).toContain('M  END\n');
  expect(first).toContain('>  <SMILES>\nCCO\n');
  expect(first).toContain('>  <ID_CODE>\neMHAIh@\n');
  expect(first).toContain('>  <MF>\nC2H6O\n');
  expect(first).toContain('>  <MW>\n46.07\n');
  // Three heavy atoms, with the coordinates openchemlib invents for them.
  expect(first).toContain('  3  2  0  0  0  0  0  0  0  0999 V2000');
  expect(records[1]).toContain('>  <SMILES>\nCOC\n');
});

test('an sdf can be built from the smiles alone', () => {
  const sdf = exportText([{ smiles: 'CCO' }], 'sdf');
  expect(sdf).toContain('  3  2  0  0  0  0  0  0  0  0999 V2000');
  expect(sdf).toContain('>  <MF>\nC2H6O\n');
  expect(sdf).not.toContain('ID_CODE');
});

test('nothing to export writes nothing', () => {
  expect(exportText([], 'sdf')).toBe('');
  expect(exportText([], 'smiles')).toBe('');
});

test('the file name is the formula and the extension of the format', () => {
  expect(exportFileName('C4H10O', 'smiles')).toBe('C4H10O.smi');
  expect(exportFileName('C4H10O', 'idcode')).toBe('C4H10O.txt');
  expect(exportFileName(' my isomers ', 'sdf')).toBe('my isomers.sdf');
  expect(exportFileName('  ', 'sdf')).toBe('surge.sdf');
});

test('the preview keeps the first lines and says when it cut', () => {
  expect(previewOf('a\nb\nc\n', 2)).toStrictEqual({
    text: 'a\nb',
    truncated: true,
  });
  expect(previewOf('a\nb\n', 5)).toStrictEqual({
    text: 'a\nb',
    truncated: false,
  });
  expect(previewOf('a\nb', 5)).toStrictEqual({
    text: 'a\nb',
    truncated: false,
  });
  expect(previewOf('', 5)).toStrictEqual({ text: '', truncated: false });
});
