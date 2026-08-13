import type { ExerciseSet, ExerciseSummary } from '../api/surge.ts';
import { fetchExerciseSet } from '../api/surge.ts';

import { searchParameter } from './router.ts';

/** A set a teacher hosts themselves, named by the `set` query parameter. */
interface RemoteSet {
  title?: string;
  description?: string;
  exercises: Array<{ mf: string; level?: ExerciseSummary['level'] }>;
}

/**
 * Read the set the address asks for: the formulas listed in `mf`, the document
 * hosted at `set`, or the one shipped with the service.
 * @returns The set, with the isomer count of each exercise.
 */
export async function loadSetFromAddress(): Promise<ExerciseSet> {
  const url = searchParameter('set');
  return url ? loadRemoteSet(url) : fetchExerciseSet(readFormulas());
}

function readFormulas(): string[] | undefined {
  const mf = searchParameter('mf');
  if (!mf) return undefined;
  return mf
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
    exercises: counted.exercises.map((exercise, index) => ({
      ...exercise,
      level: remote.exercises[index]?.level ?? exercise.level,
    })),
  };
}
