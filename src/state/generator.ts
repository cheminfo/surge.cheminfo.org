import { signal } from '@preact/signals-react';

import type { GenerateResult, RunProgress } from '../api/surge.ts';

import { persistBucket } from './persist.ts';

/** What the form holds, remembered between visits. */
export const preferences = persistBucket('surge:generator:v3', {
  mf: signal('C6H10O'),
  limit: signal(1_000_000),
  timeout: signal(2),
  idCode: signal(false),
  aromaticity: signal(true),
  disallowTripleBonds: signal(false),
  requirePlanarity: signal(false),
  evenRingsOnly: signal(false),
  limitBonds: signal(''),
  limit3Rings: signal(''),
  limit4Rings: signal(''),
  limit5Rings: signal(''),
  limit6Rings: signal(''),
  limitCarbon6Rings: signal(''),
  maxDegree: signal(''),
  maxCoordination: signal(''),
  noSmallRingsTripleBonds: signal(false),
  bredsRuleOne: signal(false),
  bredsRuleTwo: signal(false),
  bredsRuleThree: signal(false),
  noAllene: signal(false),
  noAlleneInSmallRings: signal(false),
  noK33K24: signal(false),
  noCone: signal(false),
  noSmallRingsCommonAtoms: signal(false),
});

export const data = {
  result: signal<GenerateResult | null>(null),
  /**
   * The request the result on screen came from, so a form nobody touched since
   * is known to be answered already.
   */
  lastRequest: signal(''),
  /** idCode of the fragment drawn to filter the results, empty for none. */
  fragmentCode: signal(''),
  surgeVersion: signal(''),
};

export const view = {
  isGenerating: signal(false),
  /** How far the run in progress has got, or nothing before its first word. */
  progress: signal<RunProgress | null>(null),
  error: signal(''),
  /** The whole options block, folded away so a formula is all one needs. */
  showOptions: signal(false),
  showAdvancedOptions: signal(false),
  isFragmentDialogOpen: signal(false),
  isExportDialogOpen: signal(false),
};
