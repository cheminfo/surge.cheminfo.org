import { signal } from '@preact/signals-react';

export type Page = 'generator' | 'exercises';

/**
 * Where the browser is. Routing is path based, through the History API,
 * because a teacher hands out an address like
 * `surge.cheminfo.org/exercises?mf=C4H10O,C5H12` — a `#` in there would be
 * lost by half the tools that pass links around.
 */
export const route = {
  page: signal<Page>(readPage()),
  search: signal<string>(globalThis.location.search),
};

/**
 * Whether the page is framed by another site, such as a course on
 * learn.cheminfo.org, in which case the header is left out and the activity
 * takes the whole frame.
 */
export const isEmbedded =
  new URLSearchParams(globalThis.location.search).get('embed') === '1';

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
 * Go to another page, keeping the parameters that configure the activity so a
 * teacher's link survives navigation.
 * @param page - Page to open.
 * @param parameters - Query parameters to set; undefined values are removed.
 * @param options - How to record it in the history.
 */
export function navigate(
  page: Page,
  parameters: Record<string, string | undefined> = {},
  options: NavigateOptions = {},
): void {
  const search = new URLSearchParams(route.search.peek());
  for (const [name, value] of Object.entries(parameters)) {
    if (value === undefined) {
      search.delete(name);
    } else {
      search.set(name, value);
    }
  }
  const query = search.toString();
  const path = page === 'exercises' ? '/exercises' : '/';
  const url = query ? `${path}?${query}` : path;
  if (options.replace) {
    globalThis.history.replaceState(null, '', url);
  } else {
    globalThis.history.pushState(null, '', url);
  }
  route.page.value = page;
  route.search.value = query ? `?${query}` : '';
}

function readPage(): Page {
  return globalThis.location.pathname.startsWith('/exercises')
    ? 'exercises'
    : 'generator';
}

globalThis.addEventListener('popstate', () => {
  route.page.value = readPage();
  route.search.value = globalThis.location.search;
});
