import { signal } from '@preact/signals-react';
import type { Language, TabRouter } from 'react-cheminfo/core';
import {
  LANGUAGES,
  readLanguagePath,
  withLanguagePath,
} from 'react-cheminfo/core';

import type { Page } from './pages.ts';
import { PAGE_PATHS, createLanguageRouter } from './pages.ts';
import { SHARE_PARAM_KEYS } from './shareConfig.ts';
import { BASE_PATH, pathWithoutBase, withBase } from './site.ts';

export type { Page } from './pages.ts';
export { PAGE_PATHS, readPageOf } from './pages.ts';

/** The addresses of this deployment, mount path and language prefix included. */
const addresses = Object.fromEntries(
  LANGUAGES.map((language) => [
    language,
    createLanguageRouter(language, BASE_PATH),
  ]),
) as Record<Language, TabRouter<Page>>;

const opened = readAddress();

/**
 * Where the browser is, and in which language the site is written for this
 * visitor. Routing is path based, through the History API, because a teacher
 * hands out an address like
 * `surge.cheminfo.org/fr/exercises?formulas=C4H10O,C5H12` — a `#` in there
 * would be lost by half the tools that pass links around, and a language left
 * in the query would leave all five languages at one address, where a search
 * engine only ever indexes one of them.
 */
export const route = {
  page: signal<Page>(opened.page),
  language: signal<Language>(opened.language),
  search: signal<string>(globalThis.location.search),
};

/**
 * Read one parameter of the current address.
 * @param name - Query parameter name.
 * @returns Its value, or null when absent.
 */
export function searchParameter(name: string): string | null {
  return new URLSearchParams(route.search.value).get(name);
}

export interface NavigateOptions {
  /**
   * Overwrite the current history entry instead of adding one. Used when the
   * address only records where the student is, so the back button leaves the
   * activity rather than walking back through every exercise they opened.
   * @default false
   */
  replace?: boolean;
}

/**
 * Go to another page, in the language the site is being read in. What
 * configures the activity — `embed`, `hide` — is kept so a teacher's link
 * survives navigation, but what feeds a page is left behind: `mf` is the
 * formula to enumerate on the generator and the list of exercises on the
 * exercises page, and carrying one over as the other asks for a set nobody
 * wrote.
 * @param page - Page to open.
 * @param parameters - Query parameters to set; undefined values are removed.
 * @param options - How to record it in the history.
 */
export function navigate(
  page: Page,
  parameters: Record<string, string | undefined> = {},
  options: NavigateOptions = {},
): void {
  const search = keptParameters(page);
  for (const [name, value] of Object.entries(parameters)) {
    if (value === undefined) {
      search.delete(name);
    } else {
      search.set(name, value);
    }
  }
  const url = addresses[route.language.peek()].format({
    tab: page,
    params: Object.fromEntries(search),
  });
  writeAddress(url, options.replace === true);
  route.page.value = page;
}

/**
 * The address of a page as a link has to write it: the mount it is served
 * under, and the prefix of the language the visitor is reading in.
 * @param page - The page linked to.
 * @param language - The language it is linked to in.
 * @returns The address, for an `href`.
 */
export function pageHref(page: Page, language: Language): string {
  return withBase(withLanguagePath(language, PAGE_PATHS[page]));
}

/**
 * Open the page on screen in another language: the same path and the same
 * query, under the other prefix.
 *
 * The query rides along as it stands rather than being rebuilt, so a formula
 * holding a `+` and a hand-typed `?embed` survive the switch untouched.
 * @param language - Language to read the site in.
 */
export function navigateToLanguage(language: Language): void {
  writeAddress(addressOf(language, route.search.peek()), false);
  route.language.value = language;
}

/**
 * Write the address the page is actually being read at, without adding a
 * history entry: what adopting a sibling site's `?lang=` leaves behind, and
 * what a bare `/` opened in a remembered language is normalised to.
 * @param language - The language the page is read in.
 * @param search - The query string to keep, leading `?` included or empty.
 */
export function replaceAddress(language: Language, search: string): void {
  writeAddress(addressOf(language, search), true);
  route.language.value = language;
}

/**
 * The language the address on screen names, and the page it opens.
 * @returns Both, the mount path and the language prefix taken off.
 */
export function readAddress(): { language: Language; page: Page } {
  const own = readLanguagePath(
    pathWithoutBase(globalThis.location?.pathname ?? '/'),
    LANGUAGES,
  );
  return {
    language: own.language,
    page: addresses[own.language].parse(own.path).tab,
  };
}

// The page on screen, written in one language, under the mount.
function addressOf(language: Language, search: string): string {
  return `${pageHref(route.page.peek(), language)}${search}`;
}

function writeAddress(url: string, replace: boolean): void {
  if (replace) {
    globalThis.history.replaceState(null, '', url);
  } else {
    globalThis.history.pushState(null, '', url);
  }
  const mark = url.indexOf('?');
  route.search.value = mark === -1 ? '' : url.slice(mark);
}

/**
 * What survives a move to another page: only what configures the page, never
 * what feeds it. Staying on the same page keeps everything, since that is the
 * page writing its own address.
 */
function keptParameters(page: Page): URLSearchParams {
  const current = new URLSearchParams(route.search.peek());
  if (page === route.page.peek()) return current;

  const kept = new URLSearchParams();
  for (const key of SHARE_PARAM_KEYS) {
    const value = current.get(key);
    if (value !== null) kept.set(key, value);
  }
  return kept;
}

globalThis.addEventListener('popstate', () => {
  const current = readAddress();
  route.page.value = current.page;
  route.language.value = current.language;
  route.search.value = globalThis.location.search;
});
