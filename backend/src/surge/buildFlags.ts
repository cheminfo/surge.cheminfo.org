import type { SurgeOptions } from '../schemas/surgeOptions.ts';

/** Substructure sets of the `-B` flag, in the order surge numbers them. */
const SUBSTRUCTURE_FILTERS: ReadonlyArray<keyof SurgeOptions> = [
  'noSmallRingsTripleBonds',
  'bredsRuleOne',
  'bredsRuleTwo',
  'bredsRuleThree',
  'noAllene',
  'noAlleneInSmallRings',
  'noK33K24',
  'noCone',
  'noSmallRingsCommonAtoms',
];

const RANGE_FLAGS: ReadonlyArray<[keyof SurgeOptions, string]> = [
  ['limitBonds', '-e'],
  ['limit3Rings', '-t'],
  ['limit4Rings', '-f'],
  ['limit5Rings', '-p'],
  ['limit6Rings', '-h'],
  ['limitCarbon6Rings', '-C'],
];

const RANGE = /^\d+(?:[:-]\d+)?$/;

/**
 * Turn the API options into the surge command line. The formula comes last,
 * the way surge expects it, and SMILES output is always requested because
 * surge 2.0 only counts by default.
 * @param mf - Molecular formula, already normalized.
 * @param options - What to enumerate.
 * @returns The flags to spawn surge with.
 */
export function buildFlags(mf: string, options: SurgeOptions = {}): string[] {
  const flags = ['-S'];

  // Two Kekulé structures of the same aromatic ring are the same molecule, so
  // this is on unless a caller explicitly asks for the raw enumeration.
  if (options.aromaticity !== false) flags.push('-R');
  if (options.disallowTripleBonds) flags.push('-T');
  if (options.requirePlanarity) flags.push('-P');
  if (options.evenRingsOnly) flags.push('-b');

  for (const [option, flag] of RANGE_FLAGS) {
    const value = options[option];
    if (typeof value !== 'string' || value === '') continue;
    if (!RANGE.test(value)) {
      throw new Error(
        `Invalid range "${value}" for ${flag}, expected # or #:#`,
      );
    }
    flags.push(`${flag}${value}`);
  }

  if (options.maxDegree !== undefined) flags.push(`-d${options.maxDegree}`);
  if (options.maxCoordination !== undefined) {
    flags.push(`-c${options.maxCoordination}`);
  }

  const filters: number[] = [];
  for (let index = 0; index < SUBSTRUCTURE_FILTERS.length; index++) {
    const option = SUBSTRUCTURE_FILTERS[index];
    if (option !== undefined && options[option]) filters.push(index + 1);
  }
  if (filters.length > 0) flags.push(`-B${filters.join(',')}`);

  flags.push(mf);
  return flags;
}
