import { Spinner } from '@blueprintjs/core';
import { useEffect, useState } from 'react';
import { MF } from 'react-mf';

import type { ExerciseAnswer } from '../../api/surge.ts';
import { fetchAnswers } from '../../api/surge.ts';
import { errorMessage } from '../../utils/errorMessage.ts';
import StructureGrid from '../StructureGrid.tsx';

/**
 * The enumeration of a formula, kept for as long as the page lives: a teacher
 * runs the mouse over the same rows again and again while putting a set
 * together, and every one of them costs the service a run.
 */
const enumerations = new Map<string, Promise<ExerciseAnswer[]>>();

interface Enumerated {
  mf: string;
  answers?: ExerciseAnswer[];
  error?: string;
}

/**
 * Every isomer of a formula, drawn — what a teacher is about to hand out.
 * @param props - The formula to enumerate.
 * @returns The preview component.
 */
export default function ExercisePreview(props: { mf: string }) {
  const { mf } = props;
  const [enumerated, setEnumerated] = useState<Enumerated | null>(null);

  useEffect(() => {
    let isCurrent = true;
    let pending = enumerations.get(mf);
    if (!pending) {
      pending = fetchAnswers(mf);
      enumerations.set(mf, pending);
    }
    pending.then(
      (answers) => {
        if (isCurrent) setEnumerated({ mf, answers });
      },
      (error: unknown) => {
        enumerations.delete(mf);
        if (isCurrent) setEnumerated({ mf, error: errorMessage(error) });
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [mf]);

  // The formula of another row is not this one's answer.
  const current = enumerated?.mf === mf ? enumerated : null;
  const answers = current?.answers;

  return (
    <div className="exercise-preview">
      <div className="exercise-preview-header">
        <MF mf={mf} />
        {answers ? (
          <span className="exercise-preview-count">
            {answers.length} {answers.length === 1 ? 'isomer' : 'isomers'}
          </span>
        ) : null}
      </div>
      {current?.error ? (
        <div className="exercise-preview-error">{current.error}</div>
      ) : null}
      {current ? null : (
        <div className="exercise-preview-loading">
          <Spinner size={20} />
        </div>
      )}
      {answers ? (
        <StructureGrid
          structures={answers.map((answer, index) => ({
            idCode: answer.idCode,
            label: String(index + 1),
          }))}
          size={90}
        />
      ) : null}
    </div>
  );
}
