import { SURGE_VERSION } from 'surge-wasm';

import type { StructureEntry } from '../chemistry/enhanceSmiles.ts';
import { FRAGMENTS } from '../chemistry/fragments/index.ts';
import type { FragmentDefinition } from '../chemistry/fragments/types.ts';
import type { ExerciseAnswer } from '../exercises/answerSet.ts';
import type {
  CheckResult,
  Exercise,
  FragmentUsage,
} from '../exercises/exerciseService.ts';
import type { ProgressHint } from '../exercises/fragmentHints.ts';
import type { DescribedSet } from '../exercises/setSummary.ts';
import type { ExportFormat } from '../generate/exportStructures.ts';
import type {
  GenerateParameters,
  GenerateResult,
} from '../generate/generateIsomers.ts';
import type { CallOptions } from '../workers/surgeClient.ts';
import { ask } from '../workers/surgeClient.ts';

export type { SurgeOptions } from 'surge-wasm';
export type {
  GenerateParameters,
  GenerateResult,
  RunProgress,
} from '../generate/generateIsomers.ts';
export type { StructureEntry } from '../chemistry/enhanceSmiles.ts';
export type { ExportFormat } from '../generate/exportStructures.ts';
export { exportRange, exportText } from '../generate/exportStructures.ts';
export type {
  CheckResult,
  Exercise,
  FragmentUsage,
} from '../exercises/exerciseService.ts';
export type { ExerciseAnswer } from '../exercises/answerSet.ts';
export type { ProgressHint } from '../exercises/fragmentHints.ts';
export type { ExerciseLevel } from '../exercises/level.ts';
export type {
  DescribedSet as ExerciseSet,
  ExerciseSummary,
  SkippedExercise,
} from '../exercises/setSummary.ts';

/** One motif of the library, as the fragments page shows it. */
export type Fragment = FragmentDefinition;

/**
 * Generate the constitutional isomers of a molecular formula.
 * @param parameters - Formula, restrictions and output options.
 * @param options - What to be told while surge runs.
 * @returns What surge produced.
 */
export async function generate(
  parameters: GenerateParameters,
  options?: CallOptions,
): Promise<GenerateResult> {
  return ask<GenerateResult>({ kind: 'generate', parameters }, options);
}

/**
 * Write the results as an export document, in pieces. Reading a large result
 * back into molecules takes as long as enumerating it and the document does
 * not fit in one string, so the caller is handed the text as it is written.
 * @param entries - The structures to write.
 * @param format - Which document to write.
 * @param options - Where the pieces go, and what to be told while it runs.
 * @returns How many records the document holds.
 */
export async function exportStructures(
  entries: readonly StructureEntry[],
  format: ExportFormat,
  options?: CallOptions,
): Promise<number> {
  return ask<number>({ kind: 'export', entries, format }, options);
}

/**
 * Give up on what the worker is doing. Neither surge, nor a substructure scan,
 * nor an export can be asked to stop from inside, so the thread is ended and
 * every call still waiting fails with a `CancelledError`.
 */
export { CancelledError, cancelEverything } from '../workers/surgeClient.ts';

/**
 * Read an exercise set and how many isomers each of its formulas holds.
 * @param formulas - Formulas of a set a teacher put together, or nothing for
 * the set shipped with the tool.
 * @returns The set.
 */
export async function fetchExerciseSet(
  formulas?: string[],
): Promise<DescribedSet> {
  const mf = formulas && formulas.length > 0 ? formulas.join(',') : undefined;
  return ask<DescribedSet>({ kind: 'exercise-set', mf });
}

/**
 * Read one exercise: how many isomers to find, and the hints.
 * @param mf - Molecular formula of the exercise.
 * @returns The exercise.
 */
export async function fetchExercise(mf: string): Promise<Exercise> {
  return ask<Exercise>({ kind: 'exercise', mf });
}

/**
 * Read every isomer of an exercise — the correction.
 * @param mf - Molecular formula of the exercise.
 * @returns The answers.
 */
export async function fetchAnswers(mf: string): Promise<ExerciseAnswer[]> {
  return ask<ExerciseAnswer[]>({ kind: 'answers', mf });
}

/**
 * Ask whether a drawn structure is one of the isomers to find.
 * @param mf - Molecular formula of the exercise.
 * @param idCode - What the student drew.
 * @returns Whether it counts, and what it was recognized as.
 */
export async function checkStructure(
  mf: string,
  idCode: string,
): Promise<CheckResult> {
  return ask<CheckResult>({ kind: 'check', mf, idCode });
}

/**
 * What is still missing, read from what the student has already found.
 * @param mf - Molecular formula of the exercise.
 * @param found - Canonical identifiers of the answers already given.
 * @returns The hints to show, most useful first.
 */
export async function fetchProgressHints(
  mf: string,
  found: string[],
): Promise<ProgressHint[]> {
  return ask<ProgressHint[]>({ kind: 'hints', mf, found });
}

/**
 * Every motif looked for when a student is advised. The library is a constant,
 * so this never leaves the page.
 * @returns The fragment library.
 */
export function fetchFragments(): Promise<Fragment[]> {
  return Promise.resolve(FRAGMENTS);
}

/**
 * How many isomers of a formula hold each motif.
 * @param mf - Molecular formula to enumerate.
 * @returns The formula, how many isomers it has, and one entry per motif.
 */
export async function fetchFragmentUsage(
  mf: string,
): Promise<{ mf: string; count: number; usage: FragmentUsage[] }> {
  return ask({ kind: 'fragment-usage', mf });
}

/**
 * Which surge the page enumerates with. It is compiled into the package the
 * page carries, so this is a constant.
 * @returns The version string.
 */
export function fetchVersion(): Promise<string> {
  return Promise.resolve(SURGE_VERSION);
}
