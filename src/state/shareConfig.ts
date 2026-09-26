import { signal } from '@preact/signals-react';
import type { ShareConfig, ShareVocabulary } from 'react-cheminfo/core';
import {
  EMBED_PARAM,
  HIDE_PARAM,
  LANGUAGE_PARAM,
  isHidden as isPartHidden,
  parseShareConfig,
} from 'react-cheminfo/core';

/**
 * Every part of a page a shared link can switch off, with what switching it
 * off does — written for the person building the link rather than for the
 * visitor.
 *
 * This is the only place that knows those names. Components ask
 * {@link isHidden} and never read the address themselves.
 */
export const SHARE_VOCABULARY = {
  parts: [
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
  ],
} as const satisfies ShareVocabulary;

/**
 * A part of a page a shared link switches off. A key a page does not know
 * about is simply ignored, so a link written for an older version of the site
 * still opens.
 */
export type HideKey = (typeof SHARE_VOCABULARY)['parts'][number]['key'];

/** Parameters that configure the page rather than feed the tool. */
export const SHARE_PARAM_KEYS = [
  EMBED_PARAM,
  HIDE_PARAM,
  LANGUAGE_PARAM,
] as const;

/**
 * The configuration of the page currently open, read once from the address it
 * was opened with. Every address the application writes afterwards goes
 * through `navigate`, which keeps the parameters it does not know about, so a
 * reload — or a link copied out of the frame — restores the same page.
 */
export const shareConfig = signal<ShareConfig>(
  parseShareConfig(globalThis.location?.search ?? '', SHARE_VOCABULARY),
);

/**
 * Whether the page is framed by another site, such as a course on
 * learn.cheminfo.org, in which case the header is left out and the activity
 * takes the whole frame.
 * @returns True when the address asks for embed mode.
 */
export function isEmbedded(): boolean {
  return shareConfig.value.embed;
}

/**
 * Whether the link switches a part of the page off. A hidden control still
 * applies the value the link carries: hiding is about what a visitor may
 * change, not about what is asked of surge.
 * @param key - The part to test.
 * @returns True when it must not be rendered.
 */
export function isHidden(key: HideKey): boolean {
  return isPartHidden(shareConfig.value, key);
}
