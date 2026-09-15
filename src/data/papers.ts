import type { CitedWork, Reference } from 'react-cheminfo/core';
import { PLATFORM_WORK } from 'react-cheminfo/core';

/**
 * The generator this service is a front end for: every structure the site hands
 * out comes out of surge, so it is the work the enumeration itself credits.
 */
export const SURGE_PAPER: Reference = {
  authors: [
    { given: 'B. D.', family: 'McKay' },
    { given: 'M. A.', family: 'Yirik' },
    { given: 'C.', family: 'Steinbeck' },
  ],
  title: 'Surge: a fast open-source chemical graph generator',
  journal: 'Journal of Cheminformatics',
  journalAbbreviation: 'J. Cheminform.',
  year: 2022,
  volume: '14',
  issue: '1',
  // An article number rather than a page range, which is how this journal
  // paginates: the article is 14, 24.
  firstPage: '24',
  lastPage: '24',
  doi: '10.1186/s13321-022-00604-9',
  publisher: 'Springer Nature',
};

/**
 * The two works this site asks to be cited, the platform paper first, each with
 * what citing it credits. One place holds them, so the header's Cite button and
 * the About panel can never name a different paper.
 */
export const SURGE_WORKS: readonly CitedWork[] = [
  PLATFORM_WORK,
  {
    reference: SURGE_PAPER,
    what: 'The isomer generator',
    note: 'Cite it for the enumeration: every structure this site hands out comes from surge.',
  },
];
