import type { FragmentDefinition } from './types.ts';

/** Sulfur, the halogens, and the shape of the carbon skeleton itself. */
export const SULFUR_FRAGMENTS: FragmentDefinition[] = [
  {
    id: 'thiol',
    label: 'a thiol',
    category: 'sulfur',
    description: 'A sulfur carrying a hydrogen',
    idCodes: ['fH`PA}WnX'],
    missing:
      'Sulfur sits under oxygen in the table and behaves the same way: an SH is the thiol of an alcohol.',
    partial: 'The SH moves from one carbon of the skeleton to another.',
  },
  {
    id: 'thioether',
    label: 'a thioether',
    category: 'sulfur',
    description: 'A sulfur between two carbons',
    idCodes: [String.raw`eMB@HchOh_\L`],
    missing:
      'The sulfur can bridge two carbons, as the oxygen of an ether does.',
  },
  {
    id: 'disulfide',
    label: 'a sulfur-sulfur bond',
    category: 'sulfur',
    description: 'Two sulfurs bonded to each other',
    idCodes: ['eFA@H`bLGZNX'],
    missing: 'Two sulfurs bond to each other readily.',
  },
  {
    id: 'thiocarbonyl',
    label: 'a carbon-sulfur double bond',
    category: 'sulfur',
    description: 'A carbon and a sulfur joined by a double bond',
    idCodes: ['eFB@HbawE@'],
    missing: 'The sulfur takes a double bond as the oxygen of a carbonyl does.',
  },
];

export const HALOGEN_FRAGMENTS: FragmentDefinition[] = [
  {
    id: 'halogen-on-ch2',
    label: 'a halogen on a CH2 or a CH3',
    category: 'halogen',
    description: 'A halogen on a carbon that carries two or three hydrogens',
    idCodes: ['eFBJPcAuSzMcQRDQbUfxX', 'eFBJPcAuSzNcQRDQbUfxX'],
    missing: 'Put the halogen at the end of the chain, on a CH2 or a CH3.',
    partial: 'The halogen moves from one end of the skeleton to another.',
  },
  {
    id: 'halogen-on-ch',
    label: 'a halogen on a CH',
    category: 'halogen',
    description: 'A halogen on a carbon that carries a single hydrogen',
    idCodes: ['eFBJPcAuSzKcQRDQbUfxX'],
    missing:
      'Put the halogen inside the chain, on a carbon that keeps a single hydrogen.',
  },
  {
    id: 'halogen-on-c',
    label: 'a halogen on a carbon with no hydrogen',
    category: 'halogen',
    description: 'A halogen on a carbon that carries no hydrogen',
    idCodes: ['eFBJPcAuSzGcQRDQbUfxX'],
    missing:
      'Put the halogen on a carbon that keeps no hydrogen at all — a branch point, or a carbon already carrying another halogen.',
  },
  {
    id: 'halogen-geminal',
    label: 'two halogens on one carbon',
    category: 'halogen',
    description: 'A saturated carbon carrying two halogens',
    idCodes: ['eMAJPYBN`zYVKEHQFIVIRDQbUfxX'],
    missing: 'Both halogens can end up on the same carbon.',
  },
  {
    id: 'halogen-vicinal',
    label: 'two halogens on neighbouring carbons',
    category: 'halogen',
    description:
      'Two saturated carbons bonded to each other, each with a halogen',
    idCodes: ['gC`DEHZPRfhCiIsEHiBHqJsEHQFIV[P\\X'],
    missing:
      'The two halogens can sit on carbons that are bonded to each other.',
  },
  {
    id: 'halogen-on-alkene',
    label: 'a halogen on a doubly bonded carbon',
    category: 'halogen',
    description: 'A halogen on a carbon with three connections',
    idCodes: ['eFBJPcAuSFbdHcDkMqP'],
    missing:
      'A halogen can also sit on a carbon that is part of a double bond, not only on a saturated one.',
  },
];

export const SKELETON_FRAGMENTS: FragmentDefinition[] = [
  {
    id: 'carbon-tertiary',
    label: 'a carbon with three carbon neighbours',
    category: 'skeleton',
    description: 'A carbon carrying one hydrogen and three other carbons',
    idCodes: ['gC`@H}PGtE{`X'],
    missing:
      'A branch point is a carbon holding three others; the chain no longer runs straight through it.',
    partial:
      'The branch point moves along the chain, and the branch itself can grow.',
  },
  {
    id: 'carbon-quaternary',
    label: 'a carbon with four carbon neighbours',
    category: 'skeleton',
    description: 'A carbon carrying no hydrogen and four other carbons',
    idCodes: ['gJP@H~j@`'],
    parent: 'carbon-tertiary',
    missing:
      'A carbon can hold four other carbons and no hydrogen at all, which is the most branched thing a skeleton does.',
  },
  {
    id: 'gem-dimethyl',
    label: 'two methyls on the same carbon',
    category: 'skeleton',
    description: 'Two CH3 groups bonded to one saturated carbon',
    idCodes: ['eM@HzCyn^wcfl'],
    missing:
      'Rather than lengthening the chain, hang two methyls on the same carbon.',
    partial:
      'That pair of methyls can sit on more than one carbon of the chain.',
  },
  {
    id: 'isopropyl',
    label: 'an isopropyl group',
    category: 'skeleton',
    description: 'A CH carrying two CH3 groups and one other carbon',
    idCodes: ['gC`@H}PGvEsev|GFf'],
    parent: 'gem-dimethyl',
    missing: 'Two methyls on a CH make the isopropyl end of a skeleton.',
  },
  {
    id: 'tert-butyl',
    label: 'a tert-butyl group',
    category: 'skeleton',
    description: 'A carbon carrying three CH3 groups and one other carbon',
    idCodes: ['gJP@H~j@~ty]nwht|p'],
    parent: 'gem-dimethyl',
    missing:
      'Three methyls on one carbon make the tert-butyl end of a skeleton.',
  },
];
