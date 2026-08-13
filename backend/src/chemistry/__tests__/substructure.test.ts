import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import { FRAGMENTS } from '../fragments/index.ts';
import { matchingFragments } from '../substructure.ts';

/**
 * What each query in the library means, said in molecules. An idCode reads as
 * nothing, so this is where a fragment is checked against the chemistry it is
 * meant to name.
 */
const PANEL: Array<[string, string, string[]]> = [
  ['cyclopropane', 'C1CC1', ['ring-3']],
  ['oxirane', 'C1CO1', ['ring-3', 'ring-3-oxygen', 'ether']],
  ['aziridine', 'C1CN1', ['ring-3', 'ring-3-nitrogen', 'amine-secondary']],
  ['oxetane', 'C1COC1', ['ring-4', 'ring-4-hetero', 'ether']],
  ['cyclopentane', 'C1CCCC1', ['ring-5']],
  ['tetrahydrofuran', 'C1CCOC1', ['ring-5', 'ring-5-hetero', 'ether']],
  ['oxane', 'C1CCOCC1', ['ring-6', 'ring-6-hetero', 'ether']],
  ['benzene', 'C1=CC=CC=C1', ['ring-6', 'ring-aromatic']],
  ['cyclohexene', 'C1=CCCCC1', ['ring-6', 'ring-double-bond', 'alkene']],
  [
    'spiropentane',
    'C1CC12CC2',
    ['ring-3', 'ring-bicyclic', 'ring-spiro', 'carbon-quaternary'],
  ],
  [
    'norbornane',
    'C1CC2CCC1C2',
    ['ring-5', 'ring-6', 'ring-bicyclic', 'ring-fused', 'carbon-tertiary'],
  ],
  ['pentane', 'CCCCC', []],
  ['isopentane', 'CC(C)CC', ['carbon-tertiary', 'gem-dimethyl', 'isopropyl']],
  [
    'neopentane',
    'CC(C)(C)C',
    ['carbon-quaternary', 'gem-dimethyl', 'tert-butyl'],
  ],
  ['butan-1-ol', 'CCCCO', ['alcohol', 'alcohol-primary']],
  ['butan-2-ol', 'CCC(C)O', ['alcohol', 'alcohol-secondary']],
  [
    'tert-butanol',
    'CC(C)(C)O',
    ['alcohol', 'alcohol-tertiary', 'gem-dimethyl'],
  ],
  ['diethyl ether', 'CCOCC', ['ether']],
  ['butanal', 'CCCC=O', ['aldehyde']],
  ['butan-2-one', 'CCC(C)=O', ['ketone']],
  ['acetic acid', 'CC(=O)O', ['carboxylic-acid']],
  ['methyl acetate', 'COC(C)=O', ['ester']],
  ['prop-1-en-1-ol', 'CC=CO', ['alkene', 'enol']],
  ['ethane-1,2-diol', 'OCCO', ['alcohol', 'alcohol-primary', 'two-hydroxyl']],
  ['dimethyl peroxide', 'COOC', ['peroxide']],
  ['propylamine', 'CCCN', ['amine-primary']],
  ['dimethylamine', 'CNC', ['amine-secondary']],
  ['trimethylamine', 'CN(C)C', ['amine-tertiary']],
  ['ethanimine', 'CC=N', ['imine']],
  ['acetonitrile', 'CC#N', ['nitrile']],
  ['acetamide', 'CC(N)=O', ['amide']],
  ['N-methylhydroxylamine', 'CNO', ['nitrogen-oxygen']],
  ['ethenamine', 'C=CN', ['alkene', 'alkene-terminal', 'enamine']],
  ['propene', 'CC=C', ['alkene', 'alkene-terminal']],
  [
    'buta-1,3-diene',
    'C=CC=C',
    ['alkene', 'alkene-terminal', 'diene-conjugated'],
  ],
  ['propadiene', 'C=C=C', ['alkene', 'alkene-terminal', 'allene']],
  ['propyne', 'CC#C', ['alkyne', 'alkyne-terminal']],
  ['but-2-yne', 'CC#CC', ['alkyne']],
  ['ethanethiol', 'CCS', ['thiol']],
  ['dimethyl sulfide', 'CSC', ['thioether']],
  ['dimethyl disulfide', 'CSSC', ['disulfide']],
  ['propane-2-thione', 'CC(C)=S', ['thiocarbonyl']],
  ['1-chlorobutane', 'CCCCCl', ['halogen-on-ch2']],
  ['2-chlorobutane', 'CCC(C)Cl', ['halogen-on-ch']],
  ['2-chloro-2-methylpropane', 'CC(C)(C)Cl', ['halogen-on-c', 'gem-dimethyl']],
  ['1,1-dichloroethane', 'CC(Cl)Cl', ['halogen-on-ch', 'halogen-geminal']],
  ['1,2-dichloroethane', 'ClCCCl', ['halogen-on-ch2', 'halogen-vicinal']],
  ['chloroethene', 'C=CCl', ['alkene', 'alkene-terminal', 'halogen-on-alkene']],
];

test.each(PANEL)(
  '%s holds exactly the expected motifs',
  (_name, smiles, expected) => {
    expect(matchingFragments(Molecule.fromSmiles(smiles))).toStrictEqual(
      expected,
    );
  },
);

test('every motif of the library is exercised by the panel', () => {
  const seen = new Set(PANEL.flatMap(([, , fragments]) => fragments));
  const never = FRAGMENTS.map((fragment) => fragment.id).filter(
    (id) => !seen.has(id),
  );

  expect(never).toStrictEqual([]);
});

test('a molecule is not modified by being looked at', () => {
  const molecule = Molecule.fromSmiles('C1CO1');
  const before = molecule.getIDCode();

  matchingFragments(molecule);

  expect(molecule.getIDCode()).toBe(before);
});
