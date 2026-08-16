import type { ExerciseSummary } from '../../api/surge.ts';

/**
 * The exercises in the order the link hands them out: what the teacher arranged
 * first, then everything they never moved, in the order it was loaded. A
 * formula the arrangement names but the set no longer holds is dropped, so an
 * arrangement made before a set was reloaded still reads.
 * @param candidates - The exercises known, in the order they were loaded.
 * @param order - The formulas the teacher arranged, or nothing.
 * @returns The exercises to show, in order.
 */
export function arrangeExercises(
  candidates: readonly ExerciseSummary[],
  order: readonly string[],
): ExerciseSummary[] {
  if (order.length === 0) return [...candidates];

  const remaining = new Map(
    candidates.map((exercise) => [exercise.mf, exercise]),
  );
  const arranged: ExerciseSummary[] = [];
  for (const mf of order) {
    const exercise = remaining.get(mf);
    if (exercise) {
      arranged.push(exercise);
      remaining.delete(mf);
    }
  }
  // A Map hands its entries back in insertion order, so what was never moved
  // keeps the order it was loaded in.
  arranged.push(...remaining.values());
  return arranged;
}

/**
 * The same formulas with one of them dropped in a gap — the place between two
 * rows the picker draws while a formula is being dragged, counted from the
 * left: gap 0 is before the first formula, gap `length` after the last.
 * @param formulas - The order to change.
 * @param from - Index of the formula being moved.
 * @param gap - Gap it is dropped in.
 * @returns The new order.
 */
export function dropFormula(
  formulas: readonly string[],
  from: number,
  gap: number,
): string[] {
  // The formula is taken out of the list before it goes back in, so every gap
  // after it has slid by one.
  return moveFormula(formulas, from, gap > from ? gap - 1 : gap);
}

/**
 * The same formulas with one of them moved.
 * @param formulas - The order to change.
 * @param from - Index of the formula being moved.
 * @param to - Index it lands on, clamped to the list.
 * @returns The new order, the given one when nothing moves.
 */
export function moveFormula(
  formulas: readonly string[],
  from: number,
  to: number,
): string[] {
  const target = Math.min(Math.max(to, 0), formulas.length - 1);
  if (from === target || from < 0 || from >= formulas.length) {
    return [...formulas];
  }
  const moved = [...formulas];
  const [formula] = moved.splice(from, 1);
  moved.splice(target, 0, formula as string);
  return moved;
}
