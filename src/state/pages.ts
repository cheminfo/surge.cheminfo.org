export type Page = 'generator' | 'exercises' | 'fragments' | 'news';

/** Where each page lives, the generator being the root. */
export const PAGE_PATHS: Record<Page, string> = {
  generator: '/',
  exercises: '/exercises',
  fragments: '/fragments',
  news: '/news',
};

/**
 * The page an address opens. An address this site does not know opens the
 * generator, and is described as the generator rather than under its own name.
 *
 * This module holds the addresses and nothing else — no signal, no listener,
 * nothing that reads `location` — so the build that writes one file per page
 * can import it in Node.
 * @param pathname - The path of the address.
 * @returns The page it opens.
 */
export function readPageOf(pathname: string): Page {
  if (pathname.startsWith('/exercises')) return 'exercises';
  if (pathname.startsWith('/fragments')) return 'fragments';
  if (pathname.startsWith('/news')) return 'news';
  return 'generator';
}
