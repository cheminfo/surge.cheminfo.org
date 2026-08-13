import { Button, Callout, Card, Spinner, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useState } from 'react';
import { MF } from 'react-mf';

import StructureEditor from '../../../components/StructureEditor.tsx';
import { countAtoms } from '../../../components/editorValue.ts';
import {
  data,
  giveUp,
  progressOf,
  resetExercise,
  submitStructure,
  view,
} from '../../../state/exercises.ts';

/**
 * The formula to work on, the editor to answer it, and what the answer was
 * worth.
 * @returns The drawing panel component.
 */
export default function DrawAnswerPanel() {
  useSignals();
  const exercise = data.current.value;

  if (view.isLoadingExercise.value && !exercise) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }
  if (!exercise) return null;

  const { found, gaveUp } = progressOf(exercise.mf);
  const isSolved = found.length >= exercise.count;

  return (
    <Card className="draw-card">
      <div className="target-formula">
        <MF mf={exercise.mf} />
      </div>
      <div className="target-score">
        <Tag size="large" intent={isSolved ? 'success' : 'primary'} minimal>
          {found.length} of {exercise.count} found
        </Tag>
      </div>

      {isSolved ? (
        <Callout intent="success" icon="tick-circle" title="Exercise complete">
          You found every isomer of this formula.
        </Callout>
      ) : (
        // The key remounts the canvas AND the structure read out of it, so an
        // accepted answer cannot be submitted again from an editor that no
        // longer shows it.
        <AnswerEditor key={`${exercise.mf}-${view.editorGeneration.value}`} />
      )}

      {view.feedback.value ? (
        <Callout
          intent={view.feedback.value.intent}
          style={{ marginTop: 12 }}
          icon={
            view.feedback.value.intent === 'success' ? 'tick' : 'warning-sign'
          }
        >
          {view.feedback.value.message}
          {view.feedback.value.mf ? (
            <span>
              {' '}
              <MF mf={view.feedback.value.mf} />
            </span>
          ) : null}
        </Callout>
      ) : null}

      <div className="field-row" style={{ marginTop: 12 }}>
        <Button
          icon="eraser"
          text="Clear my answers"
          disabled={found.length === 0 && !gaveUp}
          onClick={() => resetExercise(exercise.mf)}
        />
        <Button
          icon="eye-open"
          intent="warning"
          text="I give up"
          disabled={gaveUp || isSolved}
          onClick={() => void giveUp()}
        />
      </div>
    </Card>
  );
}

function AnswerEditor() {
  useSignals();
  const [idCode, setIDCode] = useState('');
  return (
    <>
      <StructureEditor minHeight={300} onChange={setIDCode} />
      <Button
        fill
        size="large"
        intent="primary"
        icon="add"
        text="Add this structure"
        disabled={countAtoms(idCode) === 0}
        loading={view.isChecking.value}
        onClick={() => void submitStructure(idCode)}
      />
    </>
  );
}
