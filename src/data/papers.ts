import type { CitedWork, Reference } from 'react-cheminfo/core';

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
 * The platform the site is built on: chemical data processed in the browser,
 * which is what makes this an application rather than a queue of jobs.
 */
export const PLATFORM_PAPER: Reference = {
  authors: [{ given: 'L.', family: 'Patiny' }],
  title:
    'Unlocking the Potential of Browser-Based Scientific Data Analysis: A 20-Year Journey of Expertise',
  journal: 'CHIMIA',
  journalAbbreviation: 'Chimia',
  year: 2025,
  volume: '79',
  issue: '1-2',
  firstPage: '66',
  lastPage: '69',
  doi: '10.2533/chimia.2025.66',
  publisher: 'Swiss Chemical Society',
};

/**
 * The two works this site asks to be cited, each with what citing it credits.
 * One place holds them, so the header's Cite button and the About panel can
 * never name a different paper.
 */
export const SURGE_WORKS: readonly CitedWork[] = [
  {
    reference: SURGE_PAPER,
    what: 'The isomer generator',
    note: 'Cite it for the enumeration: every structure this site hands out comes from surge.',
  },
  {
    reference: PLATFORM_PAPER,
    what: 'Data processing in the browser',
    note: 'Cite it for the site itself, which runs the generator in the browser.',
  },
];
