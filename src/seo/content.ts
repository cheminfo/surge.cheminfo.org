/**
 * What each address says in the HTML the server hands out, above the crawl path.
 *
 * All 4 addresses used to ship the same body — this site's menu — so a crawler
 * was handed one text for every page and told, by the title alone, that they
 * were different pages. Read by the build and by nothing else: `vite.config.ts`
 * calls it once per route per language, so none of this reaches the bundle a
 * browser downloads.
 *
 * A page with nothing written for it falls back to the name and the sentence it
 * is already indexed under. That repeats the snippet rather than adding to it,
 * which is thin — but the route table writes those distinctly per page, so a
 * thin page is never a duplicate of its neighbour.
 */

import type { Language, PageContent, RouteMeta } from 'react-cheminfo/core';

import { translate } from '../i18n/messages.ts';
import { PAGE_PATHS } from '../state/pages.ts';

/**
 * What one address says for itself, in the language it is served in.
 *
 * Read by `cheminfoPrerender` once per route per language at build time.
 * @param route - The address being written, already in that language.
 * @param language - The language the page is served in.
 * @returns Its text, authored where there is any and otherwise the name and
 * sentence the route already carries.
 */
export function pageContent(route: RouteMeta, language: Language): PageContent {
  if (route.path === PAGE_PATHS.generator) {
    return {
      heading: route.title,
      paragraphs: [
        translate('seo.generator.paragraph1', language),
        translate('seo.generator.paragraph2', language),
      ],
    };
  }
  return { heading: route.title, paragraphs: [route.description] };
}
