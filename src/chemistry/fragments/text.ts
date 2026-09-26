/**
 * What a motif is called, and what is said about it, in the visitor's
 * language.
 *
 * The definitions carry the English: they are where a motif is written, and a
 * new one is added there with its sentences in place. The catalogs carry every
 * other language, keyed `fragment.<id>.<field>`, and a language that has not
 * reached a motif yet shows its English rather than nothing. What is not
 * language — the id, the category, the idCodes a query is run from — never
 * leaves the definition.
 */

import type { Language } from '../../i18n/messages.ts';
import { translate } from '../../i18n/messages.ts';

import type { FragmentCategory, FragmentDefinition } from './types.ts';

/**
 * The noun phrase a motif is read as inside a sentence.
 * @param fragment - The motif.
 * @param language - Language to name it in.
 * @returns For example `a hydroxyl group`.
 */
export function fragmentLabel(
  fragment: FragmentDefinition,
  language: Language,
): string {
  return text(fragment.id, 'label', fragment.label, language);
}

/**
 * What the query asks for, in words.
 * @param fragment - The motif.
 * @param language - Language to say it in.
 * @returns The description.
 */
export function fragmentDescription(
  fragment: FragmentDefinition,
  language: Language,
): string {
  return text(fragment.id, 'description', fragment.description, language);
}

/**
 * What to try, said when nothing the student found holds the motif.
 * @param fragment - The motif.
 * @param language - Language to say it in.
 * @returns The sentence.
 */
export function fragmentMissing(
  fragment: FragmentDefinition,
  language: Language,
): string {
  return text(fragment.id, 'missing', fragment.missing, language);
}

/**
 * What to move, said when the student holds the motif but not every answer
 * that shows it — the motif's own sentence, or the one its category carries.
 * @param fragment - The motif.
 * @param language - Language to say it in.
 * @returns The sentence.
 */
export function fragmentPartial(
  fragment: FragmentDefinition,
  language: Language,
): string {
  if (fragment.partial !== undefined) {
    return text(fragment.id, 'partial', fragment.partial, language);
  }
  return categoryNudge(fragment.category, language);
}

/**
 * What a category is told to try when a motif is only partly explored.
 * @param category - The category.
 * @param language - Language to say it in.
 * @returns The sentence.
 */
export function categoryNudge(
  category: FragmentCategory,
  language: Language,
): string {
  return translate(`fragmentCategory.${category}.nudge`, language, {
    fallback: CATEGORY_NUDGE[category],
  });
}

/** The English of every category's nudge, which the catalogs are seeded from. */
export const CATEGORY_NUDGE: Record<FragmentCategory, string> = {
  ring: 'The same ring carries what is left of the formula in more than one way.',
  unsaturation:
    'The same multiple bond sits at more than one place of the skeleton.',
  oxygen: 'The same group sits on another carbon, or on another skeleton.',
  nitrogen: 'The same group sits on another carbon, or on another skeleton.',
  sulfur: 'The same group sits on another carbon, or on another skeleton.',
  halogen: 'The same substituent sits on another carbon.',
  skeleton: 'The same motif fits on more than one skeleton.',
};

function text(
  id: string,
  field: string,
  english: string,
  language: Language,
): string {
  return translate(`fragment.${id}.${field}`, language, { fallback: english });
}
