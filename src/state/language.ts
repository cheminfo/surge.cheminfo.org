/**
 * The language the site is written in for this visitor.
 *
 * It lives in the path — `/fr/exercises` — and nowhere else, which is what
 * makes the five translations five pages a search engine can offer rather than
 * one page it indexes in English. The stored preference is not where the
 * language is read from any more: it only decides what a bare `/` opens for
 * somebody coming back, and a deep link is never bounced by it.
 */

import { signal } from '@preact/signals-react';
import type { Language } from 'react-cheminfo/core';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_PARAM,
  formatQueryString,
  isLanguage,
  parseQueryString,
  readLanguageParam,
  trimTrailingSlash,
} from 'react-cheminfo/core';

import { persistBucket } from './persist.ts';
import { navigateToLanguage, replaceAddress, route } from './router.ts';
import { pathWithoutBase } from './site.ts';

/**
 * What the visitor last read the site in. Kept so coming back to the bare
 * front page opens in their own language, never to decide the language of an
 * address that already names one.
 */
export const preferences = persistBucket('surge:language', 1, {
  language: signal<Language>(DEFAULT_LANGUAGE),
});

/**
 * Write the site in one of the languages it carries: the same page and the
 * same query, under the other prefix.
 * @param language - Language to switch to.
 */
export function setLanguage(language: Language): void {
  preferences.language.value = language;
  navigateToLanguage(language);
}

/**
 * Settle which language the page just opened is read in, before it is drawn.
 *
 * Three things can name it, in this order. The prefix of the address wins and
 * is remembered, so a `/fr/exercises` handed out in a course opens in French
 * for everybody. A `?lang=` from a sibling site — how the family carries the
 * language between its tools — is adopted once on an address that names no
 * language of its own, and either way the address is normalised to the
 * prefixed form, with no history entry. And a bare front page, naming nothing
 * at all, opens in the language this browser last read; a deep link never is.
 */
export function adoptLanguageAddress(): void {
  const search = globalThis.location?.search ?? '';
  const named = route.language.peek();
  const handedOver = readLanguageParam(search);

  if (handedOver !== undefined) {
    // The prefix of the address wins: it is what somebody handed out, and the
    // parameter is only how a sibling site offers a language. Either way the
    // parameter does not stay in the address — a translated site routes by the
    // prefix, and every link written from here would carry the parameter on.
    const offered =
      named === DEFAULT_LANGUAGE && isLanguage(handedOver)
        ? handedOver
        : undefined;
    if (offered !== undefined) preferences.language.value = offered;
    replaceAddress(offered ?? named, withoutLanguageParam(search));
    return;
  }

  if (named !== DEFAULT_LANGUAGE) {
    preferences.language.value = named;
    return;
  }

  // A bare `/`: no prefix, no query, nothing handed out. Anything else is an
  // address somebody wrote down, and it opens in the language it names.
  const stored = preferences.language.peek();
  if (stored === DEFAULT_LANGUAGE || search !== '' || !isFrontPage()) return;
  replaceAddress(stored, '');
}

// The site's own root, and not merely an address that falls back to it: an
// address somebody wrote down is never rewritten, even when the site does not
// know it.
function isFrontPage(): boolean {
  const own = pathWithoutBase(globalThis.location?.pathname ?? '/');
  return (trimTrailingSlash(own) || '/') === '/';
}

// The query string with the family's hand-over parameter taken out of it, the
// rest left exactly as it was written: a `+` in a formula is a plus, not a
// space, and a bare `?embed` stays bare.
function withoutLanguageParam(search: string): string {
  const options = { literalPlus: true, keepEmptyValues: true };
  const rest = formatQueryString(
    { ...parseQueryString(search, options), [LANGUAGE_PARAM]: undefined },
    options,
  );
  return rest === '' ? '' : `?${rest}`;
}
