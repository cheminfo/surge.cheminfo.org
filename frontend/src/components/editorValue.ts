import { Molecule } from 'openchemlib';

/**
 * How many atoms an editor value holds. Erasing a drawing leaves the editor
 * with an idCode of an empty molecule rather than an empty string, so the
 * atom count is what tells a blank canvas from a structure.
 * @param idCode - Editor value, coordinates included.
 * @returns The atom count, 0 when there is nothing to submit.
 */
export function countAtoms(idCode: string): number {
  if (!idCode.trim()) return 0;
  try {
    const [code, coordinates] = idCode.trim().split(' ');
    if (!code) return 0;
    return Molecule.fromIDCode(code, coordinates).getAllAtoms();
  } catch {
    return 0;
  }
}
