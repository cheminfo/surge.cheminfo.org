import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import {
  constitutionIDCode,
  moleculeFormula,
  moleculeFromIDCode,
  normalizeFormula,
} from '../molecule.ts';

test('a formula is canonicalized to the form surge expects', () => {
  expect(normalizeFormula('C6H10O')).toBe('C6H10O');
  expect(normalizeFormula('  C6H10O  ')).toBe('C6H10O');
});

test('a developed formula is condensed', () => {
  expect(normalizeFormula('CH3CH2OH')).toBe('C2H6O');
  expect(normalizeFormula('CH3-CH2-OH')).toBe('C2H6O');
});

test('a formula typed in the wrong case is fixed', () => {
  expect(normalizeFormula('c2h5oh')).toBe('C2H6O');
  expect(normalizeFormula('c6h10o')).toBe('C6H10O');
});

test('an empty formula is refused', () => {
  expect(() => normalizeFormula(' '.repeat(3))).toThrow(
    'The molecular formula is empty',
  );
});

test('an element surge does not know is refused', () => {
  expect(() => normalizeFormula('C4H10Fe')).toThrow(
    '"C4H10Fe" is not a formula surge can enumerate',
  );
  expect(() => normalizeFormula('hello')).toThrow(
    '"hello" is not a formula surge can enumerate',
  );
});

test('a charged formula is refused rather than quietly neutralized', () => {
  expect(() => normalizeFormula('C4H10O+')).toThrow(
    '"C4H10O+" is not a formula surge can enumerate',
  );
  expect(() => normalizeFormula('NH4+')).toThrow(
    '"NH4+" is not a formula surge can enumerate',
  );
});

test('the higher valences surge names are let through', () => {
  expect(normalizeFormula('C4H11Nx')).toBe('C4H11Nx');
  expect(normalizeFormula('C2H6Sy')).toBe('C2H6Sy');
});

test('two drawings of one molecule share their constitution idCode', () => {
  const fromSmiles = Molecule.fromSmiles('CCOCC');

  const withHydrogens = Molecule.fromSmiles('CCOCC');
  withHydrogens.addImplicitHydrogens();

  const fromMolfile = Molecule.fromMolfile(fromSmiles.toMolfile());

  const expected = constitutionIDCode(fromSmiles);
  expect(expected).toBe('gJQ@@eKU@@');
  expect(constitutionIDCode(withHydrogens)).toBe(expected);
  expect(constitutionIDCode(fromMolfile)).toBe(expected);
});

test('the two Kekulé structures of benzene are one constitution', () => {
  expect(constitutionIDCode(Molecule.fromSmiles('c1ccccc1'))).toBe(
    constitutionIDCode(Molecule.fromSmiles('C1=CC=CC=C1')),
  );
});

test('the two enantiomers of butan-2-ol are one constitution', () => {
  expect(constitutionIDCode(Molecule.fromSmiles('C[C@H](O)CC'))).toBe(
    constitutionIDCode(Molecule.fromSmiles('C[C@@H](O)CC')),
  );
});

test('computing the idCode leaves the molecule alone', () => {
  const molecule = Molecule.fromSmiles('C[C@H](O)CC');
  const before = molecule.getIDCode();
  constitutionIDCode(molecule);

  expect(molecule.getIDCode()).toBe(before);
});

test('the formula of a molecule comes out canonicalized', () => {
  expect(moleculeFormula(Molecule.fromSmiles('CCOCC'))).toBe('C4H10O');
  expect(moleculeFormula(Molecule.fromSmiles('c1ccccc1'))).toBe('C6H6');
});

test('an idCode is parsed with or without its coordinates', () => {
  const molecule = Molecule.fromSmiles('CCOCC');
  molecule.inventCoordinates();
  const { idCode, coordinates } = molecule.getIDCodeAndCoordinates();

  expect(moleculeFromIDCode(idCode).getAllAtoms()).toBe(5);
  expect(moleculeFromIDCode(`${idCode} ${coordinates}`).getAllAtoms()).toBe(5);
});

test('an empty idCode is refused', () => {
  expect(() => moleculeFromIDCode('  ')).toThrow('The idCode is empty');
});
