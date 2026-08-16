export interface RowBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * The gap a pointer is over — the place between two rows a dragged formula
 * would land in, counted from the left: gap 0 is before the first row, gap
 * `length` after the last. The row nearest the pointer decides, and the half
 * of it the pointer is on says which of its two sides.
 *
 * The boxes are the ones measured when the drag started, never live ones: the
 * rows step aside to open the slot, and reading their moved position back
 * would let that answer decide the next one.
 * @param boxes - Where the rows were when the drag started.
 * @param x - Pointer, in the same coordinates.
 * @param y - Pointer, in the same coordinates.
 * @returns The gap, or nothing when there are no rows.
 */
export function gapAt(
  boxes: readonly RowBox[],
  x: number,
  y: number,
): number | null {
  let nearest = -1;
  let nearestLine = Number.POSITIVE_INFINITY;
  let nearestRow = Number.POSITIVE_INFINITY;
  for (let index = 0; index < boxes.length; index++) {
    const box = boxes[index] as RowBox;
    const dx = distance(x, box.left, box.right);
    const dy = distance(y, box.top, box.bottom);
    // The line decides before the column does: a pointer past the last row of
    // a line belongs to that line, however far to the right it has gone.
    if (dy < nearestLine || (dy === nearestLine && dx < nearestRow)) {
      nearestLine = dy;
      nearestRow = dx;
      nearest = index;
    }
  }
  if (nearest === -1) return null;

  const box = boxes[nearest] as RowBox;
  return x > (box.left + box.right) / 2 ? nearest + 1 : nearest;
}

function distance(value: number, low: number, high: number): number {
  if (value < low) return low - value;
  if (value > high) return value - high;
  return 0;
}
