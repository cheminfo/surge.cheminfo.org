import { CanvasMoleculeEditor } from 'react-ocl';

interface StructureEditorProps {
  /**
   * Draw a query fragment rather than a molecule, which is what a
   * substructure filter needs.
   * @default false
   */
  fragment?: boolean;
  /**
   * Smallest height of the drawing area, in pixels.
   * @default 320
   */
  minHeight?: number;
  /** Called with the idCode and its coordinates on every edit. */
  onChange: (idCode: string) => void;
}

/**
 * The canvas structure editor, sized to fill its container.
 * @param props - What to draw and where to send it.
 * @returns The editor component.
 */
export default function StructureEditor(props: StructureEditorProps) {
  const { fragment = false, minHeight = 320, onChange } = props;

  // The canvas measures its container in pixels, so it is taken out of the
  // height computation: otherwise the card and the canvas grow each other
  // without ever settling.
  return (
    <div className="structure-editor" style={{ minHeight }}>
      <div className="structure-editor-canvas">
        <CanvasMoleculeEditor
          width="100%"
          height="100%"
          fragment={fragment}
          onChange={(event) => onChange(event.getIdcode())}
        />
      </div>
    </div>
  );
}
