import { signal } from '@preact/signals-react';

import type { GenerateParameters, GenerateResult } from '../api/surge.ts';
import { generate } from '../api/surge.ts';

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
  showAdvancedOptions: signal(false),
};

/**
 * Run the generation with what the form currently holds.
 */
export async function runGeneration(): Promise<void> {
  view.isGenerating.value = true;
  view.error.value = '';
  try {
    data.result.value = await generate(buildParameters());
  } catch (error) {
    data.result.value = null;
    view.error.value = error instanceof Error ? error.message : String(error);
  } finally {
    view.isGenerating.value = false;
  }
}

function buildParameters(): GenerateParameters {
  const fragmentCode = data.fragmentCode.peek();
  return {
    mf: preferences.mf.peek(),
    limit: preferences.limit.peek(),
    timeout: preferences.timeout.peek(),
    idCode: preferences.idCode.peek(),
    ...(fragmentCode ? { fragmentCode } : {}),
    ...ranges(),
    ...counts(),
    aromaticity: preferences.aromaticity.peek(),
    disallowTripleBonds: preferences.disallowTripleBonds.peek(),
    requirePlanarity: preferences.requirePlanarity.peek(),
    evenRingsOnly: preferences.evenRingsOnly.peek(),
    noSmallRingsTripleBonds: preferences.noSmallRingsTripleBonds.peek(),
    bredsRuleOne: preferences.bredsRuleOne.peek(),
    bredsRuleTwo: preferences.bredsRuleTwo.peek(),
    bredsRuleThree: preferences.bredsRuleThree.peek(),
    noAllene: preferences.noAllene.peek(),
    noAlleneInSmallRings: preferences.noAlleneInSmallRings.peek(),
    noK33K24: preferences.noK33K24.peek(),
    noCone: preferences.noCone.peek(),
    noSmallRingsCommonAtoms: preferences.noSmallRingsCommonAtoms.peek(),
  };
}

/** An empty range is not a restriction, so it is left out of the request. */
function ranges(): Partial<GenerateParameters> {
  const all = {
    limitBonds: preferences.limitBonds.peek(),
    limit3Rings: preferences.limit3Rings.peek(),
    limit4Rings: preferences.limit4Rings.peek(),
    limit5Rings: preferences.limit5Rings.peek(),
    limit6Rings: preferences.limit6Rings.peek(),
    limitCarbon6Rings: preferences.limitCarbon6Rings.peek(),
  };
  const used: Record<string, string> = {};
  for (const [name, value] of Object.entries(all)) {
    if (value.trim() !== '') used[name] = value;
  }
  return used;
}

/** Left out when empty, so surge keeps its own default of 4. */
function counts(): Partial<GenerateParameters> {
  const all = {
    maxDegree: preferences.maxDegree.peek(),
    maxCoordination: preferences.maxCoordination.peek(),
  };
  const used: Record<string, number> = {};
  for (const [name, value] of Object.entries(all)) {
    if (value.trim() !== '') used[name] = Number(value);
  }
  return used;
}
