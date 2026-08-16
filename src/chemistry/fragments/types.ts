export type FragmentCategory =
  | 'ring'
  | 'unsaturation'
  | 'oxygen'
  | 'nitrogen'
  | 'sulfur'
  | 'halogen'
  | 'skeleton';

export interface FragmentDefinition {
  /** Stable name, used by the API and by the debug page. */
  id: string;
  /** Noun phrase, read inside a sentence: "a three-membered ring". */
  label: string;
  category: FragmentCategory;
  /** What the query asks for, in words, since an idCode reads as nothing. */
  description: string;
  /**
   * The queries, as openchemlib idCodes of a fragment. The motif is present
   * when any of them is found, which is what a shape that takes two drawings
   * needs — a methyl and a methylene carrying the same group, say.
   */
  idCodes: string[];
  /**
   * Motif that must already be found before this one is worth mentioning, so
   * a student hears about a three-membered ring before hearing about the
   * nitrogen sitting in it.
   */
  parent?: string;
  /** What to try, said when nothing they found holds the motif. */
  missing: string;
  /**
   * What to move, said when they hold the motif but not every answer that
   * shows it.
   * @default the sentence the category carries
   */
  partial?: string;
}
