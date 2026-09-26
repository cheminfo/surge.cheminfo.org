import type { HideablePart, ShareVocabulary } from 'react-cheminfo/core';

import type { Page } from './router.ts';
import type { HideKey } from './shareConfig.ts';
import { SHARE_VOCABULARY } from './shareConfig.ts';

export interface PageShareOptions {
  /** How the page is named in the dialog and in the iframe title. */
  title: string;
  /** What this page can switch off. */
  vocabulary: ShareVocabulary;
  /** Whether the dialog offers to pick the exercises the link hands out. */
  hasExercises: boolean;
}

/**
 * What the share dialog can configure on a page.
 * @param page - The page currently open.
 * @returns Its title, the parts it can switch off, and whether it carries a set.
 */
export function shareOptionsOf(page: Page): PageShareOptions {
  const { title, parts, hasExercises } = PAGES[page];
  return { title, vocabulary: { parts: partsOf(parts) }, hasExercises };
}

const GENERATOR: readonly HideKey[] = [
  'options',
  'substructure',
  'lists',
  'about',
];
const EXERCISES: readonly HideKey[] = ['list', 'hints', 'answers', 'clear'];

const PAGES: Record<
  Page,
  { title: string; parts: readonly HideKey[]; hasExercises: boolean }
> = {
  generator: {
    title: 'Generator',
    parts: GENERATOR,
    hasExercises: false,
  },
  exercises: {
    title: 'Exercises',
    parts: EXERCISES,
    hasExercises: true,
  },
  fragments: { title: 'Fragments', parts: [], hasExercises: false },
  about: { title: 'About', parts: [], hasExercises: false },
};

function partsOf(keys: readonly HideKey[]): readonly HideablePart[] {
  const wanted = new Set<string>(keys);
  return SHARE_VOCABULARY.parts.filter((part) => wanted.has(part.key));
}
