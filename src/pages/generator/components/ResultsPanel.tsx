import { Card, H5, NonIdealState, Spinner, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useMemo } from 'react';

import type { GridStructure } from '../../../components/StructureGrid.tsx';
import StructureGrid from '../../../components/StructureGrid.tsx';
import { data, view } from '../../../state/generator.ts';

/**
 * Every structure that came back, drawn.
 * @returns The results panel component.
 */
export default function ResultsPanel() {
  useSignals();
  const generated = data.result.value;
  // A formula can hold a hundred thousand isomers, so the cells are built once
  // per result rather than on every render of the page.
  const structures = useMemo<GridStructure[]>(() => {
    const entries = generated?.result;
    if (!entries) return [];
    const cells = new Array<GridStructure>(entries.length);
    for (let index = 0; index < entries.length; index++) {
      cells[index] = {
        smiles: entries[index]?.smiles,
        label: String(index + 1),
      };
    }
    return cells;
  }, [generated]);

  if (view.isGenerating.value) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  const result = generated;
  if (!result) {
    return (
      <Card>
        <NonIdealState
          icon="graph"
          title="No structure yet"
          description="Type a molecular formula and search for its isomers."
        />
      </Card>
    );
  }

  if (result.result.length === 0) {
    return (
      <Card>
        <NonIdealState
          icon="search"
          title="No structure matches"
          description={
            result.found === 0
              ? 'Surge generated nothing for this formula. Check that it is a possible molecule.'
              : 'The restrictions or the substructure filter left nothing. Relax them and try again.'
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="card-header">
        <H5>Isomers</H5>
        <Tag minimal>
          {result.returned} of {result.found}
        </Tag>
      </div>
      <div className="results-scroll">
        <StructureGrid structures={structures} />
      </div>
    </Card>
  );
}
