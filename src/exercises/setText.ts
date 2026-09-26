/**
 * What an exercise set is called, and what it says it wants, in the visitor's
 * language.
 *
 * A set shipped with the site is written in English in its definition and
 * translated in the catalogs under `exerciseSet.<id>`. A set a teacher hands
 * out by URL carries its own words and is shown as it was written: nobody has
 * translated it, and inventing a translation for it would be worse than
 * showing what the teacher wrote.
 */

import type { Language } from '../i18n/messages.ts';
import { translate } from '../i18n/messages.ts';

/** The least a set has to carry to be named. */
export interface NamedSet {
  id: string;
  title: string;
  description: string;
}

/**
 * The title of a set.
 * @param set - The set.
 * @param language - Language to name it in.
 * @returns Its title.
 */
export function exerciseSetTitle(set: NamedSet, language: Language): string {
  return translate(`exerciseSet.${set.id}.title`, language, {
    fallback: set.title,
  });
}

/**
 * What a set asks the student for.
 * @param set - The set.
 * @param language - Language to say it in.
 * @returns Its description.
 */
export function exerciseSetDescription(
  set: NamedSet,
  language: Language,
): string {
  return translate(`exerciseSet.${set.id}.description`, language, {
    fallback: set.description,
  });
}
