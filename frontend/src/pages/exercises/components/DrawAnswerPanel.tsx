import { Button, Callout, Card, Spinner, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useEffect, useState } from 'react';
import { MF } from 'react-mf';

import StructureEditor from '../../../components/StructureEditor.tsx';
import {
  countAtoms,
  drawnFormula,
  isFormula,
  splitEditorValue,
} from '../../../components/editorValue.ts';
import {
  data,
  foldInstructionsOnDrawing,
  giveUp,
  lastDrawing,
  progressOf,
  resetExercise,
  submitStructure,
  view,
} from '../../../state/exercises.ts';
import { isHidden } from '../../../state/shareConfig.ts';

/**
 * The formula to work on, the editor to answer it, and what the answer was
 * worth. Nothing is submitted by hand: a drawing that holds the right atoms
 * is checked on its own, and kept when it counts.
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
      <div className="draw-header">
        <div className="target-formula">
          <MF mf={exercise.mf} />
        </div>
        <Tag intent={isSolved ? 'success' : 'primary'} minimal>
          {found.length} of {exercise.count} found
        </Tag>
        <div className="draw-header-actions">
          {isHidden('clear') ? null : (
            <Button
              size="small"
              icon="eraser"
              text="Clear my answers"
              disabled={found.length === 0 && !gaveUp}
              onClick={() => resetExercise(exercise.mf)}
            />
          )}
          {isHidden('answers') ? null : (
            <Button
              size="small"
              icon="eye-open"
              intent="warning"
              text="I give up"
              disabled={gaveUp || isSolved}
              onClick={() => void giveUp()}
            />
          )}
        </div>
      </div>

      {isSolved ? (
        <Callout intent="success" icon="tick-circle" title="Exercise complete">
          You found every isomer of this formula.
        </Callout>
      ) : (
        // An accepted answer stays on the canvas, so the key only changes when
        // the work itself is thrown away — another formula, or answers cleared.
        <AnswerEditor key={`${exercise.mf}-${view.editorGeneration.value}`} />
      )}

      {view.feedback.value ? (
        <Callout
          intent={view.feedback.value.intent}
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
    </Card>
  );
}

/** How long the drawing has to settle before it is sent, in milliseconds. */
const SETTLE_DELAY = 400;

/** How long a hand has to be off the canvas before the page is rearranged. */
const FOLD_DELAY = 1200;

function AnswerEditor() {
  useSignals();
  const exercise = data.current.value;
  const mf = exercise?.mf ?? '';
  // What was on the canvas when the student left: their last accepted answer,
  // which is what the next isomer is drawn from.
  const [restored] = useState(() => lastDrawing(mf));
  const [idCode, setIDCode] = useState(restored);
  // The structure last sent. An accepted answer is left on the canvas for the
  // student to edit into the next one, so without this it would be checked
  // again on every stroke that leaves it unchanged — a restored one included.
  const [checked, setChecked] = useState(
    () => splitEditorValue(restored).idCode,
  );
  const isChecking = view.isChecking.value;

  const matches = isFormula(idCode, mf);
  const code = splitEditorValue(idCode).idCode;

  useEffect(() => {
    if (!matches || isChecking) return;
    const drawn = splitEditorValue(idCode).idCode;
    if (!drawn || drawn === checked) return;

    const timer = setTimeout(() => {
      setChecked(drawn);
      void submitStructure(idCode);
    }, SETTLE_DELAY);
    return () => clearTimeout(timer);
  }, [idCode, matches, isChecking, checked]);

  // The canvas is what the page is for: drawing takes the instructions away,
  // once, and the student can bring them back. Folding moves the canvas up, so
  // it waits for the drawing to settle rather than jumping under the hand that
  // is still drawing.
  useEffect(() => {
    if (countAtoms(idCode) === 0) return;
    const timer = setTimeout(foldInstructionsOnDrawing, FOLD_DELAY);
    return () => clearTimeout(timer);
  }, [idCode]);

  return (
    <>
      <StructureEditor
        minHeight={300}
        initialIdCode={restored}
        onChange={setIDCode}
      />
      <DrawingStatus
        idCode={idCode}
        mf={mf}
        matches={matches}
        checked={code !== '' && code === checked}
      />
    </>
  );
}

function DrawingStatus(props: {
  idCode: string;
  mf: string;
  matches: boolean;
  checked: boolean;
}) {
  useSignals();
  const { idCode, mf, matches, checked } = props;
  const drawn = drawnFormula(idCode);

  if (view.isChecking.value) {
    return (
      <div className="drawing-status">
        <Spinner size={16} />
        <span>Checking your structure…</span>
      </div>
    );
  }
  if (!drawn) {
    return (
      <div className="drawing-status muted">
        <span>
          Draw an isomer: it is kept as soon as it is one of the answers.
        </span>
      </div>
    );
  }
  return (
    <div className={matches ? 'drawing-status matching' : 'drawing-status'}>
      <span>You have drawn</span>
      <MF mf={drawn} />
      {matches ? (
        checked ? (
          <span>— already checked. Move an atom to reach another isomer.</span>
        ) : (
          <span>— checking it against the answers.</span>
        )
      ) : (
        <>
          <span>— the exercise asks for</span>
          <MF mf={mf} />
        </>
      )}
    </div>
  );
}
