import { memo } from 'react';
import { IdcodeSvgRenderer, SmilesSvgRenderer } from 'react-ocl';

export interface GridStructure {
  smiles?: string;
  idCode?: string;
  /** Caption under the drawing. */
  label?: string;
  /**
   * How the cell is coloured: `found` green, `missed` pink, `plain` white.
   * @default 'plain'
   */
  tone?: 'plain' | 'found' | 'missed';
}

interface StructureGridProps {
  structures: GridStructure[];
  /**
   * Width of one drawing, in pixels.
   * @default 150
   */
  size?: number;
}

/**
 * A wrapping grid of structure drawings.
 * @param props - What to draw and how big.
 * @returns The grid component.
 */
export default function StructureGrid(props: StructureGridProps) {
  const { structures, size = 150 } = props;
  return (
    <div
      className="structure-grid"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, 1fr))`,
      }}
    >
      {structures.map((structure) => (
        // Every list handed to the grid is deduplicated, so the structure
        // itself identifies the cell.
        <StructureCell
          key={structure.idCode ?? structure.smiles}
          structure={structure}
          size={size}
        />
      ))}
    </div>
  );
}

const StructureCell = memo(function StructureCell(props: {
  structure: GridStructure;
  size: number;
}) {
  const { structure, size } = props;
  return (
    <figure
      className={`structure-cell structure-cell--${structure.tone ?? 'plain'}`}
    >
      {structure.idCode ? (
        <IdcodeSvgRenderer idcode={structure.idCode} width={size} autoCrop />
      ) : (
        <SmilesSvgRenderer
          smiles={structure.smiles ?? ''}
          width={size}
          autoCrop
        />
      )}
      {structure.label ? <figcaption>{structure.label}</figcaption> : null}
    </figure>
  );
});
