import { MF } from 'mf-parser';
import { Molecule } from 'openchemlib';

/** A structure as the editor hands it over: an idCode and where the atoms sit. */
export interface EditorValue {
  idCode: string;
  /** Absent when the value carried no coordinates. */
  coordinates?: string;
}

/**
 * Take an editor value apart. Editors append the atom coordinates after a
 * space, which `Molecule.fromIDCode` does not expect and which two drawings of
 * the same structure differ by.
 * @param value - Editor value, coordinates included or not.
 * @returns The idCode and the coordinates, the idCode empty for a blank value.
 */
export function splitEditorValue(value: string): EditorValue {
  const [idCode, coordinates] = value.trim().split(' ');
  return coordinates === undefined
    ? { idCode: idCode ?? '' }
    : { idCode: idCode ?? '', coordinates };
}

/**
 * How many atoms an editor value holds. Erasing a drawing leaves the editor
 * with an idCode of an empty molecule rather than an empty string, so the
 * atom count is what tells a blank canvas from a structure.
 * @param idCode - Editor value, coordinates included.
 * @returns The atom count, 0 when there is nothing to submit.
 */
export function countAtoms(idCode: string): number {
  const molecule = parse(idCode);
  return molecule === null ? 0 : molecule.getAllAtoms();
}

/**
 * The molecular formula of what is on the canvas, hydrogens included.
 * @param idCode - Editor value, coordinates included.
 * @returns The formula, empty when the canvas holds nothing.
 */
export function drawnFormula(idCode: string): string {
  const molecule = parse(idCode);
  if (molecule === null || molecule.getAllAtoms() === 0) return '';
  return molecule.getMolecularFormula().formula;
}

/**
 * Whether the canvas holds the formula being worked on. Comparing the atom
 * counts rather than the strings, because the two formulas are written by
 * different code.
 * @param idCode - Editor value, coordinates included.
 * @param mf - Formula of the exercise.
 * @returns Whether the two hold the same atoms.
 */
export function isFormula(idCode: string, mf: string): boolean {
  const drawn = drawnFormula(idCode);
  if (!drawn) return false;
  const counts = atomCounts(drawn);
  const wanted = atomCounts(mf);
  const elements = Object.keys(wanted);
  if (elements.length !== Object.keys(counts).length) return false;
  for (const element of elements) {
    if (counts[element] !== wanted[element]) return false;
  }
  return true;
}

function atomCounts(mf: string): Record<string, number> {
  try {
    return new MF(mf).getInfo().atoms;
  } catch {
    return {};
  }
}

function parse(idCode: string): Molecule | null {
  const { idCode: code, coordinates } = splitEditorValue(idCode);
  if (!code) return null;
  try {
    return Molecule.fromIDCode(code, coordinates);
  } catch {
    return null;
  }
}
