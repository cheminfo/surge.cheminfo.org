import { Molecule } from 'openchemlib';
import type { SurgeOptions } from 'surge-wasm';
import { generate } from 'surge-wasm';

import { constitutionIDCode, normalizeFormula } from '../chemistry/molecule.ts';
import { matchingFragments } from '../chemistry/substructure.ts';

/** An exercise the student cannot finish is not an exercise. */
const MAX_ANSWERS = 500;
const ENUMERATION_TIMEOUT_MS = 10_000;
/** How many enumerations are remembered, oldest dropped first. */
const MAX_CACHED_EXERCISES = 200;

export interface ExerciseAnswer {
  idCode: string;
  smiles: string;
}

/** What one motif is worth in an exercise, for the debug page. */
export interface FragmentUsage {
  id: string;
  /** Answers holding the motif. */
  answers: number;
  /** One of them, so the page can draw what was matched. */
  example?: string;
}

export interface AnswerSet {
  mf: string;
  answers: ExerciseAnswer[];
  byIDCode: Set<string>;
  /** Which motifs each answer holds, by canonical idCode. */
  fragmentsByIDCode: Map<string, string[]>;
  /** How many answers hold each motif, and one of them. */
  usage: Map<string, FragmentUsage>;
}

const cache = new Map<string, Promise<AnswerSet>>();

/**
 * Every isomer of a formula, with the motifs each of them holds. The work is
 * done once per command line and kept, so an exercise a class is working on
 * costs one surge run in total.
 * @param mf - Molecular formula of the exercise.
 * @param options - Restrictions applied when enumerating it.
 * @returns The answers, the way to recognize one, and what they are made of.
 */
export function enumerate(
  mf: string,
  options?: SurgeOptions,
): Promise<AnswerSet> {
  const formula = normalizeFormula(mf);
  const key = JSON.stringify([formula, options ?? {}]);

  const cached = cache.get(key);
  if (cached) return cached;

  // Anyone may ask about any formula, so the cache is bounded and drops the
  // entry that has gone unused the longest.
  if (cache.size >= MAX_CACHED_EXERCISES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }

  const pending = enumerateNow(formula, options);
  cache.set(key, pending);
  // A failed enumeration must not be remembered, or the exercise stays broken
  // until the service restarts.
  pending.catch(() => cache.delete(key));
  return pending;
}

async function enumerateNow(
  mf: string,
  options?: SurgeOptions,
): Promise<AnswerSet> {
  const run = await generate(mf, {
    ...options,
    timeoutMs: ENUMERATION_TIMEOUT_MS,
    batchSize: 100,
    // One more than an exercise may hold, so passing the cap is visible.
    onBatch: (_batch, total) => total <= MAX_ANSWERS,
  });
  if (run.ended === 'timeout') {
    throw new Error(`${mf} has too many isomers to be used as an exercise`);
  }

  const answers: ExerciseAnswer[] = [];
  const byIDCode = new Set<string>();
  const fragmentsByIDCode = new Map<string, string[]>();
  const usage = new Map<string, FragmentUsage>();
  for (const smiles of run.smiles) {
    const molecule = Molecule.fromSmiles(smiles);
    const idCode = constitutionIDCode(molecule);
    if (byIDCode.has(idCode)) continue;
    byIDCode.add(idCode);
    answers.push({ idCode, smiles });

    // Looked at here rather than when a hint is asked for: the answers never
    // change, so a hint costs nothing at request time.
    const fragments = matchingFragments(molecule);
    fragmentsByIDCode.set(idCode, fragments);
    for (const id of fragments) {
      const entry = usage.get(id);
      if (entry) entry.answers++;
      else usage.set(id, { id, answers: 1, example: idCode });
    }

    if (answers.length > MAX_ANSWERS) {
      throw new Error(
        `${mf} has more than ${MAX_ANSWERS} isomers, which is too many to draw`,
      );
    }
  }

  return { mf, answers, byIDCode, fragmentsByIDCode, usage };
}
