import {
  PLATFORM_PAPER,
  aboutProblems,
  resolveAbout,
} from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { ABOUT } from '../about.ts';
import { SURGE_PAPER } from '../data/papers.ts';

test('the About record is within the length the family reads', () => {
  expect(aboutProblems(ABOUT)).toStrictEqual([]);
});

test('the About says what the tool is, in six lines', () => {
  expect(ABOUT.siteId).toBe('surge');
  expect(ABOUT.can).toHaveLength(6);
  expect(ABOUT.paragraphs).toHaveLength(2);
  expect(ABOUT.can[0]).toBe(
    'Enumerate every constitutional isomer of a molecular formula, in your browser.',
  );
});

test('the two facts the help panel carried are kept', () => {
  const [enumeration, stereochemistry] = ABOUT.paragraphs ?? [];

  expect(enumeration).toContain('the enumeration cannot finish');
  expect(stereochemistry).toContain(
    'stereochemistry is not taken into account',
  );
});

test('every borrowed work the site runs on is named, and resolves', () => {
  expect(ABOUT.credits).toStrictEqual([
    'openchemlib',
    'react-ocl',
    'react-mf',
    'mass-tools',
    'blueprint',
    'react-cheminfo',
    'react',
    'vite',
  ]);

  const about = resolveAbout(ABOUT);

  expect(about.credits.map((credit) => credit.name)).toStrictEqual([
    'OpenChemLib',
    'react-ocl',
    'react-mf',
    'mass-tools',
    'Blueprint',
    'react-cheminfo',
    'React',
    'Vite',
  ]);
  expect(about.repository).toBe(
    'https://github.com/cheminfo/surge.cheminfo.org',
  );
  expect(about.issues).toBe(
    'https://github.com/cheminfo/surge.cheminfo.org/issues',
  );
  expect(about.license).toBe('MIT');
});

test('the About asks for the same two papers as the Cite button', () => {
  const about = resolveAbout(ABOUT);

  expect(about.cite.map((work) => work.reference)).toStrictEqual([
    PLATFORM_PAPER,
    SURGE_PAPER,
  ]);
});
