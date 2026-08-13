import { MF } from 'mf-parser';

/**
 * Build the ladder of hints for one exercise, vague first. They are derived
 * from the formula itself, so an exercise a teacher adds by URL is as well
 * served as the ones shipped.
 * @param mf - Molecular formula of the exercise.
 * @returns Ordered hints, the last one being the most concrete.
 */
export function buildHints(mf: string): string[] {
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

  if (degrees !== undefined) hints.push(describeUnsaturation(degrees));
  for (const hint of elementHints(atoms, degrees)) hints.push(hint);

  if (degrees !== undefined && degrees > 0) {
    hints.push(
      'Count the rings and the multiple bonds separately: every combination that adds up to the degree of unsaturation is a family of answers.',
    );
  } else if ((atoms.C ?? 0) >= 4) {
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
 * What each heteroatom opens up, said only when the formula allows it: a
 * nitrile needs two degrees of unsaturation, an imine one, and an amine none.
 * @param atoms - Atom counts of the formula.
 * @param degrees - Degree of unsaturation, when it is a whole number.
 * @returns The hints that apply, in element order.
 */
function elementHints(
  atoms: Record<string, number>,
  degrees: number | undefined,
): string[] {
  const hints: string[] = [];
  const allows = (needed: number) => degrees === undefined || degrees >= needed;

  if (atoms.O) {
    const families = ['alcohols', 'ethers'];
    if ((atoms.O ?? 0) >= 2) families.push('peroxides', 'diols');
    if (allows(1)) families.push('aldehydes', 'ketones', 'enols');
    hints.push(`With oxygen, look for ${list(families)}.`);
  }

  if (atoms.N) {
    const families = ['primary, secondary and tertiary amines'];
    if (allows(1)) families.push('imines');
    if (allows(2)) families.push('nitriles');
    hints.push(`With nitrogen, look for ${list(families)}.`);
  }

  if (atoms.S) {
    hints.push(
      'With sulfur, look for thiols and thioethers, the sulfur analogues of alcohols and ethers.',
    );
  }

  if (['F', 'Cl', 'Br', 'I'].some((halogen) => atoms[halogen])) {
    hints.push(
      'A halogen only ever makes one bond, so it is a substituent: the question is which atom carries it.',
    );
  }

  return hints;
}

function list(items: string[]): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function describeUnsaturation(unsaturation: number): string {
  if (unsaturation === 0) {
    return 'The degree of unsaturation is 0: every answer is acyclic and saturated, so only the skeleton changes.';
  }
  if (unsaturation === 1) {
    return 'The degree of unsaturation is 1: each answer holds exactly one ring or one double bond, never both.';
  }
  return `The degree of unsaturation is ${unsaturation}: each answer holds that many rings and multiple bonds together, a triple bond counting for two.`;
}
