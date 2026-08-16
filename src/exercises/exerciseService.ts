import type { Molecule } from 'openchemlib';
import type { SurgeOptions } from 'surge-wasm';

import { FRAGMENTS } from '../chemistry/fragments/index.ts';
import {
  constitutionIDCode,
  moleculeFormula,
  moleculeFromIDCode,
} from '../chemistry/molecule.ts';

import type { ExerciseAnswer, FragmentUsage } from './answerSet.ts';
import { enumerate } from './answerSet.ts';
import type { FragmentCount, ProgressHint } from './fragmentHints.ts';
import { buildFragmentHints } from './fragmentHints.ts';
import { buildCoverage } from './hintCoverage.ts';
import { buildHints } from './hints.ts';

export type { ExerciseAnswer, FragmentUsage } from './answerSet.ts';

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
 * The whole ladder, given what the student has already found: what the formula
 * says, minus everything they have exhausted, then the motifs of the answers
 * compared with the ones their structures hold, what they never drew first.
 * @param mf - Molecular formula of the exercise.
 * @param found - Canonical idCodes of the structures they found.
 * @param options - Restrictions applied when enumerating the answers.
 * @returns The hints, vague first.
 */
export async function getProgressHints(
  mf: string,
  found: string[],
  options?: SurgeOptions,
): Promise<ProgressHint[]> {
  const {
    mf: formula,
    fragmentsByIDCode,
    usage,
  } = await enumerate(mf, options);

  const counts = new Map<string, FragmentCount>(
    FRAGMENTS.map((fragment) => [
      fragment.id,
      { answers: usage.get(fragment.id)?.answers ?? 0, found: 0 },
    ]),
  );
  for (const idCode of new Set(found)) {
    for (const id of fragmentsByIDCode.get(idCode) ?? []) {
      const count = counts.get(id);
      if (count) count.found++;
    }
  }

  const fragmentHints = buildFragmentHints(counts);
  // Once every motif is complete, what the formula says has nothing left to
  // add: it would only offer the families the student has already drawn.
  if (fragmentHints.some((hint) => hint.kind === 'complete')) {
    return fragmentHints;
  }

  const general = buildHints(formula, buildCoverage(counts)).map(
    (text, index): ProgressHint => ({
      id: `general-${index}`,
      kind: 'general',
      text,
    }),
  );
  return [...general, ...fragmentHints];
}

/**
 * How many answers of an exercise hold each motif, which is what the debug
 * page shows a teacher.
 * @param mf - Molecular formula of the exercise.
 * @param options - Restrictions applied when enumerating the answers.
 * @returns The formula, how many answers there are, and one entry per motif
 * the library holds.
 */
export async function getFragmentUsage(
  mf: string,
  options?: SurgeOptions,
): Promise<{ mf: string; count: number; usage: FragmentUsage[] }> {
  const { mf: formula, answers, usage } = await enumerate(mf, options);
  return {
    mf: formula,
    count: answers.length,
    usage: FRAGMENTS.map(
      (fragment) => usage.get(fragment.id) ?? { id: fragment.id, answers: 0 },
    ),
  };
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
  } catch (error) {
    throw new Error('That structure could not be read', { cause: error });
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
