/**
 * The language the site is written in for this visitor, kept between visits
 * and carried in the address so a teacher can hand out a link in it.
 */

import { signal } from '@preact/signals-react';
import { LANGUAGE_PARAM } from 'react-cheminfo/core';

import type { Language } from '../i18n/messages.ts';
import { DEFAULT_LANGUAGE, isLanguage } from '../i18n/messages.ts';

import { persistBucket } from './persist.ts';
import { route } from './router.ts';

/** What the visitor reads the site in. */
export const preferences = persistBucket('surge:language', 1, {
  language: signal<Language>(DEFAULT_LANGUAGE),
});

/**
 * Write the site in one of the languages it carries.
 *
 * The address is rewritten with it, so what is in the bar is always the link
 * to hand out; English, which every site opens in, is written as nothing.
 * @param language - Language to switch to.
 */
export function setLanguage(language: Language): void {
  preferences.language.value = language;
  writeLanguageToAddress(language);
}

function writeLanguageToAddress(language: Language): void {
  const { history, location } = globalThis;
  if (history === undefined || location === undefined) return;
  const parameters = new URLSearchParams(location.search);
  if (language === DEFAULT_LANGUAGE) parameters.delete(LANGUAGE_PARAM);
  else parameters.set(LANGUAGE_PARAM, language);
  const search = parameters.toString();
  history.replaceState(
    history.state,
    '',
    `${location.pathname}${search === '' ? '' : `?${search}`}`,
  );
  route.search.value = location.search;
}

/**
 * Apply the language an address names, if it names one the site has.
 * @param search - The query string, e.g. `location.search`.
 * @returns The language applied, or `undefined` when the address named none.
 */
export function applyLanguageFromSearch(search: string): Language | undefined {
  const value = new URLSearchParams(search).get(LANGUAGE_PARAM);
  if (value === null || !isLanguage(value)) return undefined;
  preferences.language.value = value;
  return value;
}
