import { Molecule, SSSearcher } from 'openchemlib';

import type { FragmentDefinition } from './fragments/index.ts';
import { FRAGMENTS } from './fragments/index.ts';

/**
 * Which motifs a structure holds.
 * @param molecule - Structure to look at. It is not modified.
 * @returns The ids of the fragments found in it, in library order.
 */
export function matchingFragments(molecule: Molecule): string[] {
  const found: string[] = [];
  for (const { id, queries } of COMPILED) {
    for (const query of queries) {
      SEARCHER.setMol(query, molecule);
      if (SEARCHER.isFragmentInMolecule()) {
        found.push(id);
        break;
      }
    }
  }
  return found;
}

/**
 * Read one of the queries a fragment is made of, which is what draws it.
 * @param idCode - idCode of the query, as the library stores it.
 * @returns The query as a molecule, marked as a fragment.
 */
export function fragmentQuery(idCode: string): Molecule {
  const query = Molecule.fromIDCode(idCode);
  // An idCode carries the query features but not the flag that says the
  // structure is a query at all, and the searcher refuses a molecule.
  query.setFragment(true);
  return query;
}

/** One searcher is enough: a search runs to completion before the next one. */
const SEARCHER = new SSSearcher();

const COMPILED: Array<{ id: string; queries: Molecule[] }> = FRAGMENTS.map(
  (fragment: FragmentDefinition) => ({
    id: fragment.id,
    queries: fragment.idCodes.map((idCode) => fragmentQuery(idCode)),
  }),
);
