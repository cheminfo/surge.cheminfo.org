import type { TabRouter } from 'react-cheminfo/core';
import { createTabRouter } from 'react-cheminfo/core';

export type Page = 'generator' | 'exercises' | 'fragments' | 'about';

/** Where each page lives, the generator being the root. */
export const PAGE_PATHS: Record<Page, string> = {
  generator: '/',
  exercises: '/exercises',
  fragments: '/fragments',
  about: '/about',
};

/**
 * The two directions between an address and the page it names, for a
 * deployment mounted at `basePath`.
 *
 * This module holds the addresses and nothing else — no signal, no listener,
 * nothing that reads `location` — so the build that writes one file per page
 * can import it in Node.
 * @param basePath - The path the deployment is mounted at, empty on a host of its own.
 * @returns The parser and the serializer of this site's addresses.
 */
export function createPageRouter(basePath = ''): TabRouter<Page> {
  return createTabRouter<Page>({
    tabs: PAGES.map((id) => ({ id, path: PAGE_PATHS[id] })),
    home: 'generator',
    basePath,
    // A hand-typed `?embed` carries no value, and must survive every address
    // the page writes afterwards.
    keepEmptyValues: true,
  });
}

/**
 * The page an address opens. An address this site does not know opens the
 * generator, and is described as the generator rather than under its own name.
 * @param pathname - The path of the address, from the site's own root.
 * @returns The page it opens.
 */
export function readPageOf(pathname: string): Page {
  return UNMOUNTED.parse(pathname).tab;
}

const PAGES = Object.keys(PAGE_PATHS) as Page[];

/** The addresses of a site owning the root of its host, which the build is. */
const UNMOUNTED = createPageRouter();
