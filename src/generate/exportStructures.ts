import { Molecule } from 'openchemlib';
import { create } from 'sdf-creator';

import type { StructureEntry } from '../chemistry/enhanceSmiles.ts';

export type ExportFormat = 'smiles' | 'idcode' | 'sdf';

/** Digits the molecular weight is written with. */
const MW_DECIMALS = 2;

/**
 * How many structures go into one chunk. A record of an SDF is a whole
 * molfile, so its chunks hold far fewer of them: what is kept small is the
 * piece of text being passed around, not the number of structures in it.
 */
const CHUNK_SIZE: Record<ExportFormat, number> = {
  // Nothing is read: the lines are the ones surge wrote.
  smiles: 20_000,
  // A molecule parsed each, so a chunk is about a second of work — which is
  // how often the wait is worth saying something about.
  idcode: 2000,
  sdf: 200,
};

export interface ExportChunk {
  text: string;
  /** How many structures the chunk actually wrote. */
  records: number;
}

/**
 * Write the structures in one of the export formats, a chunk at a time.
 *
 * Everything but the SMILES makes openchemlib read every structure — and an
 * SDF invents coordinates for each of them — so a large result takes minutes
 * and its document never fits in one string. Neither is done here: the caller
 * is handed the pieces as they are written and decides where they go.
 * @param entries - The structures as the search returned them.
 * @param format - Which document to write.
 * @param onChunk - Called with each piece and with how many structures had
 * been read when it was written.
 * @returns How many records the document holds.
 */
export function writeExport(
  entries: readonly StructureEntry[],
  format: ExportFormat,
  onChunk: (text: string, done: number) => void,
): number {
  const size = CHUNK_SIZE[format];
  let records = 0;
  for (let start = 0; start < entries.length; start += size) {
    const end = Math.min(start + size, entries.length);
    const chunk = exportRange(entries, start, end, format);
    records += chunk.records;
    onChunk(chunk.text, end);
  }
  return records;
}

/**
 * One piece of the document: the structures of a range, written whole.
 * @param entries - The structures as the search returned them.
 * @param start - First structure of the range.
 * @param end - Structure the range stops before.
 * @param format - Which document is being written.
 * @returns The text of that range, and how many records it holds.
 */
export function exportRange(
  entries: readonly StructureEntry[],
  start: number,
  end: number,
  format: ExportFormat,
): ExportChunk {
  if (format === 'sdf') return sdfRange(entries, start, end);

  const lines: string[] = [];
  for (let index = start; index < end; index++) {
    const entry = entries[index];
    if (entry === undefined) continue;
    if (format === 'smiles') {
      lines.push(entry.smiles);
      continue;
    }
    const code = idCodeOf(entry);
    if (code) lines.push(code);
  }
  if (lines.length === 0) return { text: '', records: 0 };
  return { text: `${lines.join('\n')}\n`, records: lines.length };
}

/**
 * The whole document in one string, for a preview or for a result small
 * enough to hold. Use `writeExport` for anything a visitor asked to export.
 * @param entries - The structures as the search returned them.
 * @param format - Which document to write.
 * @returns The document.
 */
export function exportText(
  entries: readonly StructureEntry[],
  format: ExportFormat,
): string {
  return exportRange(entries, 0, entries.length, format).text;
}

function sdfRange(
  entries: readonly StructureEntry[],
  start: number,
  end: number,
): ExportChunk {
  const molecules: Array<Record<string, string>> = [];
  for (let index = start; index < end; index++) {
    const entry = entries[index];
    if (entry !== undefined) molecules.push(sdfRecord(entry));
  }
  if (molecules.length === 0) return { text: '', records: 0 };
  return { text: `${create(molecules).sdf}\n`, records: molecules.length };
}

function sdfRecord(entry: StructureEntry): Record<string, string> {
  const molecule = entry.idCode
    ? Molecule.fromIDCode(entry.idCode)
    : Molecule.fromSmiles(entry.smiles);
  const idCode = entry.idCode ?? molecule.getIDCode();
  // Surge gives a connection table; a molfile needs somewhere to draw it.
  molecule.inventCoordinates();
  molecule.setName(entry.smiles);
  const formula = molecule.getMolecularFormula();
  return {
    molfile: molecule.toMolfile(),
    SMILES: entry.smiles,
    ID_CODE: idCode,
    MF: formula.formula,
    MW: formula.relativeWeight.toFixed(MW_DECIMALS),
  };
}

/**
 * The canonical identity of a structure. The search only computes one when it
 * was asked to, and computing thousands of them is what makes it slow, so it
 * is read off the SMILES itself when it has to be.
 */
function idCodeOf(entry: StructureEntry): string {
  if (entry.idCode) return entry.idCode;
  try {
    return Molecule.fromSmiles(entry.smiles).getIDCode();
  } catch {
    return '';
  }
}
