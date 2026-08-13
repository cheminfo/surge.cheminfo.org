import type { SurgeOptions } from '../schemas/surgeOptions.ts';

export interface ExerciseDefinition {
  /** Molecular formula every isomer of which the student must find. */
  mf: string;
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
    { mf: 'C5H12' },
    { mf: 'C3H8' },
    { mf: 'C3H6' },
    { mf: 'C6H14' },
    { mf: 'C7H16' },
    { mf: 'C8H18' },
    { mf: 'C4H8' },
    { mf: 'C4H10O' },
    { mf: 'C4H8O' },
    { mf: 'C3H6O' },
    { mf: 'C3H4' },
    { mf: 'C5H10' },
    { mf: 'C5H12O' },
    { mf: 'C3H9N' },
    { mf: 'C3H8O' },
    { mf: 'C4H11N' },
    { mf: 'C6H12' },
    { mf: 'C3H8O2' },
    { mf: 'C5H8' },
    { mf: 'CH5N' },
    { mf: 'C2H7N' },
    { mf: 'C3H7N' },
    { mf: 'C4H8Cl2' },
  ],
};
