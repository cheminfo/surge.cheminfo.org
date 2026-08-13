import { MF, ensureCase } from 'mf-parser';
import { CanonizerUtil, Molecule } from 'openchemlib';

/**
 * What surge knows: the elements at their lowest valence, plus the four names
 * it gives to a higher one.
 */
const SURGE_ELEMENTS = new Set([
  'C',
  'B',
  'N',
  'P',
  'O',
  'S',
  'H',
  'Cl',
  'F',
  'Br',
  'I',
  'Nx',
  'Sx',
  'Sy',
  'Px',
]);

/**
 * Canonicalize a molecular formula the way surge wants it, so the same formula
 * typed in three ways reaches surge as one string. A developed formula is
 * condensed, and a formula typed in the wrong case is fixed.
 * @param mf - Molecular formula as the caller typed it.
 * @returns The canonical formula, without charge or separator characters.
 */
export function normalizeFormula(mf: string): string {
  const text = mf.trim();
  if (!text) throw new Error('The molecular formula is empty');

  for (const candidate of [text, ensureCase(text)]) {
    const condensed = condense(candidate);
    if (condensed !== undefined && isSurgeFormula(condensed)) return condensed;
  }
  // Nx, Sx, Sy and Px are surge's own names for a higher valence, and no
  // formula parser knows them.
  if (isSurgeFormula(text)) return text;

  throw new Error(`"${text}" is not a formula surge can enumerate`);
}

function condense(mf: string): string | undefined {
  try {
    const info = new MF(mf).getInfo();
    // Surge only builds neutral molecules, and dropping the sign would quietly
    // enumerate a different species than the one that was asked for.
    if (info.charge !== 0) return undefined;
    return info.mf.replaceAll(/[^A-Za-z\d]/g, '');
  } catch {
    return undefined;
  }
}

function isSurgeFormula(mf: string): boolean {
  const tokens = /^(?:[A-Z][a-z]?\d*)+$/.test(mf)
    ? mf.match(/[A-Z][a-z]?/g)
    : null;
  if (tokens === null) return false;
  for (const element of tokens) {
    if (!SURGE_ELEMENTS.has(element)) return false;
  }
  return true;
}

/**
 * The identifier two structures share when they are the same constitutional
 * isomer. Stereochemistry is dropped because surge does not generate it, and
 * explicit hydrogens are dropped because a student may or may not draw them.
 * @param molecule - Molecule to identify. It is not modified.
 * @returns The canonical stereo-free idCode.
 */
export function constitutionIDCode(molecule: Molecule): string {
  const copy = molecule.getCompactCopy();
  copy.removeExplicitHydrogens(false);
  return CanonizerUtil.getIDCode(copy, CanonizerUtil.NOSTEREO);
}

/**
 * Molecular formula of a molecule, canonicalized like {@link normalizeFormula}
 * so it can be compared to a formula a caller typed.
 * @param molecule - Molecule to weigh.
 * @returns The canonical formula.
 */
export function moleculeFormula(molecule: Molecule): string {
  return normalizeFormula(molecule.getMolecularFormula().formula);
}

/**
 * Parse the idCode a structure editor produced. Editors append the atom
 * coordinates after a space, which `Molecule.fromIDCode` does not expect.
 * @param idCode - Value read from the editor, coordinates included or not.
 * @returns The parsed molecule.
 */
export function moleculeFromIDCode(idCode: string): Molecule {
  const [code, coordinates] = idCode.trim().split(' ');
  if (!code) throw new Error('The idCode is empty');
  return coordinates === undefined
    ? Molecule.fromIDCode(code)
    : Molecule.fromIDCode(code, coordinates);
}
