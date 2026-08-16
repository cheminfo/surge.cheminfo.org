import { MF } from 'mf-parser';

import type { HintCoverage } from './hintCoverage.ts';
import { NO_COVERAGE } from './hintCoverage.ts';

/** A family of structures, and the motifs that say it has been exhausted. */
interface Family {
  name: string;
  motifs: string[];
}

/**
 * Build the ladder of hints for one exercise, vague first. They are derived
 * from the formula itself, so an exercise a teacher adds by URL is as well
 * served as the ones shipped, and from what the student has covered, so a
 * family they have drawn every answer of is not offered to them again.
 * @param mf - Molecular formula of the exercise.
 * @param coverage - What is already exhausted; nothing, by default.
 * @returns Ordered hints, the last one being the most concrete.
 */
export function buildHints(
  mf: string,
  coverage: HintCoverage = NO_COVERAGE,
): string[] {
  const hints: string[] = [];

  let atoms: Record<string, number> = {};
  let unsaturation: number | undefined;
  try {
    const info = new MF(mf).getInfo();
    atoms = info.atoms;
    unsaturation = info.unsaturation;
  } catch {
    // An exotic formula still deserves the general hint below.
  }

  // A half degree of unsaturation means a radical, which is not a molecule the
  // student is being asked to draw, so no counting hint would be true.
  const degrees =
    unsaturation !== undefined && Number.isInteger(unsaturation)
      ? unsaturation
      : undefined;

  if (degrees !== undefined) {
    hints.push(describeUnsaturation(degrees, coverage));
  }
  for (const hint of elementHints(atoms, degrees, coverage)) hints.push(hint);

  if (degrees !== undefined && degrees > 0) {
    if (!coverage.topic('ring') || !coverage.topic('unsaturation')) {
      hints.push(
        'Count the rings and the multiple bonds separately: every combination that adds up to the degree of unsaturation is a family of answers.',
      );
    }
  } else if ((atoms.C ?? 0) >= 4 && !coverage.topic('skeleton')) {
    hints.push(
      'Work through the carbon skeletons from the longest chain down to the most branched one, then place the other atoms on each skeleton.',
    );
  }

  hints.push(
    'Only the connectivity counts. Two structures that differ solely by the shape you drew, or by stereochemistry, are the same answer.',
  );

  // A formula with two halogens would otherwise repeat one hint word for word.
  return [...new Set(hints)];
}

/**
 * What each heteroatom opens up, said only when the formula allows it — a
 * nitrile needs two degrees of unsaturation, an imine one, and an amine none —
 * and only while the student has something left to find there.
 * @param atoms - Atom counts of the formula.
 * @param degrees - Degree of unsaturation, when it is a whole number.
 * @param coverage - What is already exhausted.
 * @returns The hints that apply, in element order.
 */
function elementHints(
  atoms: Record<string, number>,
  degrees: number | undefined,
  coverage: HintCoverage,
): string[] {
  const hints: string[] = [];
  const allows = (needed: number) => degrees === undefined || degrees >= needed;

  if (atoms.O) {
    const families: Family[] = [
      { name: 'alcohols', motifs: ['alcohol'] },
      { name: 'ethers', motifs: ['ether'] },
    ];
    if ((atoms.O ?? 0) >= 2) {
      families.push(
        { name: 'peroxides', motifs: ['peroxide'] },
        { name: 'diols', motifs: ['two-hydroxyl'] },
      );
    }
    if (allows(1)) {
      families.push(
        { name: 'aldehydes', motifs: ['aldehyde'] },
        { name: 'ketones', motifs: ['ketone'] },
        { name: 'enols', motifs: ['enol'] },
      );
    }
    const left = stillOpen(families, coverage);
    if (left.length > 0) hints.push(`With oxygen, look for ${list(left)}.`);
  }

  if (atoms.N) {
    const families: Family[] = [
      {
        name: 'primary, secondary and tertiary amines',
        motifs: ['amine-primary', 'amine-secondary', 'amine-tertiary'],
      },
    ];
    if (allows(1)) families.push({ name: 'imines', motifs: ['imine'] });
    if (allows(2)) families.push({ name: 'nitriles', motifs: ['nitrile'] });
    const left = stillOpen(families, coverage);
    if (left.length > 0) hints.push(`With nitrogen, look for ${list(left)}.`);
  }

  if (atoms.S && !(coverage.motif('thiol') && coverage.motif('thioether'))) {
    hints.push(
      'With sulfur, look for thiols and thioethers, the sulfur analogues of alcohols and ethers.',
    );
  }

  if (
    ['F', 'Cl', 'Br', 'I'].some((halogen) => atoms[halogen]) &&
    !coverage.topic('halogen')
  ) {
    hints.push(
      'A halogen only ever makes one bond, so it is a substituent: the question is which atom carries it.',
    );
  }

  return hints;
}

/**
 * The families the student has not drawn every answer of. A family whose motif
 * the answers never hold stays on the list: the formula allows it, and being
 * told it is not there is the student's own discovery to make.
 * @param families - The families the formula allows.
 * @param coverage - What is already exhausted.
 * @returns Their names, in order.
 */
function stillOpen(families: Family[], coverage: HintCoverage): string[] {
  const names: string[] = [];
  for (const family of families) {
    if (family.motifs.every((motif) => coverage.motif(motif))) continue;
    names.push(family.name);
  }
  return names;
}

function list(items: string[]): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function describeUnsaturation(
  unsaturation: number,
  coverage: HintCoverage,
): string {
  const rings = coverage.topic('ring');
  const multiple = coverage.topic('unsaturation');

  if (unsaturation > 0 && (rings || multiple)) {
    if (rings && multiple) {
      return 'Every ring and every multiple bond of the answers is already drawn: what is left differs only by where the other atoms sit.';
    }
    return rings
      ? 'Every answer that holds a ring is already drawn, so what is left of the unsaturation goes into double and triple bonds.'
      : 'Every answer that holds a multiple bond is already drawn, so what is left of the unsaturation goes into rings.';
  }
  if (unsaturation === 0) {
    return 'The degree of unsaturation is 0: every answer is acyclic and saturated, so only the skeleton changes.';
  }
  if (unsaturation === 1) {
    return 'The degree of unsaturation is 1: each answer holds exactly one ring or one double bond, never both.';
  }
  return `The degree of unsaturation is ${unsaturation}: each answer holds that many rings and multiple bonds together, a triple bond counting for two.`;
}
