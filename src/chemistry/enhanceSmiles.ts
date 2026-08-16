import { Molecule, SSSearcher } from 'openchemlib';

import { constitutionIDCode, moleculeFromIDCode } from './molecule.ts';

export interface StructureEntry {
  smiles: string;
  /** Only present when the caller asked for it, or when filtering required it. */
  idCode?: string;
}

export interface EnhanceOptions {
  /** How many structures to return. */
  limit: number;
  /** Append the openchemlib idCode of every returned structure. */
  idCode?: boolean;
  /** Keep only structures containing this drawn fragment. */
  fragmentCode?: string;
  /** Never parse more than this many structures, however many were generated. */
  maxParsed?: number;
}

export interface EnhanceResult {
  entries: StructureEntry[];
  /** Distinct structures surge produced. */
  found: number;
  /**
   * How many passed the substructure filter. Absent when the scan stopped at
   * `maxParsed`, because the rest was never examined.
   */
  matched?: number;
}

/** How many structures pass between two reports of how far the scan is. */
const PROGRESS_STEP = 1000;

/**
 * Turn the SMILES surge wrote into the structures the API returns: duplicates
 * removed, optionally filtered by a substructure, optionally identified by
 * their idCode.
 * @param lines - One SMILES per line, as surge wrote them.
 * @param options - What to keep and how much work to do.
 * @param onProgress - Called with how many structures have been examined out
 * of how many there are. Only a scan that parses molecules reports: without a
 * substructure and without an idCode there is nothing to wait for.
 * @returns The structures to return and how many there were.
 */
export function enhanceSmiles(
  lines: string[],
  options: EnhanceOptions,
  onProgress?: (scanned: number, total: number) => void,
): EnhanceResult {
  const { limit, idCode = false, fragmentCode, maxParsed = 50_000 } = options;

  const searcher = fragmentCode ? buildSearcher(fragmentCode) : null;
  const needsMolecule = idCode || searcher !== null;
  const report = needsMolecule ? onProgress : undefined;

  const seenSmiles = new Set<string>();
  const seenIDCodes = new Set<string>();
  const entries: StructureEntry[] = [];
  let parsed = 0;
  let matched = 0;
  let scanned = 0;
  let scanStopped = false;

  for (const line of lines) {
    scanned++;
    if (report !== undefined && scanned % PROGRESS_STEP === 0) {
      report(scanned, lines.length);
    }
    if (seenSmiles.has(line)) continue;
    seenSmiles.add(line);

    // Without a filter every distinct structure matches, and only the ones we
    // return have to be parsed.
    if (!needsMolecule) {
      if (entries.length < limit) entries.push({ smiles: line });
      continue;
    }
    if (searcher === null && entries.length >= limit) continue;
    if (parsed >= maxParsed) {
      scanStopped = true;
      continue;
    }

    let molecule: Molecule;
    try {
      molecule = Molecule.fromSmiles(line);
    } catch {
      continue;
    }
    parsed++;

    if (searcher !== null) {
      searcher.setMolecule(molecule);
      if (!searcher.isFragmentInMolecule()) continue;
    }

    const code = constitutionIDCode(molecule);
    if (seenIDCodes.has(code)) continue;
    seenIDCodes.add(code);
    matched++;

    if (entries.length < limit) {
      entries.push(idCode ? { smiles: line, idCode: code } : { smiles: line });
    }
  }

  report?.(scanned, lines.length);

  const result: EnhanceResult = { entries, found: seenSmiles.size };
  if (searcher === null) {
    result.matched = seenSmiles.size;
  } else if (!scanStopped) {
    result.matched = matched;
  }
  return result;
}

function buildSearcher(fragmentCode: string): SSSearcher {
  const fragment = moleculeFromIDCode(fragmentCode);
  fragment.setFragment(true);
  const searcher = new SSSearcher();
  searcher.setFragment(fragment);
  return searcher;
}
