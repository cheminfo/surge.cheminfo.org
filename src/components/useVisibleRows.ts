import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

export interface VisibleRowsOptions {
  /** How many cells the grid holds. */
  count: number;
  /** Smallest width of a cell, which is what decides how many fit on a row. */
  cellWidth: number;
  /** Height of a cell; every row is exactly that tall. */
  cellHeight: number;
  /** Space between two cells, horizontally and vertically. */
  gap: number;
  /**
   * Rows kept on either side of what is on screen.
   * @default 3
   */
  overscan?: number;
}

export interface VisibleRows {
  /** Cells per row, read off the width the grid was given. */
  columns: number;
  rowCount: number;
  firstRow: number;
  /** One past the last row worth drawing. */
  endRow: number;
}

/**
 * Which rows of a grid of fixed-size cells are on screen.
 *
 * The answer is read off the grid's place in the viewport rather than off a
 * scroll position, because the same grid scrolls in a box of its own on a wide
 * window and with the whole page on a narrow one — and a drawing costs a
 * molecule parsed and an SVG laid out, so a formula with thousands of isomers
 * is only ever drawn a screenful at a time.
 * @param ref - The grid element.
 * @param options - What the grid holds and how big a cell is.
 * @returns The rows to render, and how many there are in total.
 */
export function useVisibleRows(
  ref: RefObject<HTMLElement | null>,
  options: VisibleRowsOptions,
): VisibleRows {
  const { count, cellWidth, cellHeight, gap, overscan = 3 } = options;
  const [rows, setRows] = useState<VisibleRows>(() => ({
    columns: 1,
    rowCount: count,
    firstRow: 0,
    endRow: 0,
  }));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let clippers = clippingAncestors(element);
    let previous: VisibleRows | null = null;

    function measure(): void {
      if (!element) return;
      const next = computeRows(element, clippers, {
        count,
        cellWidth,
        cellHeight,
        gap,
        overscan,
      });
      if (previous && sameRows(previous, next)) return;
      previous = next;
      setRows(next);
    }

    function remeasure(): void {
      if (!element) return;
      clippers = clippingAncestors(element);
      measure();
    }

    // Drawing fewer rows changes the grid's own height, which the observer
    // would report straight back: only a new width, which is a new number of
    // columns, is worth measuring again.
    let lastWidth = -1;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width === lastWidth) return;
      lastWidth = width;
      measure();
    });
    observer.observe(element);
    // A scroll anywhere between the grid and the page moves it under the
    // viewport, and a scroll event does not bubble: it is caught on the way in.
    globalThis.addEventListener('scroll', measure, {
      capture: true,
      passive: true,
    });
    globalThis.addEventListener('resize', remeasure, { passive: true });
    return () => {
      observer.disconnect();
      globalThis.removeEventListener('scroll', measure, { capture: true });
      globalThis.removeEventListener('resize', remeasure);
    };
  }, [ref, count, cellWidth, cellHeight, gap, overscan]);

  return rows;
}

function computeRows(
  element: HTMLElement,
  clippers: HTMLElement[],
  options: Required<VisibleRowsOptions>,
): VisibleRows {
  const { count, cellWidth, cellHeight, gap, overscan } = options;
  const rect = element.getBoundingClientRect();
  const columns = Math.max(
    1,
    Math.floor((rect.width + gap) / (cellWidth + gap)),
  );
  const rowCount = Math.ceil(count / columns);
  const rowHeight = cellHeight + gap;

  let top = 0;
  let bottom = globalThis.innerHeight;
  for (const clipper of clippers) {
    const box = clipper.getBoundingClientRect();
    if (box.top > top) top = box.top;
    if (box.bottom < bottom) bottom = box.bottom;
  }

  const firstRow = clamp(
    Math.floor((top - rect.top) / rowHeight) - overscan,
    0,
    rowCount,
  );
  const endRow = clamp(
    Math.ceil((bottom - rect.top) / rowHeight) + overscan,
    firstRow,
    rowCount,
  );
  return { columns, rowCount, firstRow, endRow };
}

/** The ancestors that cut the grid off, so what they hide is not drawn. */
function clippingAncestors(element: HTMLElement): HTMLElement[] {
  const clippers: HTMLElement[] = [];
  for (
    let parent = element.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    const { overflowY } = globalThis.getComputedStyle(parent);
    if (overflowY !== 'visible') clippers.push(parent);
  }
  return clippers;
}

function sameRows(a: VisibleRows, b: VisibleRows): boolean {
  return (
    a.columns === b.columns &&
    a.rowCount === b.rowCount &&
    a.firstRow === b.firstRow &&
    a.endRow === b.endRow
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
