import type { Signal } from '@preact/signals-react';
import { computed } from '@preact/signals-react';

import type { SurgeOptions } from '../api/surge.ts';

import { data, preferences } from './generator.ts';

export interface SwitchOption {
  /** Name of the parameter, in the request and in the address. */
  name: keyof SurgeOptions;
  signal: Signal<boolean>;
  label: string;
  /** What surge does when nothing is asked of it. */
  fallback: boolean;
}

export interface TextOption {
  /** Name of the parameter, in the request and in the address. */
  name: keyof SurgeOptions;
  signal: Signal<string>;
  label: string;
}

export const MAIN_SWITCHES: SwitchOption[] = [
  {
    name: 'aromaticity',
    signal: preferences.aromaticity,
    label: 'Keep one Kekulé structure per aromatic ring',
    fallback: true,
  },
  {
    name: 'disallowTripleBonds',
    signal: preferences.disallowTripleBonds,
    label: 'Disallow triple bonds',
    fallback: false,
  },
  {
    name: 'requirePlanarity',
    signal: preferences.requirePlanarity,
    label: 'Require planarity',
    fallback: false,
  },
  {
    name: 'evenRingsOnly',
    signal: preferences.evenRingsOnly,
    label: 'Only rings of even length',
    fallback: false,
  },
];

export const RANGES: TextOption[] = [
  {
    name: 'limitBonds',
    signal: preferences.limitBonds,
    label: 'Distinct non-H bonds',
  },
  {
    name: 'limit3Rings',
    signal: preferences.limit3Rings,
    label: 'Cycles of length 3',
  },
  {
    name: 'limit4Rings',
    signal: preferences.limit4Rings,
    label: 'Cycles of length 4',
  },
  {
    name: 'limit5Rings',
    signal: preferences.limit5Rings,
    label: 'Cycles of length 5',
  },
  {
    name: 'limit6Rings',
    signal: preferences.limit6Rings,
    label: 'Cycles of length 6',
  },
  {
    name: 'limitCarbon6Rings',
    signal: preferences.limitCarbon6Rings,
    label: 'Chord-free C6 cycles',
  },
];

/** Single integers rather than ranges; empty leaves surge on its default of 4. */
export const COUNTS: TextOption[] = [
  { name: 'maxDegree', signal: preferences.maxDegree, label: 'Maximum degree' },
  {
    name: 'maxCoordination',
    signal: preferences.maxCoordination,
    label: 'Maximum coordination',
  },
];

export const SUBSTRUCTURE_SWITCHES: SwitchOption[] = [
  {
    name: 'noSmallRingsTripleBonds',
    signal: preferences.noSmallRingsTripleBonds,
    label: 'No triple bond in a ring up to length 7',
    fallback: false,
  },
  {
    name: 'bredsRuleOne',
    signal: preferences.bredsRuleOne,
    label: "Bredt's rule, two rings sharing one bond",
    fallback: false,
  },
  {
    name: 'bredsRuleTwo',
    signal: preferences.bredsRuleTwo,
    label: "Bredt's rule, two rings sharing two bonds",
    fallback: false,
  },
  {
    name: 'bredsRuleThree',
    signal: preferences.bredsRuleThree,
    label: "Bredt's rule, two six-rings sharing three bonds",
    fallback: false,
  },
  {
    name: 'noAllene',
    signal: preferences.noAllene,
    label: 'No allene A=A=A',
    fallback: false,
  },
  {
    name: 'noAlleneInSmallRings',
    signal: preferences.noAlleneInSmallRings,
    label: 'No allene in a ring up to length 8',
    fallback: false,
  },
  {
    name: 'noK33K24',
    signal: preferences.noK33K24,
    label: 'No K33 or K24 substructure',
    fallback: false,
  },
  {
    name: 'noCone',
    signal: preferences.noCone,
    label: 'No cone of P4, no K4 with a 3-ear',
    fallback: false,
  },
  {
    name: 'noSmallRingsCommonAtoms',
    signal: preferences.noSmallRingsCommonAtoms,
    label: 'No atom in two rings of length 3 or 4',
    fallback: false,
  },
];

/** Every switch, in the order the request and the address write them. */
export const SWITCHES: SwitchOption[] = [
  ...MAIN_SWITCHES,
  ...SUBSTRUCTURE_SWITCHES,
];

/** Every typed field, ranges then single counts. */
export const TEXTS: TextOption[] = [...RANGES, ...COUNTS];

/**
 * How many restrictions are narrowing the search, the substructure filter
 * included. The options are folded away, so the count is what tells a student
 * that the list is short because something was asked of surge.
 */
export const activeRestrictionCount = computed(() => {
  let count = 0;
  for (const option of SWITCHES) {
    if (option.signal.value !== option.fallback) count++;
  }
  for (const option of TEXTS) {
    if (option.signal.value.trim() !== '') count++;
  }
  if (data.fragmentCode.value !== '') count++;
  return count;
});
