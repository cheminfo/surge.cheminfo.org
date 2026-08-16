import type { ExerciseSet } from './defaultSet.ts';
import { DEFAULT_EXERCISE_SET } from './defaultSet.ts';
import { getExercise } from './exerciseService.ts';
import type { ExerciseLevel } from './level.ts';
import { levelOfCount, sortByDifficulty } from './level.ts';

/**
 * The set the address asks for, with the isomers each of its formulas holds.
 * A set a teacher named is answered in the order they arranged, which is the
 * order the student walks through; nobody arranged the shipped set, so it is
 * handed out from its easiest formula to its hardest.
 * @param mf - Comma separated formulas, or nothing for the shipped set.
 * @returns The set, its exercises and the formulas that could not be one.
 */
export interface ExerciseSummary {
  mf: string;
  /** How hard it is, read off `count` rather than written down. */
  level: ExerciseLevel;
  count: number;
}

export interface SkippedExercise {
  mf: string;
  reason: string;
}

/** A set with every formula enumerated, which is what a page shows. */
export interface DescribedSet {
  id: string;
  title: string;
  description: string;
  exercises: ExerciseSummary[];
  /** Formulas of the set that cannot be an exercise, and why. */
  skipped: SkippedExercise[];
}

export async function describeSet(
  mf: string | undefined,
): Promise<DescribedSet> {
  const set = readSet(mf);
  const exercises: ExerciseSummary[] = [];
  const skipped: SkippedExercise[] = [];
  for (const exercise of set.exercises) {
    try {
      // One at a time: enumerating a whole set in parallel would take every
      // slot of the generation queue and answer 503 to everyone else.
      // eslint-disable-next-line no-await-in-loop -- intentional, see above
      const counted = await getExercise(exercise.mf, exercise.options);
      exercises.push({
        mf: counted.mf,
        count: counted.count,
        level: levelOfCount(counted.count),
      });
    } catch (error) {
      // One formula nobody can draw does not make the rest of a teacher's
      // selection worthless: it drops out, and says so.
      skipped.push({
        mf: exercise.mf,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ...set,
    exercises: mf ? exercises : sortByDifficulty(exercises),
    skipped,
  };
}

function readSet(mf: string | undefined): ExerciseSet {
  if (!mf) return DEFAULT_EXERCISE_SET;
  const formulas = mf
    .split(',')
    .map((formula) => formula.trim())
    .filter(Boolean);
  if (formulas.length === 0) {
    throw new Error('No molecular formula was given');
  }
  return {
    id: 'custom',
    title: 'Constitutional isomers',
    description: DEFAULT_EXERCISE_SET.description,
    exercises: formulas.map((formula) => ({ mf: formula })),
  };
}
