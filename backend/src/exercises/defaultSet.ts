import type { SurgeOptions } from '../schemas/surgeOptions.ts';

export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseDefinition {
  /** Molecular formula every isomer of which the student must find. */
  mf: string;
  /**
   * How hard the exercise is, which is only used to colour it.
   * @default 'intermediate'
   */
  level?: ExerciseLevel;
  /**
   * Hints replacing the ones derived from the formula, vague first.
   * @default derived from the formula
   */
  hints?: string[];
  /**
   * Restrictions applied when enumerating the answers, so an exercise can ask
   * for a subset — acyclic structures only, for instance.
   * @default no restriction
   */
  options?: SurgeOptions;
}

export interface ExerciseSet {
  id: string;
  title: string;
  description: string;
  exercises: ExerciseDefinition[];
}

/**
 * The exercises of the cheminfo "Isomères de structure" teaching page, in its
 * order. Its duplicate C8H18 entry is left out.
 */
export const DEFAULT_EXERCISE_SET: ExerciseSet = {
  id: 'structural-isomers',
  title: 'Structural isomers',
  description:
    'Draw every constitutional isomer of the given molecular formula. Stereochemistry is not taken into account.',
  exercises: [
    { mf: 'C5H12', level: 'beginner' },
    { mf: 'C3H8', level: 'beginner' },
    { mf: 'C3H6', level: 'beginner' },
    { mf: 'C6H14', level: 'beginner' },
    { mf: 'C7H16', level: 'intermediate' },
    { mf: 'C8H18', level: 'intermediate' },
    { mf: 'C4H8', level: 'beginner' },
    { mf: 'C4H10O', level: 'intermediate' },
    { mf: 'C4H8O', level: 'advanced' },
    { mf: 'C3H6O', level: 'intermediate' },
    { mf: 'C3H4', level: 'intermediate' },
    { mf: 'C5H10', level: 'intermediate' },
    { mf: 'C5H12O', level: 'intermediate' },
    { mf: 'C3H9N', level: 'beginner' },
    { mf: 'C3H8O', level: 'beginner' },
    { mf: 'C4H11N', level: 'intermediate' },
    { mf: 'C6H12', level: 'advanced' },
    { mf: 'C3H8O2', level: 'intermediate' },
    { mf: 'C5H8', level: 'advanced' },
    { mf: 'CH5N', level: 'beginner' },
    { mf: 'C2H7N', level: 'beginner' },
    { mf: 'C3H7N', level: 'advanced' },
    { mf: 'C4H8Cl2', level: 'intermediate' },
  ],
};
