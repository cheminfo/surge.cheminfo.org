import type { Page } from './pages.ts';
import { PAGE_PATHS, readPageOf } from './pages.ts';

export const SITE_NAME = 'surge.cheminfo.org';
export const SITE_URL = 'https://surge.cheminfo.org';

export interface PageMeta {
  /** What the tab, the search result and the shared card are titled. */
  title: string;
  /** The line under the title in a search result and a shared card. */
  description: string;
  /** The address this page is indexed under. */
  canonicalPath: string;
}

const META: Record<Page, { title: string; description: string }> = {
  generator: {
    title: 'Every constitutional isomer of a molecular formula',
    description:
      'Type a molecular formula and enumerate every constitutional isomer of it with Surge, running as WebAssembly in your browser — no upload, no queue, and the structures drawn as they arrive.',
  },
  exercises: {
    title: 'Isomer exercises — find them yourself, then check',
    description:
      'Draw the constitutional isomers of a formula yourself and have them marked against the complete set Surge enumerates. Hints when you are stuck, and a series a teacher can hand out as one link.',
  },
  fragments: {
    title: 'Constrain the isomers — required and forbidden fragments',
    description:
      'Narrow an enumeration to the structures that contain the fragments you require and none you forbid, so a formula with millions of isomers becomes a set you can look at.',
  },
  news: {
    title: 'What changed in Surge',
    description:
      'The releases of this site and of the Surge generator behind it: what each one added, and what it means for the structures you get back.',
  },
};

/**
 * The title, the description and the canonical address of a page. The build
 * writes one file per address from this, and the page keeps its tab in step
 * with it as the visitor moves.
 * @param page - The page on show.
 * @returns What that page is called and what it is about.
 */
export function pageMetaFor(page: Page): PageMeta {
  const { title, description } = META[page];
  // A formula, a set of exercises and a share configuration are what the page
  // is working on, never a page of their own.
  return { title, description, canonicalPath: PAGE_PATHS[page] };
}

/**
 * The address of each page, and what it is called. The sitemap lists these, and
 * the build writes one file per entry.
 * @returns Every page of the site, the generator first.
 */
export function everyPage(): PageMeta[] {
  return (Object.keys(META) as Page[]).map((page) => pageMetaFor(page));
}

/**
 * What the tab says on the page currently open.
 * @param pathname - The path of the address.
 * @returns The title, site name included.
 */
export function documentTitle(pathname: string): string {
  return `${pageMetaFor(readPageOf(pathname)).title} — ${SITE_NAME}`;
}
