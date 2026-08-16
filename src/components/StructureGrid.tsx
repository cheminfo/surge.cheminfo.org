import { memo, useRef } from 'react';
import { IdcodeSvgRenderer, SmilesSvgRenderer } from 'react-ocl';

import { useVisibleRows } from './useVisibleRows.ts';

export interface GridStructure {
  smiles?: string;
  idCode?: string;
  /** Where the atoms were put, when the drawing is to be kept as it was. */
  coordinates?: string;
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

/** Space between two cells. */
const GAP = 8;
/** What a cell costs beyond its drawing: the caption, the padding, the border. */
const CAPTION_HEIGHT = 14;
const FRAME_HEIGHT = 10;

/**
 * A wrapping grid of structure drawings. Every cell is the same size, and only
 * the rows on screen are drawn, so a formula with thousands of isomers costs
 * the browser a screenful of molecules rather than all of them.
 * @param props - What to draw and how big.
 * @returns The grid component.
 */
export default function StructureGrid(props: StructureGridProps) {
  const { structures, size = 150 } = props;
  const gridRef = useRef<HTMLDivElement>(null);
  const cellHeight =
    size +
    FRAME_HEIGHT +
    (structures[0]?.label === undefined ? 0 : CAPTION_HEIGHT);
  const { columns, rowCount, firstRow, endRow } = useVisibleRows(gridRef, {
    count: structures.length,
    cellWidth: size,
    cellHeight,
    gap: GAP,
  });

  const rowHeight = cellHeight + GAP;
  return (
    <div
      ref={gridRef}
      className="structure-grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: `${cellHeight}px`,
        gap: `${GAP}px`,
        // The rows that are not drawn are still there to scroll through.
        paddingTop: firstRow * rowHeight,
        paddingBottom: (rowCount - endRow) * rowHeight,
      }}
    >
      {structures
        .slice(firstRow * columns, endRow * columns)
        .map((structure) => (
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
      <div className="structure-cell-drawing">
        {structure.idCode ? (
          <IdcodeSvgRenderer
            idcode={structure.idCode}
            coordinates={structure.coordinates}
            width={size}
            height={size}
            autoCrop
          />
        ) : (
          <SmilesSvgRenderer
            smiles={structure.smiles ?? ''}
            width={size}
            height={size}
            autoCrop
          />
        )}
      </div>
      {structure.label ? <figcaption>{structure.label}</figcaption> : null}
    </figure>
  );
});
