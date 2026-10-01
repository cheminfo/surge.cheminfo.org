/**
 * Every address the site answers, with the name and the sentence it is indexed
 * under — in each of the languages the site is written in.
 *
 * One table per language, read by three things: the build, which writes an
 * HTML file per entry per language and the sitemap listing them; the head
 * injector; and the running app, which retitles the tab after an in-app move.
 * A page missing from here is a page a search engine only ever sees as the home
 * page.
 *
 * The machinery that reads it is `react-cheminfo/core` and
 * `react-cheminfo/vite`; what belongs to this site is the prose, which lives in
 * the catalogs of `src/locales` under `seo.<page>.title` and
 * `seo.<page>.description` so a translator writes it where they write
 * everything else.
 *
 * **The paths are the same in every language.** An address is never translated:
 * the progress a student has stored, a link handed out in a course and a
 * bookmark all have to survive a language switch, and the build refuses a table
 * whose paths differ from the English one.
 */

import type { Language, RouteMeta } from 'react-cheminfo/core';
import { DEFAULT_LANGUAGE } from 'react-cheminfo/core';

import type { MessageKey } from '../i18n/messages.ts';
import { translate } from '../i18n/messages.ts';
import type { Page } from '../state/pages.ts';
import { PAGE_PATHS } from '../state/pages.ts';

/**
 * The four pages of the site, the generator being the home page, in the
 * language asked for.
 *
 * A title is written for a search result and a `short` for a menu, so the
 * `noscript` index links each page under the name it is known by and says in a
 * `note` what it is for.
 * @param language - The language the page is served in.
 * @returns The table, in that language.
 */
export function routesFor(language: Language): readonly RouteMeta[] {
  return PAGES.map((page) => ({
    path: PAGE_PATHS[page.page],
    title: translate(`seo.${page.page}.title`, language),
    description: translate(`seo.${page.page}.description`, language),
    // The menu entry is the word the tab already carries, rather than a second
    // translation of it.
    short: translate(page.short, language),
    note: translate(`seo.${page.page}.note`, language),
  }));
}

/**
 * What is the same about a page in every language: where it lives, and the key
 * the crawl path reads its menu label from.
 */
const PAGES: ReadonlyArray<{ page: Page; short: MessageKey }> = [
  { page: 'generator', short: 'ui.tab.generator' },
  { page: 'exercises', short: 'ui.tab.exercises' },
  { page: 'fragments', short: 'ui.tab.fragments' },
  { page: 'about', short: 'ui.generator.about' },
];

/** The table a caller that has no language of its own reads. */
export const PAGE_ROUTES: readonly RouteMeta[] = routesFor(DEFAULT_LANGUAGE);
