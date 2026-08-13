import { Card, H5, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';

import StructureGrid from '../../../components/StructureGrid.tsx';
import { data, progressOf } from '../../../state/exercises.ts';

/**
 * The correction, once the student asked for it: every isomer, the ones they
 * had found in green and the ones they missed in pink.
 * @returns The answers panel component.
 */
export default function AnswersPanel() {
  useSignals();
  const exercise = data.current.value;
  const answers = data.answers.value;
  if (!exercise || !answers) return null;

  const found = new Set(progressOf(exercise.mf).found);
  const missed = answers.filter((answer) => !found.has(answer.idCode)).length;

  return (
    <Card>
      <div className="card-header">
        <H5>All the answers</H5>
        <Tag minimal intent={missed === 0 ? 'success' : 'danger'}>
          {missed} missed
        </Tag>
      </div>
      <StructureGrid
        structures={answers.map((answer, index) => ({
          idCode: answer.idCode,
          tone: found.has(answer.idCode) ? 'found' : 'missed',
          label: String(index + 1),
        }))}
        size={130}
      />
    </Card>
  );
}
