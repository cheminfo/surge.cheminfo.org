import { expect, test } from 'vitest';

import type { StructureEntry } from '../../../api/surge.ts';
import { exportFileName, exportPreview, previewOf } from '../exportResult.ts';

/** Ethanol and dimethyl ether, as the search returns them. */
const ENTRIES: StructureEntry[] = [
  { smiles: 'CCO', idCode: 'eMHAIh@' },
  { smiles: 'COC', idCode: 'eMHBN`@' },
];

test('the file name is the formula and the extension of the format', () => {
  expect(exportFileName('C4H10O', 'smiles')).toBe('C4H10O.smi');
  expect(exportFileName('C4H10O', 'idcode')).toBe('C4H10O.txt');
  expect(exportFileName(' my isomers ', 'sdf')).toBe('my isomers.sdf');
  expect(exportFileName('  ', 'sdf')).toBe('surge.sdf');
});

test('the preview shows the head of the document', () => {
  expect(exportPreview(ENTRIES, 'smiles', 60)).toStrictEqual({
    text: 'CCO\nCOC',
    truncated: false,
    size: 8,
  });
  expect(exportPreview(ENTRIES, 'smiles', 1)).toStrictEqual({
    text: 'CCO',
    truncated: true,
    size: 8,
  });
  expect(exportPreview([], 'sdf', 60)).toStrictEqual({
    text: '',
    truncated: false,
    size: 0,
  });
});

test('what the whole document would weigh is read off the head written', () => {
  const many: StructureEntry[] = [];
  for (let index = 0; index < 100_000; index++) many.push({ smiles: 'CCO' });

  // Four bytes a line — 'CCO' and its newline — for every one of them.
  expect(exportPreview(many, 'smiles', 5).size).toBe(400_000);
});

test('a result of a hundred structures is previewed from the first of them', () => {
  const many: StructureEntry[] = [];
  for (let index = 0; index < 100; index++) many.push({ smiles: 'CCO' });

  const preview = exportPreview(many, 'smiles', 10);

  expect(preview.truncated).toBe(true);
  expect(preview.text.split('\n')).toHaveLength(10);
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
