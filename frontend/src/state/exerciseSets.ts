import type { ExerciseSet } from '../api/surge.ts';
import { fetchExerciseSet } from '../api/surge.ts';

import { searchParameter } from './router.ts';

/** A set a teacher hosts themselves, named by the `set` query parameter. */
interface RemoteSet {
  title?: string;
  description?: string;
  exercises: Array<{ mf: string }>;
}

/**
 * The formulas of the set, in the address. Deliberately not `mf`: that one is
 * the single formula the generator enumerates, and one name meaning two things
 * turns a hop from the generator into an exercise set nobody wrote.
 */
export const FORMULAS_PARAM = 'formulas';

/**
 * Read the set the address asks for: the formulas listed in `formulas`, the document
 * hosted at `set`, or the one shipped with the service. When nothing the
 * address names can be drawn, the shipped set is loaded instead — a student
 * sent a link that cannot work is still better off with the course than with
 * an empty page.
 * @returns The set, with the isomer count of each exercise.
 */
export async function loadSetFromAddress(): Promise<ExerciseSet> {
  const url = searchParameter('set');
  const asked = url
    ? await loadRemoteSet(url)
    : await fetchExerciseSet(readFormulas());
  if (asked.exercises.length > 0 || (!url && !readFormulas())) return asked;

  const shipped = await fetchExerciseSet();
  return { ...shipped, skipped: asked.skipped };
}

function readFormulas(): string[] | undefined {
  const listed = searchParameter(FORMULAS_PARAM);
  if (!listed) return undefined;
  return listed
    .split(',')
    .map((formula) => formula.trim())
    .filter(Boolean);
}

async function loadRemoteSet(url: string): Promise<ExerciseSet> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The exercise set at ${url} answered ${response.status}`);
  }
  const remote = (await response.json()) as RemoteSet;
  if (!Array.isArray(remote.exercises) || remote.exercises.length === 0) {
    throw new Error(`The exercise set at ${url} lists no exercise`);
  }

  // The service counts the isomers; the teacher owns the wording and the order.
  const counted = await fetchExerciseSet(
    remote.exercises.map((exercise) => exercise.mf),
  );
  return {
    id: url,
    title: remote.title ?? counted.title,
    description: remote.description ?? counted.description,
    exercises: counted.exercises,
    skipped: counted.skipped,
  };
}
