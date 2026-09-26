/**
 * Reading the catalogs from a component, in the language the visitor chose.
 */

import { useSignals } from '@preact/signals-react/runtime';

import { preferences } from '../state/language.ts';

import type { Language, MessageKey, MessageValues } from './messages.ts';
import { translate } from './messages.ts';
import { translateVersion } from './translateMode.ts';

/**
 * The formatter of the site's own text.
 *
 * It is meant to be called while rendering, never kept in a module constant:
 * the language is a signal, and only a render picks a change up.
 * @returns `t(key, values)`, typed by the English catalog.
 */
export function useT(): (key: MessageKey, values?: MessageValues) => string {
  const language = useLanguage();
  return (key, values) => translate(key, language, { values });
}

/**
 * The language the visitor reads the site in.
 * @returns The language.
 */
export function useLanguage(): Language {
  useSignals();
  // Read while translating too: an edit typed in the overlay is a new version,
  // and only reading it here redraws the page with the new text.
  void translateVersion.value;
  return preferences.language.value;
}
