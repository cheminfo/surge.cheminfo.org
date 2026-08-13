import type { Page } from '../../state/router.ts';

export interface NewsLink {
  /** Where the entry sends the reader. */
  page: Page;
  label: string;
  /**
   * What the page opens on, so an entry can show what it talks about rather
   * than describe it.
   * @default {}
   */
  parameters?: Record<string, string>;
}

export interface NewsEntry {
  id: string;
  /** The day it landed, as `YYYY-MM-DD`. */
  date: string;
  title: string;
  /** One line under the title. */
  summary: string;
  /** The prose, a string per paragraph. */
  body: string[];
  /**
   * Show the version the service is running next to the title. Written nowhere:
   * it is read off the executable, like everything else surge decides.
   * @default false
   */
  showsSurgeVersion?: boolean;
  /**
   * Where to go and see it, when there is somewhere.
   * @default undefined
   */
  link?: NewsLink;
}

/**
 * What changed, newest first. Prose only — an entry never states a count or a
 * version, since both are read off the executable at run time.
 */
export const NEWS: NewsEntry[] = [
  {
    id: 'exercises-sets',
    date: '2026-08-13',
    title: 'Exercise sets a teacher puts together',
    summary:
      'The set is the address: pick the formulas, arrange them, hand out the link.',
    body: [
      'An exercise asks for every constitutional isomer of a formula, and the isomers are enumerated when the exercise opens, so what is asked and what is corrected can never disagree. The difficulty is read off that same enumeration rather than written down, which is why a set assembled this morning is coloured exactly like the one shipped with the service.',
      'Which formulas the set holds lives in the address. Running the mouse over a formula in the picker draws every one of its isomers, so what is handed out is seen rather than counted, and the order of the picker — a formula is dragged into place, or moved with the arrow keys — is the order the student walks through. A set too long to write in a link can be a JSON document hosted anywhere, which the link then points at.',
      'What a student found is kept in their browser, with the drawing each answer was made with, so a reload gives them back their own structures rather than a layout computed from the answer. Hints are built by comparing the motifs of the answers with the motifs of what was drawn, and nothing is ever suggested twice.',
    ],
    link: {
      page: 'exercises',
      label: 'Open the exercises',
      parameters: { formulas: 'C4H10O,C5H12' },
    },
  },
  {
    id: 'new-interface',
    date: '2026-08-13',
    title: 'A new interface',
    summary:
      'One React application replaces the two visualizer views, and any page of it can be framed in a course.',
    body: [
      'The generator keeps the search on the left and the drawings on the right, so a result is read without scrolling past the form that produced it: everything but the formula and its button lives in a fold, and the substructure filter is drawn in a dialog. Under the form, one button writes what was generated as SMILES, as idCodes, or as an SDF.',
      'Every page is an address one can hand out, and the Share button builds it: a link, or an iframe to paste into a course, with the header dropped and the parts a course has no use for already switched off. A phone gets one column and one scrollbar.',
      'The motifs a hint is built from are no longer hidden in the service — the fragments page draws the whole library, and given a formula, how many of its isomers hold each motif.',
    ],
    link: { page: 'generator', label: 'Open the generator' },
  },
  {
    id: 'surge-2',
    date: '2026-08-13',
    title: 'A new version of surge',
    summary:
      'The enumeration is driven by the current surge release, compiled into the image.',
    body: [
      'Surge counts by default and only writes structures when it is asked to, so the service asks for them on every run, and asks for one Kekulé structure per aromatic ring unless a search turns that off. The restrictions it understands — rings, unsaturation, the fragments a structure must or must not hold — are passed through to the generator and validated before they reach a command line.',
      'The executable is located at start-up and its version is read from it, never written down here: the number beside this entry is the one answering right now.',
    ],
    showsSurgeVersion: true,
    link: { page: 'generator', label: 'Generate something' },
  },
];
