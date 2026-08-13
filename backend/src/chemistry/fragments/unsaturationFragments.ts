import type { FragmentDefinition } from './types.ts';

/** Where the multiple bonds are, and how many of them meet. */
export const UNSATURATION_FRAGMENTS: FragmentDefinition[] = [
  {
    id: 'alkene',
    label: 'a carbon-carbon double bond',
    category: 'unsaturation',
    description: 'Two carbons joined by a double bond',
    idCodes: ['eF@HhP'],
    missing:
      'A degree of unsaturation is a ring or a double bond, and the double bond between two carbons is the other half of that choice.',
    partial:
      'Move the double bond along the chain, then onto each branched skeleton.',
  },
  {
    id: 'alkene-terminal',
    label: 'a double bond at the end of a chain',
    category: 'unsaturation',
    description: 'A CH2 joined to a carbon by a double bond',
    idCodes: ['eF@Hh_Qh'],
    parent: 'alkene',
    missing:
      'The double bond does not have to sit inside the chain: at the end of it, one of the two carbons carries two hydrogens.',
  },
  {
    id: 'diene-conjugated',
    label: 'two conjugated double bonds',
    category: 'unsaturation',
    description: 'Four carbons as double, single, double',
    idCodes: ['gC`@Die@`'],
    missing:
      'Two degrees of unsaturation can be spent on two double bonds, and they may sit one bond apart.',
    partial: 'The conjugated pair can slide along the skeleton.',
  },
  {
    id: 'allene',
    label: 'two double bonds on one carbon',
    category: 'unsaturation',
    description: 'Three carbons as double, double — a cumulated diene',
    idCodes: ['eM@HuB'],
    missing:
      'Two double bonds can also meet on the same carbon, which leaves it with no hydrogen at all.',
  },
  {
    id: 'alkyne',
    label: 'a triple bond',
    category: 'unsaturation',
    description: 'Two carbons joined by a triple bond',
    idCodes: ['eF@HxP'],
    missing:
      'A triple bond counts for two degrees of unsaturation on its own, and its four atoms are in a line.',
    partial: 'The triple bond can sit at more than one place of the skeleton.',
  },
  {
    id: 'alkyne-terminal',
    label: 'a triple bond at the end of a chain',
    category: 'unsaturation',
    description: 'A CH joined to a carbon by a triple bond',
    idCodes: ['eF@Hx_QX'],
    parent: 'alkyne',
    missing:
      'The triple bond can end the chain, leaving a single hydrogen on the last carbon.',
  },
];
