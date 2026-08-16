import type { ExportFormat, StructureEntry } from '../../api/surge.ts';
import { exportRange } from '../../api/surge.ts';

/** How many structures the preview is built from, whatever it then shows. */
const PREVIEW_RECORDS = 60;

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

export interface ExportPreview {
  /** The first lines of the document. */
  text: string;
  /** Whether anything was left out of them. */
  truncated: boolean;
  /**
   * What the whole document would weigh, in bytes, read off the head that was
   * actually written rather than guessed from the format.
   */
  size: number;
}

/**
 * The head of the document, written from the first structures alone: a
 * preview of a million of them must cost no more than a preview of ten.
 * @param entries - The structures the search returned.
 * @param format - Which document is being written.
 * @param lines - How many lines to show.
 * @returns The first lines, whether anything was left out, and what the whole
 * document would weigh.
 */
export function exportPreview(
  entries: readonly StructureEntry[],
  format: ExportFormat,
  lines: number,
): ExportPreview {
  const head = Math.min(entries.length, PREVIEW_RECORDS);
  const written = exportRange(entries, 0, head, format);
  const preview = previewOf(written.text, lines);
  return {
    text: preview.text,
    truncated: preview.truncated || head < entries.length,
    size:
      written.records === 0
        ? 0
        : Math.round((written.text.length / written.records) * entries.length),
  };
}

/**
 * The head of a document, so a preview stays cheap.
 * @param text - The document, or as much of it as was written.
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
