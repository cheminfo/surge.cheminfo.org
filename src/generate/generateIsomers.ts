import type { SurgeOptions } from 'surge-wasm';
import { buildFlags, generate } from 'surge-wasm';

import type { StructureEntry } from '../chemistry/enhanceSmiles.ts';
import { enhanceSmiles } from '../chemistry/enhanceSmiles.ts';
import { normalizeFormula } from '../chemistry/molecule.ts';

/** Beyond this the page has more structures than anyone can look at. */
const MAX_STRUCTURES = 1_000_000;
/** How many structures pass between two looks at the count. */
const BATCH_SIZE = 1000;

export interface GenerateParameters extends SurgeOptions {
  mf: string;
  /**
   * How many structures to return. The page shows every isomer it was given,
   * so this is a guard against a formula nobody asked for, not a page size.
   * @default 1000000
   */
  limit?: number;
  /** Seconds after which surge keeps what it has and stops. */
  timeout?: number;
  /** Append the openchemlib idCode to every structure. */
  idCode?: boolean;
  /** Keep only structures containing this drawn fragment. */
  fragmentCode?: string;
}

/** How far a run has got, so a long search can be watched and given up on. */
export interface RunProgress {
  /**
   * `generate` while surge writes structures, `filter` while they are read —
   * parsed, searched for the drawn fragment, identified — and `write` while
   * an export document is being made out of them.
   */
  phase: 'generate' | 'filter' | 'write';
  /** Structures enumerated, examined, or written, so far. */
  done: number;
  /** How many there are to examine; absent while surge is still enumerating. */
  total?: number;
}

export interface GenerateResult {
  mf: string;
  /**
   * `complete` when surge enumerated everything, `timeout` when its deadline
   * came first, `output-limit` when it wrote more than the page accepts.
   */
  status: 'complete' | 'timeout' | 'output-limit';
  /** Distinct structures surge generated. */
  found: number;
  /** How many passed the substructure filter, when all of them were examined. */
  matched?: number;
  /** How many structures are in `result`. */
  returned: number;
  /** How long the enumeration took, in whole milliseconds. */
  time: number;
  /** What surge wrote to stderr. */
  log: string;
  /** The command line surge was given, so a result can be reproduced. */
  flags: string[];
  result: StructureEntry[];
}

/**
 * Generate the constitutional isomers of a molecular formula.
 *
 * Nothing but surge is needed for the structures themselves. Openchemlib only
 * comes in when the caller wants their idCode, or when a drawn fragment has
 * to be searched for — which is what makes an ordinary run as fast as surge.
 * @param parameters - Formula, surge restrictions and output options.
 * @param onProgress - Called as surge enumerates, then as its answers are
 * read: the two phases of a search a caller may have to wait through.
 * @returns The structures and how the enumeration ended.
 */
export async function generateIsomers(
  parameters: GenerateParameters,
  onProgress?: (progress: RunProgress) => void,
): Promise<GenerateResult> {
  const {
    mf,
    limit = 1_000_000,
    timeout = 2,
    idCode = false,
    fragmentCode,
    ...options
  } = parameters;

  const formula = normalizeFormula(mf);
  const run = await generate(formula, {
    ...options,
    timeoutMs: Math.round(timeout * 1000),
    batchSize: BATCH_SIZE,
    onBatch: (_batch, total) => {
      onProgress?.({ phase: 'generate', done: total });
      return total < MAX_STRUCTURES;
    },
  });

  const enhanced = enhanceSmiles(
    run.smiles,
    { limit, idCode, fragmentCode },
    (done, total) => onProgress?.({ phase: 'filter', done, total }),
  );

  let status: GenerateResult['status'] = 'complete';
  if (run.ended === 'timeout') status = 'timeout';
  else if (run.ended === 'stopped') status = 'output-limit';

  return {
    mf: formula,
    status,
    found: enhanced.found,
    ...(enhanced.matched === undefined ? {} : { matched: enhanced.matched }),
    returned: enhanced.entries.length,
    time: Math.round(run.durationMs),
    log: run.log,
    flags: buildFlags(formula, { ...options, smiles: true }),
    result: enhanced.entries,
  };
}
