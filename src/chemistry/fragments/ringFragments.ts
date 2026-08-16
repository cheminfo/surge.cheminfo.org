import type { FragmentDefinition } from './types.ts';

/**
 * What a ring can be. Every query is a single atom carrying a ring query
 * feature — the ring size, the aromatic state, or how many ring bonds it
 * holds — which is what tells one ring apart from another without drawing it.
 */
export const RING_FRAGMENTS: FragmentDefinition[] = [
  {
    id: 'ring-3',
    label: 'a three-membered ring',
    category: 'ring',
    description: 'Any atom sitting in a ring of three atoms',
    idCodes: ['fH@Mk}y@'],
    missing:
      'Three atoms close a strained but perfectly stable ring, and what is left of the formula hangs off it.',
    partial: 'The same small ring carries its substituents in several ways.',
  },
  {
    id: 'ring-3-oxygen',
    label: 'an oxygen in a three-membered ring',
    category: 'ring',
    description: 'An oxygen atom sitting in a ring of three atoms',
    idCodes: ['fI@G}y@'],
    parent: 'ring-3',
    missing:
      'A heteroatom may sit in the ring itself rather than beside it: an oxygen bridging two carbons is an epoxide.',
  },
  {
    id: 'ring-3-nitrogen',
    label: 'a nitrogen in a three-membered ring',
    category: 'ring',
    description: 'A nitrogen atom sitting in a ring of three atoms',
    idCodes: ['fJ@G}y@'],
    parent: 'ring-3',
    missing:
      'A nitrogen closes the small ring as readily as a carbon does, and it still carries whatever is left over.',
  },
  {
    id: 'ring-4',
    label: 'a four-membered ring',
    category: 'ring',
    description: 'Any atom sitting in a ring of four atoms',
    idCodes: ['fH@Mk}x`'],
    missing:
      'Between the three- and the five-membered ring there is a four-membered one, which is easy to skip over.',
    partial: 'The same ring carries its substituents in several ways.',
  },
  {
    id: 'ring-4-hetero',
    label: 'a heteroatom in a four-membered ring',
    category: 'ring',
    description:
      'A nitrogen, an oxygen or a sulfur sitting in a ring of four atoms',
    idCodes: ['fJ@FMg@HAG{q@'],
    parent: 'ring-4',
    missing: 'The heteroatom can be a member of the four-membered ring itself.',
  },
  {
    id: 'ring-5',
    label: 'a five-membered ring',
    category: 'ring',
    description: 'Any atom sitting in a ring of five atoms',
    idCodes: ['fH@Mk}xP'],
    missing:
      'A five-membered ring uses up one degree of unsaturation and leaves the rest of the formula outside it.',
    partial: 'The same ring carries its substituents in several ways.',
  },
  {
    id: 'ring-5-hetero',
    label: 'a heteroatom in a five-membered ring',
    category: 'ring',
    description:
      'A nitrogen, an oxygen or a sulfur sitting in a ring of five atoms',
    idCodes: ['fJ@FMg@HAG{p`'],
    parent: 'ring-5',
    missing: 'The heteroatom can be a member of the five-membered ring itself.',
  },
  {
    id: 'ring-6',
    label: 'a six-membered ring',
    category: 'ring',
    description: 'Any atom sitting in a ring of six atoms',
    idCodes: ['fH@Mk}xH'],
    missing:
      'The six-membered ring is the one every drawing starts from, and it is worth writing down explicitly.',
    partial: 'The same ring carries its substituents in several ways.',
  },
  {
    id: 'ring-6-hetero',
    label: 'a heteroatom in a six-membered ring',
    category: 'ring',
    description:
      'A nitrogen, an oxygen or a sulfur sitting in a ring of six atoms',
    idCodes: ['fJ@FMg@HAG{pP'],
    parent: 'ring-6',
    missing: 'The heteroatom can be a member of the six-membered ring itself.',
  },
  {
    id: 'ring-aromatic',
    label: 'an aromatic ring',
    category: 'ring',
    description: 'Any atom belonging to an aromatic ring',
    idCodes: ['fH@Njm@'],
    missing:
      'Alternating the double bonds all the way round a six-membered ring costs four degrees of unsaturation and gives an aromatic ring.',
  },
  {
    id: 'ring-double-bond',
    label: 'a double bond inside a ring',
    category: 'ring',
    description: 'A carbon-carbon double bond that is itself a ring bond',
    idCodes: ['eF@Hh\\p`'],
    missing:
      'A ring and a double bond are not exclusive: the double bond can sit in the ring rather than beside it.',
    partial:
      'Walk the double bond around the ring, and around each substituted ring.',
  },
  {
    id: 'ring-bicyclic',
    label: 'two rings sharing an atom',
    category: 'ring',
    description:
      'An atom in a ring that carries more than two ring bonds, which only happens where two rings meet',
    idCodes: ['fH@LkKP'],
    missing:
      'Two degrees of unsaturation buy two rings, and two rings can share atoms instead of standing apart.',
  },
  {
    id: 'ring-spiro',
    label: 'a spiro atom',
    category: 'ring',
    description: 'An atom with four ring bonds, shared by two rings',
    idCodes: ['fH@LkkP'],
    parent: 'ring-bicyclic',
    missing:
      'Two rings can meet at a single atom, which then belongs to both of them.',
  },
  {
    id: 'ring-fused',
    label: 'a bridgehead atom',
    category: 'ring',
    description:
      'An atom with three ring bonds, where two rings share an edge or a bridge',
    idCodes: ['fH@Lk[P'],
    parent: 'ring-bicyclic',
    missing: 'Two rings can also share a bond, or a whole bridge of atoms.',
  },
];
