import { NITROGEN_FRAGMENTS } from './nitrogenFragments.ts';
import {
  HALOGEN_FRAGMENTS,
  SKELETON_FRAGMENTS,
  SULFUR_FRAGMENTS,
} from './otherFragments.ts';
import { OXYGEN_FRAGMENTS } from './oxygenFragments.ts';
import { RING_FRAGMENTS } from './ringFragments.ts';
import type { FragmentCategory, FragmentDefinition } from './types.ts';
import { UNSATURATION_FRAGMENTS } from './unsaturationFragments.ts';

export type { FragmentCategory, FragmentDefinition } from './types.ts';

/**
 * Every motif a structure is looked at for. The order is the order a hint
 * ladder walks them in, so the coarse ones — a ring, a double bond — come
 * before the ones that only make sense once the coarse one is there.
 */
export const FRAGMENTS: FragmentDefinition[] = [
  ...RING_FRAGMENTS,
  ...UNSATURATION_FRAGMENTS,
  ...OXYGEN_FRAGMENTS,
  ...NITROGEN_FRAGMENTS,
  ...SULFUR_FRAGMENTS,
  ...HALOGEN_FRAGMENTS,
  ...SKELETON_FRAGMENTS,
];

const byId = new Map(FRAGMENTS.map((fragment) => [fragment.id, fragment]));

for (const fragment of FRAGMENTS) {
  if (fragment.parent && !byId.has(fragment.parent)) {
    throw new Error(
      `${fragment.id} is a child of the unknown ${fragment.parent}`,
    );
  }
}
if (byId.size !== FRAGMENTS.length) {
  throw new Error('two fragments share an id');
}

/**
 * One motif by name.
 * @param id - Identifier of the fragment.
 * @returns Its definition, or undefined when nothing goes by that name.
 */
export function fragmentById(id: string): FragmentDefinition | undefined {
  return byId.get(id);
}

/** What a category is told to try when a motif is only partly explored. */
const CATEGORY_NUDGE: Record<FragmentCategory, string> = {
  ring: 'The same ring carries what is left of the formula in more than one way.',
  unsaturation:
    'The same multiple bond sits at more than one place of the skeleton.',
  oxygen: 'The same group sits on another carbon, or on another skeleton.',
  nitrogen: 'The same group sits on another carbon, or on another skeleton.',
  sulfur: 'The same group sits on another carbon, or on another skeleton.',
  halogen: 'The same substituent sits on another carbon.',
  skeleton: 'The same motif fits on more than one skeleton.',
};

/**
 * What to say when a motif is found but not everywhere it appears.
 * @param fragment - The motif in question.
 * @returns Its own sentence, or the one its category carries.
 */
export function partialNudge(fragment: FragmentDefinition): string {
  return fragment.partial ?? CATEGORY_NUDGE[fragment.category];
}
