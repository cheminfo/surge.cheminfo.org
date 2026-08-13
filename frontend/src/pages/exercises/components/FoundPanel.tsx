import { Card, H5, NonIdealState, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';

import StructureGrid from '../../../components/StructureGrid.tsx';
import { splitEditorValue } from '../../../components/editorValue.ts';
import { data, drawingOf, progressOf } from '../../../state/exercises.ts';

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
          description="Draw an isomer on the left; it lands here as soon as it counts."
        />
      ) : (
        <StructureGrid
          structures={found.map((answer, index) => {
            // Their own drawing, so what comes back after a reload is the
            // structure they laid out rather than a computed layout of it.
            const drawing = splitEditorValue(drawingOf(exercise.mf, answer));
            return {
              idCode: drawing.idCode || answer,
              coordinates: drawing.coordinates,
              tone: 'found' as const,
              label: String(index + 1),
            };
          })}
          size={130}
        />
      )}
    </Card>
  );
}
