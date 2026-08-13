import type { StructureEntry } from '../chemistry/enhanceSmiles.ts';
import { enhanceSmiles } from '../chemistry/enhanceSmiles.ts';
import { normalizeFormula } from '../chemistry/molecule.ts';
import { config } from '../config.ts';
import type { SurgeOptions } from '../schemas/surgeOptions.ts';
import { buildFlags } from '../surge/buildFlags.ts';
import { runSurge } from '../surge/runSurge.ts';

export interface GenerateParameters extends SurgeOptions {
  mf: string;
  /** How many structures to return. */
  limit?: number;
  /** Seconds after which surge is killed. */
  timeout?: number;
  /** Append the openchemlib idCode to every structure. */
  idCode?: boolean;
  /** Keep only structures containing this drawn fragment. */
  fragmentCode?: string;
}

export interface GenerateResult {
  mf: string;
  /**
   * `complete` when surge enumerated everything, `timeout` when it was killed
   * first, `output-limit` when it wrote more than the service accepts.
   */
  status: 'complete' | 'timeout' | 'output-limit';
  /** Distinct structures surge generated. */
  found: number;
  /** How many passed the substructure filter, when all of them were examined. */
  matched?: number;
  /** How many structures are in `result`. */
  returned: number;
  /** How long surge ran, in milliseconds. */
  time: number;
  /** What surge wrote to stderr. */
  log: string;
  /** The command line surge was given, so a result can be reproduced. */
  flags: string[];
  result: StructureEntry[];
}

/**
 * Generate the constitutional isomers of a molecular formula.
 * @param parameters - Formula, surge restrictions and output options.
 * @returns The structures and how the enumeration ended.
 */
export async function generateIsomers(
  parameters: GenerateParameters,
): Promise<GenerateResult> {
  const {
    mf,
    limit = 1000,
    timeout = 2,
    idCode = false,
    fragmentCode,
    ...options
  } = parameters;

  const formula = normalizeFormula(mf);
  const flags = buildFlags(formula, options);
  // spawn() refuses a fractional timeout, and a caller may well ask for 2.5 s.
  const timeoutMs = Math.round(
    Math.min(timeout, config.maxTimeoutSeconds) * 1000,
  );

  const run = await runSurge(flags, timeoutMs);
  const enhanced = enhanceSmiles(run.lines, {
    limit: Math.min(limit, config.maxLimit),
    idCode,
    fragmentCode,
  });

  let status: GenerateResult['status'] = 'complete';
  if (run.timedOut) status = 'timeout';
  else if (run.truncated) status = 'output-limit';

  return {
    mf: formula,
    status,
    found: enhanced.found,
    ...(enhanced.matched === undefined ? {} : { matched: enhanced.matched }),
    returned: enhanced.entries.length,
    time: run.durationMs,
    log: run.log,
    flags,
    result: enhanced.entries,
  };
}
