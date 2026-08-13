import { Alert, Button, Card, H5, Icon, ProgressBar } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MF } from 'react-mf';

import type { ExerciseSummary } from '../../../api/surge.ts';
import {
  clearAllProgress,
  data,
  openExercise,
  progressOf,
} from '../../../state/exercises.ts';
import { isHidden } from '../../../state/shareConfig.ts';
import { revealDrawing } from '../drawingAnchor.ts';

/**
 * Every exercise of the set, how far the student got in each, and the way out
 * of a session gone wrong.
 * @returns The exercise list component.
 */
export default function ExerciseList() {
  useSignals();
  const [isClearing, setClearing] = useState(false);
  const set = data.set.value;
  const current = data.current.value;
  const listRef = useArrowKeyNavigation(set?.exercises ?? [], current?.mf);
  if (!set) return null;

  const solved = set.exercises.filter(
    (exercise) => progressOf(exercise.mf).found.length >= exercise.count,
  ).length;

  return (
    <Card className="exercise-list-card">
      <div className="card-header">
        <H5>{set.title}</H5>
        <span className="muted">
          {solved} / {set.exercises.length}
        </span>
      </div>
      <ProgressBar
        animate={false}
        stripes={false}
        intent={solved === set.exercises.length ? 'success' : 'primary'}
        value={set.exercises.length === 0 ? 0 : solved / set.exercises.length}
      />

      <ul className="exercise-list" ref={listRef}>
        {set.exercises.map((exercise, index) => (
          <ExerciseRow
            key={exercise.mf}
            index={index + 1}
            exercise={exercise}
            isActive={exercise.mf === current?.mf}
          />
        ))}
      </ul>

      {isHidden('clear') ? null : (
        <Button
          fill
          variant="minimal"
          icon="trash"
          intent="danger"
          text="Clear all answers"
          onClick={() => setClearing(true)}
        />
      )}
      <Alert
        isOpen={isClearing}
        canEscapeKeyCancel
        canOutsideClickCancel
        intent="danger"
        icon="trash"
        cancelButtonText="Keep them"
        confirmButtonText="Clear everything"
        onCancel={() => setClearing(false)}
        onConfirm={() => {
          clearAllProgress();
          setClearing(false);
        }}
      >
        Every structure you found, in every exercise, will be forgotten. There
        is no undo.
      </Alert>
    </Card>
  );
}

/**
 * Move through the exercises with the arrow keys, from anywhere on the page,
 * and keep the open one in view.
 * @param exercises - The set, in the order it is displayed.
 * @param currentMF - Formula of the exercise that is open.
 * @returns The ref to put on the scrolling list.
 */
function useArrowKeyNavigation(
  exercises: ExerciseSummary[],
  currentMF: string | undefined,
) {
  const listRef = useRef<HTMLUListElement>(null);
  const exercisesRef = useRef(exercises);
  const currentRef = useRef(currentMF);

  useLayoutEffect(() => {
    exercisesRef.current = exercises;
    currentRef.current = currentMF;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement
      ) {
        return;
      }
      const list = exercisesRef.current;
      if (list.length === 0) return;
      event.preventDefault();

      const index = list.findIndex(
        (exercise) => exercise.mf === currentRef.current,
      );
      const next =
        event.key === 'ArrowDown'
          ? Math.min(index + 1, list.length - 1)
          : Math.max(index - 1, 0);
      const target = list[next];
      if (target && next !== index) void openExercise(target.mf);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [currentMF]);

  return listRef;
}

function ExerciseRow(props: {
  index: number;
  exercise: ExerciseSummary;
  isActive: boolean;
}) {
  useSignals();
  const { exercise, isActive, index } = props;
  const { found, gaveUp } = progressOf(exercise.mf);
  const isSolved = found.length >= exercise.count;

  const classes = ['exercise-row', `exercise-row--${exercise.level}`];
  if (isActive) classes.push('exercise-row--active');
  if (isSolved) classes.push('exercise-row--solved');

  return (
    <li>
      <button
        type="button"
        className={classes.join(' ')}
        data-selected={isActive ? 'true' : undefined}
        onClick={() => {
          void openExercise(exercise.mf);
          revealDrawing();
        }}
      >
        <span className="exercise-row-index">{index}</span>
        <span className="exercise-row-mf">
          <MF mf={exercise.mf} />
        </span>
        <span className="exercise-row-score">
          {found.length} / {exercise.count}
        </span>
        <Icon
          icon={statusIcon(isSolved, found.length > 0, gaveUp)}
          intent={statusIntent(isSolved, found.length > 0, gaveUp)}
        />
      </button>
    </li>
  );
}

function statusIcon(solved: boolean, started: boolean, gaveUp: boolean) {
  if (solved) return 'tick-circle';
  if (gaveUp) return 'eye-open';
  return started ? 'warning-sign' : 'circle';
}

function statusIntent(solved: boolean, started: boolean, gaveUp: boolean) {
  if (solved) return 'success';
  if (gaveUp) return 'none';
  return started ? 'warning' : 'none';
}
