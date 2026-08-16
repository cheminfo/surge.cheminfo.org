/** How hard an exercise is, which is only used to colour it. */
export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';

const BEGINNER_MAX = 5;
const INTERMEDIATE_MAX = 15;

/**
 * Read the level off the number of isomers the exercise asks for, so a set a
 * teacher named in a link is coloured like the one shipped with the service.
 * @param count - Isomers the student has to find.
 * @returns The level of the exercise.
 */
export function levelOfCount(count: number): ExerciseLevel {
  if (count <= BEGINNER_MAX) return 'beginner';
  if (count <= INTERMEDIATE_MAX) return 'intermediate';
  return 'advanced';
}

/**
 * The exercises from the easiest to the hardest, which is the order a set
 * nobody arranged is walked through. Formulas asking for as many isomers keep
 * the order they came in.
 * @param exercises - The exercises, with the isomers each holds.
 * @returns The same exercises, ordered.
 */
export function sortByDifficulty<T extends { count: number }>(
  exercises: readonly T[],
): T[] {
  return exercises.toSorted((one, other) => one.count - other.count);
}
