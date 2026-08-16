import type { FragmentDefinition } from './types.ts';

/** What an oxygen can be doing in the structure. */
export const OXYGEN_FRAGMENTS: FragmentDefinition[] = [
  {
    id: 'alcohol',
    label: 'a hydroxyl group',
    category: 'oxygen',
    description: 'An OH on a saturated carbon',
    idCodes: ['eFHBLGtWmGL'],
    missing:
      'The simplest thing an oxygen does is carry a hydrogen and hang off a carbon.',
    partial:
      'The same hydroxyl moves from one carbon of the skeleton to another.',
  },
  {
    id: 'alcohol-primary',
    label: 'a primary alcohol',
    category: 'oxygen',
    description: 'An OH on a carbon that carries two or three hydrogens',
    idCodes: ['eFHBLGrW[mGL', 'eFHBLGrW]mGL'],
    parent: 'alcohol',
    missing: 'Put the hydroxyl at the end of the chain, on a CH2.',
  },
  {
    id: 'alcohol-secondary',
    label: 'a secondary alcohol',
    category: 'oxygen',
    description: 'An OH on a carbon that carries a single hydrogen',
    idCodes: ['eFHBLGrWWmGL'],
    parent: 'alcohol',
    missing:
      'Put the hydroxyl inside the chain, on a carbon with two carbon neighbours.',
  },
  {
    id: 'alcohol-tertiary',
    label: 'a tertiary alcohol',
    category: 'oxygen',
    description: 'An OH on a carbon that carries no hydrogen',
    idCodes: ['eFHBLGrWOmGL'],
    parent: 'alcohol',
    missing:
      'Put the hydroxyl on a carbon that is already surrounded by three other carbons.',
  },
  {
    id: 'ether',
    label: 'an ether',
    category: 'oxygen',
    description: 'An oxygen between two saturated carbons',
    idCodes: ['eMHBN`{Yk@'],
    missing:
      'The oxygen can sit inside the skeleton rather than at its edge, joining two carbons.',
    partial:
      'The oxygen splits the carbons into two groups; every way of splitting them is a different ether.',
  },
  {
    id: 'aldehyde',
    label: 'an aldehyde',
    category: 'oxygen',
    description: 'A carbon carrying one hydrogen and a double bond to oxygen',
    idCodes: ['eFHBJGuWnj'],
    missing:
      'A double bond to the oxygen at the end of the chain leaves one hydrogen on that carbon.',
  },
  {
    id: 'ketone',
    label: 'a ketone',
    category: 'oxygen',
    description: 'A carbon between two carbons, doubly bonded to an oxygen',
    idCodes: ['gCa@@dsPD'],
    missing:
      'The same double bond to the oxygen inside the chain gives a carbon with two carbon neighbours.',
    partial: 'The carbonyl can sit at more than one position of the skeleton.',
  },
  {
    id: 'enol',
    label: 'an enol',
    category: 'oxygen',
    description: 'A hydroxyl on a carbon that is part of a double bond',
    idCodes: [String.raw`eMHAIdOho\L`],
    missing:
      'A hydroxyl on a doubly bonded carbon is a structure of its own, however readily it would tautomerize.',
  },
  {
    id: 'carboxylic-acid',
    label: 'a carboxylic acid',
    category: 'oxygen',
    description: 'A carbon doubly bonded to one oxygen and carrying an OH',
    idCodes: ['eMDARVCz[vuV'],
    missing:
      'Two oxygens on the same carbon, one doubled and one carrying the hydrogen.',
  },
  {
    id: 'ester',
    label: 'an ester',
    category: 'oxygen',
    description:
      'A carbon doubly bonded to one oxygen and single bonded to an oxygen that carries another carbon',
    idCodes: ['gJP`@dfVhB'],
    missing:
      'The two oxygens can also be split: one doubled onto the carbon, the other bridging to a second carbon.',
  },
  {
    id: 'peroxide',
    label: 'an oxygen-oxygen bond',
    category: 'oxygen',
    description: 'Two oxygens bonded to each other',
    idCodes: ['eFDBcAvcf'],
    missing:
      'Nothing forbids the two oxygens from being bonded to each other, however unstable that would be.',
  },
  {
    id: 'two-hydroxyl',
    label: 'two hydroxyl groups',
    category: 'oxygen',
    description: 'Two separate OH groups in the same structure',
    idCodes: ['eDDB@OdnoZNX'],
    missing:
      'With two oxygens, both may end up as hydroxyls, on the same carbon or on two different ones.',
    partial:
      'Move the second hydroxyl along the skeleton, the first one staying put.',
  },
];
