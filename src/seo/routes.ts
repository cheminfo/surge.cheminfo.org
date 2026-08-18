/**
 * Every address the site answers, with the name and the sentence it is indexed
 * under.
 *
 * One table, read by three things: the build, which writes an HTML file per
 * entry and the sitemap listing them; the head injector; and the running app,
 * which retitles the tab after an in-app move. A page missing from here is a
 * page a search engine only ever sees as the home page.
 *
 * The machinery that reads it is `react-cheminfo/core` and
 * `react-cheminfo/vite`; what belongs to this site is the prose below. The
 * paths come from `state/pages.ts`, so the router and the crawler can never
 * disagree about where a page lives.
 */

import type { RouteMeta } from 'react-cheminfo/core';

import { PAGE_PATHS } from '../state/pages.ts';

/**
 * The four pages of the site, the generator being the home page.
 *
 * A title is written for a search result and a `short` for a menu, so the
 * `noscript` index links each page under the name it is known by and says in a
 * `note` what it is for.
 */
export const PAGE_ROUTES: readonly RouteMeta[] = [
  {
    path: PAGE_PATHS.generator,
    title: 'Every constitutional isomer of a molecular formula',
    description:
      'Type a molecular formula and enumerate every constitutional isomer of it. Surge runs as WebAssembly in your browser, counting the structures as it goes.',
    short: 'Generator',
    note: 'every isomer of a formula',
  },
  {
    path: PAGE_PATHS.exercises,
    title: 'Isomer exercises — find them yourself, then check',
    description:
      'Draw the constitutional isomers of a formula yourself and have each one marked against the complete set Surge enumerates, with hints when you are stuck.',
    short: 'Exercises',
    note: 'find the isomers yourself',
  },
  {
    path: PAGE_PATHS.fragments,
    title: 'The fragment library behind the exercise hints',
    description:
      'Rings, alcohols, amines, halogens: the motifs an exercise hint is built from, each with its openchemlib query and how many isomers of a formula hold it.',
    short: 'Fragments',
    note: 'the motifs behind the hints',
  },
  {
    path: PAGE_PATHS.news,
    title: 'What changed in Surge',
    description:
      'The releases of this site and of the Surge generator behind it: what each one added, and what it means for the structures you get back.',
    short: 'News',
    note: 'what changed in Surge',
  },
];
