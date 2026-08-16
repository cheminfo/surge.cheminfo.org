import type { Reference } from 'react-cheminfo/core';

/**
 * The work this service asks to be cited: surge itself, not the site around
 * it. One place holds it, so the header's Cite button and the About panel can
 * never name a different paper.
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
