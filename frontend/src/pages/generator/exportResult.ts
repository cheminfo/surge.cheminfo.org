import { Molecule } from 'openchemlib';
import { create } from 'sdf-creator';

import type { StructureEntry } from '../../api/surge.ts';

export type ExportFormat = 'smiles' | 'idcode' | 'sdf';

/** Digits the molecular weight is written with. */
const MW_DECIMALS = 2;

export interface ExportFormatDescriptor {
  id: ExportFormat;
  /** How the tab names it. */
  label: string;
  /** What the downloaded file is called, after the name. */
  extension: string;
  /** What the browser is told it is downloading. */
  mediaType: string;
  /** One line under the tab, so a format is picked knowing what it holds. */
  description: string;
}

export const EXPORT_FORMATS: readonly ExportFormatDescriptor[] = [
  {
    id: 'smiles',
    label: 'SMILES',
    extension: 'smi',
    mediaType: 'text/plain',
    description: 'One SMILES per line, as surge wrote them.',
  },
  {
    id: 'idcode',
    label: 'idCodes',
    extension: 'txt',
    mediaType: 'text/plain',
    description:
      'One openchemlib idCode per line — the canonical identity of a constitution.',
  },
  {
    id: 'sdf',
    label: 'SDF',
    extension: 'sdf',
    mediaType: 'chemical/x-mdl-sdfile',
    description:
      'A molfile per structure with invented coordinates, carrying the SMILES, the idCode, the formula and the molecular weight as fields.',
  },
];

/**
 * The results in one of the formats the export dialog offers.
 * @param entries - The structures as the service returned them.
 * @param format - Which format to write.
 * @returns The whole document, ready to be copied or downloaded.
 */
export function exportText(
  entries: readonly StructureEntry[],
  format: ExportFormat,
): string {
  if (format === 'sdf') return sdf(entries);
  const lines =
    format === 'smiles' ? smilesLines(entries) : idCodeLines(entries);
  return lines.length === 0 ? '' : `${lines.join('\n')}\n`;
}

/**
 * How many structures a format actually carries: an idCode is only there when
 * the search was run with the option on.
 * @param entries - The structures as the service returned them.
 * @param format - Which format to write.
 * @returns The number of records the export holds.
 */
export function exportCount(
  entries: readonly StructureEntry[],
  format: ExportFormat,
): number {
  if (format === 'idcode') return idCodeLines(entries).length;
  return entries.length;
}

/**
 * The name the download is offered under.
 * @param name - What the dialog holds, without an extension.
 * @param format - Which format is being written.
 * @returns The file name.
 */
export function exportFileName(name: string, format: ExportFormat): string {
  const descriptor = formatDescriptor(format);
  const base = name.trim() || 'surge';
  return `${base}.${descriptor.extension}`;
}

/**
 * The descriptor of a format.
 * @param format - The format to look up.
 * @returns Its label, extension, media type and description.
 */
export function formatDescriptor(format: ExportFormat): ExportFormatDescriptor {
  const descriptor = EXPORT_FORMATS.find((entry) => entry.id === format);
  if (!descriptor) throw new Error(`unknown export format "${format}"`);
  return descriptor;
}

/**
 * The head of a document, so a preview of a thousand structures stays cheap.
 * @param text - The whole document.
 * @param lines - How many lines to keep.
 * @returns The first lines, and whether anything was left out.
 */
export function previewOf(
  text: string,
  lines: number,
): { text: string; truncated: boolean } {
  const kept: string[] = [];
  let start = 0;
  while (kept.length < lines && start < text.length) {
    const end = text.indexOf('\n', start);
    if (end === -1) {
      kept.push(text.slice(start));
      start = text.length;
      break;
    }
    kept.push(text.slice(start, end));
    start = end + 1;
  }
  return { text: kept.join('\n'), truncated: start < text.length };
}

function smilesLines(entries: readonly StructureEntry[]): string[] {
  const lines: string[] = [];
  for (const entry of entries) lines.push(entry.smiles);
  return lines;
}

function idCodeLines(entries: readonly StructureEntry[]): string[] {
  const lines: string[] = [];
  for (const entry of entries) {
    if (entry.idCode) lines.push(entry.idCode);
  }
  return lines;
}

function sdf(entries: readonly StructureEntry[]): string {
  const molecules: Array<Record<string, string>> = [];
  for (const entry of entries) molecules.push(sdfRecord(entry));
  if (molecules.length === 0) return '';
  return `${create(molecules).sdf}\n`;
}

function sdfRecord(entry: StructureEntry): Record<string, string> {
  const molecule = entry.idCode
    ? Molecule.fromIDCode(entry.idCode)
    : Molecule.fromSmiles(entry.smiles);
  // Surge gives a connection table; a molfile needs somewhere to draw it.
  molecule.inventCoordinates();
  molecule.setName(entry.smiles);
  const formula = molecule.getMolecularFormula();
  return {
    molfile: molecule.toMolfile(),
    SMILES: entry.smiles,
    ...(entry.idCode ? { ID_CODE: entry.idCode } : {}),
    MF: formula.formula,
    MW: formula.relativeWeight.toFixed(MW_DECIMALS),
  };
}
