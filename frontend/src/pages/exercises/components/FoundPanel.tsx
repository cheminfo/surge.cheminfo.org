import { Card, H5, NonIdealState, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';

import StructureGrid from '../../../components/StructureGrid.tsx';
import { data, progressOf } from '../../../state/exercises.ts';

/**
 * The structures the student has found so far.
 * @returns The found panel component.
 */
export default function FoundPanel() {
  useSignals();
  const exercise = data.current.value;
  if (!exercise) return null;

  const { found } = progressOf(exercise.mf);

  return (
    <Card>
      <div className="card-header">
        <H5>Your structures</H5>
        <Tag minimal intent={found.length > 0 ? 'success' : 'none'}>
          {found.length} / {exercise.count}
        </Tag>
      </div>
      {found.length === 0 ? (
        <NonIdealState
          icon="draw"
          title="Nothing yet"
          description="Draw an isomer on the left and add it."
        />
      ) : (
        <StructureGrid
          structures={found.map((idCode, index) => ({
            idCode,
            tone: 'found',
            label: String(index + 1),
          }))}
          size={130}
        />
      )}
    </Card>
  );
}
