/** The width under which the page is one column, from `index.css`. */
const STACKED = '(max-width: 1100px)';

let anchor: HTMLElement | null = null;

/**
 * Bring the canvas into view, as long as the page is one column: the whole
 * list is shown there, so the exercise that was tapped sits a screen or more
 * above the place to answer it.
 */
export function revealDrawing(): void {
  if (!globalThis.matchMedia(STACKED).matches) return;
  anchor?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/**
 * Remember where the drawing panel is, so the list can reveal it.
 * @param element - The element holding the panel, null once it is gone.
 */
export function setDrawingAnchor(element: HTMLElement | null): void {
  anchor = element;
}
