import { signal } from '@preact/signals-react';

import type { GenerateResult } from '../api/surge.ts';

import { persistBucket } from './persist.ts';

/** What the form holds, remembered between visits. */
export const preferences = persistBucket('surge:generator:v1', {
  mf: signal('C6H10O'),
  limit: signal(1000),
  timeout: signal(2),
  idCode: signal(true),
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
  /** idCode of the fragment drawn to filter the results, empty for none. */
  fragmentCode: signal(''),
  surgeVersion: signal(''),
};

export const view = {
  isGenerating: signal(false),
  error: signal(''),
  /** The whole options block, folded away so a formula is all one needs. */
  showOptions: signal(false),
  showAdvancedOptions: signal(false),
  isFragmentDialogOpen: signal(false),
  isExportDialogOpen: signal(false),
};
