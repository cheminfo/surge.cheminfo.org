import { signal } from '@preact/signals-react';

import { SHARE_PARAM_KEYS } from './shareConfig.ts';

export type Page = 'generator' | 'exercises' | 'fragments';

/**
 * Where the browser is. Routing is path based, through the History API,
 * because a teacher hands out an address like
 * `surge.cheminfo.org/exercises?formulas=C4H10O,C5H12` — a `#` in there would be
 * lost by half the tools that pass links around.
 */
export const route = {
  page: signal<Page>(readPage()),
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
 * Go to another page. What configures the activity — `embed`, `hide` — is kept
 * so a teacher's link survives navigation, but what feeds a page is left
 * behind: `mf` is the formula to enumerate on the generator and the list of
 * exercises on the exercises page, and carrying one over as the other asks for
 * a set nobody wrote.
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
  const query = search.toString();
  const path = PATHS[page];
  const url = query ? `${path}?${query}` : path;
  if (options.replace) {
    globalThis.history.replaceState(null, '', url);
  } else {
    globalThis.history.pushState(null, '', url);
  }
  route.page.value = page;
  route.search.value = query ? `?${query}` : '';
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

/** Where each page lives, the generator being the root. */
const PATHS: Record<Page, string> = {
  generator: '/',
  exercises: '/exercises',
  fragments: '/fragments',
};

function readPage(): Page {
  const { pathname } = globalThis.location;
  if (pathname.startsWith('/exercises')) return 'exercises';
  if (pathname.startsWith('/fragments')) return 'fragments';
  return 'generator';
}

globalThis.addEventListener('popstate', () => {
  route.page.value = readPage();
  route.search.value = globalThis.location.search;
});
