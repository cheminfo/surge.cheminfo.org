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
