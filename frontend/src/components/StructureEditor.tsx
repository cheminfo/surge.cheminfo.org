import { useLayoutEffect, useRef, useState } from 'react';
import { CanvasMoleculeEditor } from 'react-ocl';

/** The two 1px borders of the container, which sizes itself border-box. */
const BORDERS = 2;

interface StructureEditorProps {
  /**
   * Draw a query fragment rather than a molecule, which is what a
   * substructure filter needs.
   * @default false
   */
  fragment?: boolean;
  /**
   * What the canvas holds when it appears. Read once, at mount: the editor is
   * uncontrolled, so a later value never replaces what is being drawn.
   * @default ''
   */
  initialIdCode?: string;
  /**
   * Smallest height of the drawing area, in pixels. Raised to whatever the
   * toolbar needs, which is usually more.
   * @default 320
   */
  minHeight?: number;
  /** Called with the idCode and its coordinates on every edit. */
  onChange: (idCode: string) => void;
}

/**
 * The canvas structure editor, sized to fill its container and never to hide
 * part of its toolbar.
 * @param props - What to draw and where to send it.
 * @returns The editor component.
 */
export default function StructureEditor(props: StructureEditorProps) {
  const {
    fragment = false,
    initialIdCode = '',
    minHeight = 320,
    onChange,
  } = props;
  const [inputValue] = useState(initialIdCode);
  const containerRef = useRef<HTMLDivElement>(null);

  useToolbarFloor(containerRef, minHeight);

  // The canvas measures its container in pixels, so it is taken out of the
  // height computation: otherwise the card and the canvas grow each other
  // without ever settling.
  return (
    <div ref={containerRef} className="structure-editor">
      <div className="structure-editor-canvas">
        <CanvasMoleculeEditor
          width="100%"
          height="100%"
          fragment={fragment}
          inputValue={inputValue}
          onChange={(event) => onChange(event.getIdcode())}
        />
      </div>
    </div>
  );
}

/**
 * Give the container a minimum height that shows the whole toolbar.
 *
 * The toolbar is a canvas of a fixed height, drawn from a sprite of a fixed
 * number of buttons: a container any shorter than that does not scroll, it
 * simply cuts the last buttons off. Measure the toolbar rather than write its
 * height down, so a different button count keeps working, and keep watching it,
 * so a toolbar with no layout yet is picked up as soon as it gets one.
 * @param containerRef - The element wrapping the editor.
 * @param minHeight - What the caller asked for, used when it is the larger.
 */
function useToolbarFloor(
  containerRef: React.RefObject<HTMLDivElement | null>,
  minHeight: number,
): void {
  useLayoutEffect(() => {
    const container = containerRef.current;
    const toolbar = container && findToolbar(container);
    if (!container || !toolbar) return;
    const observer = new ResizeObserver(() => {
      // offsetHeight, because a dialog opens under a scaling transform and a
      // measured rectangle would be that of the half drawn toolbar.
      const floor = toolbar.offsetHeight + BORDERS;
      container.style.minHeight = `${Math.max(minHeight, floor)}px`;
    });
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, [containerRef, minHeight]);
}

/**
 * Find the toolbar canvas of the editor.
 *
 * The editor builds itself inside a shadow root and puts the toolbar there as
 * a direct child, the drawing canvas being nested deeper.
 * @param container - The element wrapping the editor.
 * @returns The toolbar canvas, or null while the editor has not drawn one.
 */
function findToolbar(container: HTMLElement): HTMLCanvasElement | null {
  for (const element of container.querySelectorAll('*')) {
    for (const child of element.shadowRoot?.children ?? []) {
      if (child instanceof HTMLCanvasElement) return child;
    }
  }
  return null;
}
