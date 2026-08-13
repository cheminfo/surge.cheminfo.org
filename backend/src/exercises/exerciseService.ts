import { Molecule } from 'openchemlib';

import {
  constitutionIDCode,
  moleculeFormula,
  moleculeFromIDCode,
  normalizeFormula,
} from '../chemistry/molecule.ts';
import type { SurgeOptions } from '../schemas/surgeOptions.ts';
import { buildFlags } from '../surge/buildFlags.ts';
import { runSurge } from '../surge/runSurge.ts';

import { buildHints } from './hints.ts';

/** An exercise the student cannot finish is not an exercise. */
const MAX_ANSWERS = 500;
const ENUMERATION_TIMEOUT_MS = 10_000;
/** How many enumerations are remembered, oldest dropped first. */
const MAX_CACHED_EXERCISES = 200;

export interface ExerciseAnswer {
  idCode: string;
  smiles: string;
}

export interface Exercise {
  mf: string;
  /** How many isomers there are to find. */
  count: number;
  /** Ordered hints, vague first. */
  hints: string[];
}

export interface CheckResult {
  correct: boolean;
  /** Why the structure was refused, `correct` when it was not. */
  reason: 'correct' | 'wrong-formula' | 'not-an-isomer';
  /** Canonical identifier of the drawn structure, so a client can deduplicate. */
  idCode: string;
  /** Molecular formula of the drawn structure. */
  mf: string;
}

interface Answers {
  mf: string;
  answers: ExerciseAnswer[];
  byIDCode: Set<string>;
}

const cache = new Map<string, Promise<Answers>>();

/**
 * Describe one exercise without giving its answers away.
 * @param mf - Molecular formula of the exercise.
 * @param options - Restrictions applied when enumerating its answers.
 * @param hints - Hints written by the teacher, if any.
 * @returns The formula, how many isomers to find, and the hints.
 */
export async function getExercise(
  mf: string,
  options?: SurgeOptions,
  hints?: string[],
): Promise<Exercise> {
  const { mf: formula, answers } = await enumerate(mf, options);
  return {
    mf: formula,
    count: answers.length,
    hints: hints ?? buildHints(formula),
  };
}

/**
 * Every isomer the student was asked to find. Only serve this once they gave
 * up, or as the correction.
 * @param mf - Molecular formula of the exercise.
 * @param options - Restrictions applied when enumerating its answers.
 * @returns The answers, in the order surge generated them.
 */
export async function getExerciseAnswers(
  mf: string,
  options?: SurgeOptions,
): Promise<ExerciseAnswer[]> {
  const { answers } = await enumerate(mf, options);
  return answers;
}

/**
 * Decide whether a drawn structure is one of the isomers to find.
 * @param mf - Molecular formula of the exercise.
 * @param idCode - What the student drew, coordinates included or not.
 * @param options - Restrictions applied when enumerating the answers.
 * @returns Whether it counts, and what it was recognized as.
 */
export async function checkStructure(
  mf: string,
  idCode: string,
  options?: SurgeOptions,
): Promise<CheckResult> {
  const { mf: formula, byIDCode } = await enumerate(mf, options);

  let molecule;
  try {
    molecule = moleculeFromIDCode(idCode);
  } catch {
    throw Object.assign(new Error('That structure could not be read'), {
      statusCode: 400,
    });
  }

  const drawn = {
    idCode: constitutionIDCode(molecule),
    // A structure holding an atom surge never builds — silicon, a charge, a
    // radical — has no canonical formula here, and its raw one is what tells
    // the student what they actually drew.
    mf: safeFormula(molecule),
  };

  if (drawn.mf !== formula) {
    return { correct: false, reason: 'wrong-formula', ...drawn };
  }
  if (!byIDCode.has(drawn.idCode)) {
    return { correct: false, reason: 'not-an-isomer', ...drawn };
  }
  return { correct: true, reason: 'correct', ...drawn };
}

function safeFormula(molecule: Molecule): string {
  try {
    return moleculeFormula(molecule);
  } catch {
    return molecule.getMolecularFormula().formula;
  }
}

function enumerate(mf: string, options?: SurgeOptions): Promise<Answers> {
  const formula = normalizeFormula(mf);
  const flags = buildFlags(formula, options);
  const key = flags.join(' ');

  const cached = cache.get(key);
  if (cached) return cached;

  // Anyone may ask about any formula, so the cache is bounded and drops the
  // entry that has gone unused the longest.
  if (cache.size >= MAX_CACHED_EXERCISES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }

  const pending = enumerateNow(formula, flags);
  cache.set(key, pending);
  // A failed enumeration must not be remembered, or the exercise stays broken
  // until the service restarts.
  pending.catch(() => cache.delete(key));
  return pending;
}

async function enumerateNow(mf: string, flags: string[]): Promise<Answers> {
  const run = await runSurge(flags, ENUMERATION_TIMEOUT_MS);
  if (run.timedOut || run.truncated) {
    throw Object.assign(
      new Error(`${mf} has too many isomers to be used as an exercise`),
      { statusCode: 400 },
    );
  }

  const answers: ExerciseAnswer[] = [];
  const byIDCode = new Set<string>();
  for (const smiles of run.lines) {
    const idCode = constitutionIDCode(Molecule.fromSmiles(smiles));
    if (byIDCode.has(idCode)) continue;
    byIDCode.add(idCode);
    answers.push({ idCode, smiles });
    if (answers.length > MAX_ANSWERS) {
      throw Object.assign(
        new Error(
          `${mf} has more than ${MAX_ANSWERS} isomers, which is too many to draw`,
        ),
        { statusCode: 400 },
      );
    }
  }

  return { mf, answers, byIDCode };
}
