import type { FragmentDefinition } from './types.ts';

/** What a nitrogen can be doing in the structure. */
export const NITROGEN_FRAGMENTS: FragmentDefinition[] = [
  {
    id: 'amine-primary',
    label: 'a primary amine',
    category: 'nitrogen',
    description: 'A nitrogen with two hydrogens, bonded to a saturated carbon',
    idCodes: ['eF`BLGt[mGL'],
    missing:
      'A nitrogen at the end of the skeleton keeps two of its hydrogens.',
    partial: 'The NH2 moves from one carbon of the skeleton to another.',
  },
  {
    id: 'amine-secondary',
    label: 'a secondary amine',
    category: 'nitrogen',
    description: 'A nitrogen with one hydrogen, between two saturated carbons',
    idCodes: ['eM`BN`~b}xyk@'],
    missing:
      'A nitrogen inside the skeleton joins two carbons and keeps one hydrogen.',
    partial:
      'The nitrogen splits the carbons into two groups; every way of splitting them is another amine.',
  },
  {
    id: 'amine-tertiary',
    label: 'a tertiary amine',
    category: 'nitrogen',
    description:
      'A nitrogen with no hydrogen, bonded to three saturated carbons',
    idCodes: ['gCh@AGj@{tZ^X'],
    missing:
      'A nitrogen makes three bonds, so it can carry three carbons and no hydrogen at all.',
  },
  {
    id: 'imine',
    label: 'a carbon-nitrogen double bond',
    category: 'nitrogen',
    description: 'A carbon and a nitrogen joined by a double bond',
    idCodes: ['eF`BJG\\T'],
    missing:
      'One degree of unsaturation can be spent between the carbon and the nitrogen rather than between two carbons.',
  },
  {
    id: 'nitrile',
    label: 'a nitrile',
    category: 'nitrogen',
    description: 'A carbon and a nitrogen joined by a triple bond',
    idCodes: ['eF`BND'],
    missing:
      'Two degrees of unsaturation on the nitrogen give a triple bond, and the nitrogen then ends the chain.',
  },
  {
    id: 'amide',
    label: 'an amide',
    category: 'nitrogen',
    description: 'A nitrogen on a carbon that is doubly bonded to an oxygen',
    idCodes: ['eMhDRVCmjl'],
    missing:
      'When the formula holds both a nitrogen and an oxygen, the two can meet on the same carbon.',
  },
  {
    id: 'enamine',
    label: 'a nitrogen on a double bond',
    category: 'nitrogen',
    description: 'A nitrogen bonded to a carbon that is part of a double bond',
    idCodes: ['eM`AIdNxX'],
    missing:
      'The nitrogen can hang off a doubly bonded carbon instead of a saturated one.',
  },
  {
    id: 'nitrogen-oxygen',
    label: 'a nitrogen-oxygen bond',
    category: 'nitrogen',
    description: 'A nitrogen bonded to an oxygen',
    idCodes: ['eFhHcA@'],
    missing:
      'The nitrogen and the oxygen may be bonded to each other rather than each to the carbons.',
  },
];
