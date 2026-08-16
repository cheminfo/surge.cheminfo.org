import type { Page } from './router.ts';
import type { HideKey, ShareConfig } from './shareConfig.ts';

export interface ShareFeature {
  key: HideKey;
  /** Named positively: the dialog shows a checked box for what stays visible. */
  label: string;
  /** What switching it off does, for the person building the link. */
  description: string;
  /**
   * Off in a link that was not touched: what a page framed in a course has no
   * use for.
   * @default false
   */
  hiddenByDefault?: boolean;
}

export interface PageShareOptions {
  /** How the page is named in the dialog and in the iframe title. */
  title: string;
  features: ShareFeature[];
  /** Whether the dialog offers to pick the exercises the link hands out. */
  hasExercises: boolean;
}

/**
 * What the share dialog can configure on a page.
 * @param page - The page currently open.
 * @returns Its title, the parts it can switch off, and whether it carries a set.
 */
export function shareOptionsOf(page: Page): PageShareOptions {
  return PAGES[page];
}

/**
 * The link the dialog offers before anything is ticked: framed, with the parts
 * a course has no use for already switched off.
 * @param options - What the page can configure.
 * @returns The configuration to start from.
 */
export function defaultShareConfig(options: PageShareOptions): ShareConfig {
  return {
    embed: true,
    hidden: options.features
      .filter((feature) => feature.hiddenByDefault)
      .map((feature) => feature.key),
  };
}

const GENERATOR: ShareFeature[] = [
  {
    key: 'options',
    label: 'Options and restrictions',
    description:
      'The fold under the formula. Hiding it keeps the restrictions the link carries, so the visitor searches under the rules you set.',
    hiddenByDefault: true,
  },
  {
    key: 'substructure',
    label: 'Substructure filter',
    description:
      'Drawing a fragment the isomers must contain. A fragment the link carries keeps filtering.',
    hiddenByDefault: true,
  },
  {
    key: 'lists',
    label: 'Export the structures',
    description:
      'The button under the formula, handing out the results as SMILES, idCodes or an SDF.',
    hiddenByDefault: true,
  },
  {
    key: 'about',
    label: 'About and citation',
    description: 'What the generator does, and the paper to cite for surge.',
  },
];

const EXERCISES: ShareFeature[] = [
  {
    key: 'list',
    label: 'The list of exercises',
    description:
      'The column on the left. Hide it for a frame that holds a single formula.',
  },
  {
    key: 'hints',
    label: 'Hints',
    description: 'The hint ladder, revealed one rung at a time.',
  },
  {
    key: 'answers',
    label: 'Give up and see the answers',
    description:
      'The correction. Hiding it leaves finding the isomers as the only way through.',
  },
  {
    key: 'clear',
    label: 'Clear the answers',
    description:
      'The buttons that forget what was found, for one exercise and for all of them.',
  },
];

const PAGES: Record<Page, PageShareOptions> = {
  generator: {
    title: 'Generator',
    features: GENERATOR,
    hasExercises: false,
  },
  exercises: {
    title: 'Exercises',
    features: EXERCISES,
    hasExercises: true,
  },
  fragments: {
    title: 'Fragments',
    features: [],
    hasExercises: false,
  },
  news: {
    title: 'News',
    features: [],
    hasExercises: false,
  },
};
