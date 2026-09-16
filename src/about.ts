/**
 * What this site says about itself, read by the shared About page.
 *
 * The prose is content, never markup: the page draws it, so every About of the
 * family holds the same sections in the same order and one voice.
 */

import { BUILD_INFO } from 'react-cheminfo/build-info';
import type { AboutContent } from 'react-cheminfo/core';

import { SURGE_WORKS } from './data/papers.ts';

export const ABOUT: AboutContent = {
  siteId: 'surge',
  // Which release, built when, from which commit: the build says so,
  // because a version written by hand is wrong by the next release.
  build: BUILD_INFO,
  what: 'Type a molecular formula and get every constitutional isomer of it, enumerated by Surge running in your browser.',
  can: [
    'Enumerate every constitutional isomer of a molecular formula, in your browser.',
    'Restrict the search by triple bonds, rings, planarity and nine substructure filters.',
    'Keep only the isomers that contain a fragment you draw.',
    'Export what was generated as SMILES, as openchemlib idCodes, or as an SDF.',
    'Draw the isomers yourself in 23 exercises, with hints read off what you drew.',
    'Share a link, or an iframe carrying the formula and the restrictions.',
  ],
  paragraphs: [
    'Surge does the enumerating, carried as WebAssembly and run in a worker of your browser: nothing is uploaded and nothing is queued. The count grows very quickly with the formula, so past a certain size the enumeration cannot finish — and the answer says so rather than pretending to be complete.',
    'Only connectivity is enumerated. A crossed double bond is one that is either cis or trans: stereochemistry is not taken into account, so two structures that differ only by it are one answer.',
  ],
  credits: [
    'openchemlib',
    'react-ocl',
    'react-mf',
    'mass-tools',
    'blueprint',
    'react-cheminfo',
    'react',
    'vite',
  ],
  cite: SURGE_WORKS,
};
