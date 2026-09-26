/**
 * What this site offers a translator: one catalog of messages, and the tables
 * whose rows are written rather than computed.
 *
 * A motif is a row: its id, its category and the idCodes a query is run from
 * are the same in every language and are not here; what it is called and what
 * is said about it are.
 */

import type {
  CatalogSource,
  TranslatableTable,
} from 'react-cheminfo/translate';

import { CATEGORY_NUDGE, FRAGMENTS } from '../chemistry/fragments/index.ts';
import { DEFAULT_EXERCISE_SET } from '../exercises/defaultSet.ts';
import en from '../locales/en.json' with { type: 'json' };

import { SITE_CATALOG_ID } from './messages.ts';

/** The catalogs the page renders messages from. */
export const CATALOGS: readonly CatalogSource[] = [
  {
    id: SITE_CATALOG_ID,
    repository: 'cheminfo/surge.cheminfo.org',
    directory: 'src/locales',
    messages: en,
  },
];

/** The tables a translator may write, in the order the editor lists them. */
export const TRANSLATABLE_TABLES: readonly TranslatableTable[] = [
  {
    id: 'fragment',
    label: 'Motifs',
    catalogId: SITE_CATALOG_ID,
    fields: [
      {
        id: 'label',
        label: 'Name',
        required: true,
        hint: 'A noun phrase read inside a sentence: "a hydroxyl group", not "Hydroxyl".',
      },
      {
        id: 'description',
        label: 'What the query asks for',
        required: true,
        hint: 'One line a student reads instead of the idCode, which says nothing.',
      },
      {
        id: 'missing',
        label: 'Said when nothing they drew holds it',
        size: 'paragraph',
        required: true,
      },
      {
        id: 'partial',
        label: 'Said when they hold it but not everywhere',
        size: 'paragraph',
        hint: 'Left empty, the sentence of the motif’s category is used.',
      },
    ],
    rows: FRAGMENTS.map((fragment) => ({
      id: fragment.id,
      label: fragment.id,
    })),
  },
  {
    id: 'fragmentCategory',
    label: 'Motif categories',
    catalogId: SITE_CATALOG_ID,
    fields: [
      {
        id: 'nudge',
        label: 'Said when a motif of this category is only half explored',
        size: 'paragraph',
        required: true,
      },
    ],
    rows: Object.keys(CATEGORY_NUDGE).map((category) => ({
      id: category,
      label: category,
    })),
  },
  {
    id: 'exerciseSet',
    label: 'Exercise sets',
    catalogId: SITE_CATALOG_ID,
    fields: [
      { id: 'title', label: 'Title', required: true },
      {
        id: 'description',
        label: 'What it asks for',
        size: 'paragraph',
        required: true,
      },
    ],
    rows: [{ id: DEFAULT_EXERCISE_SET.id, label: DEFAULT_EXERCISE_SET.id }],
  },
];
