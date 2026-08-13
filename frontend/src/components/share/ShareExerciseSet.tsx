import { Button, Callout, InputGroup } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { DragEvent } from 'react';
import { useRef, useState } from 'react';

import type { ExerciseSummary } from '../../api/surge.ts';
import { fetchExerciseSet } from '../../api/surge.ts';
import { data } from '../../state/exercises.ts';
import { errorMessage } from '../../utils/errorMessage.ts';

import ShareExerciseRow from './ShareExerciseRow.tsx';
import type { RowBox } from './dropGap.ts';
import { gapAt } from './dropGap.ts';
import { arrangeExercises, dropFormula, moveFormula } from './exerciseOrder.ts';

/**
 * Which exercises the link hands out, and in which order: the ones of the set
 * currently open, plus any formula the teacher adds. A formula is counted by
 * the service before it is added, so a set that cannot be enumerated never
 * reaches a student.
 * @param props - The chosen formulas and how to change them.
 * @returns The exercise picker component.
 */
export default function ShareExerciseSet(props: {
  selected: readonly string[];
  onChange: (selected: string[]) => void;
}) {
  useSignals();
  const { selected, onChange } = props;
  const [added, setAdded] = useState<ExerciseSummary[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [dragged, setDragged] = useState<number | null>(null);
  const [gap, setGap] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const boxes = useRef<RowBox[]>([]);
  // What the drop reads. A drop arrives before React has re-rendered the last
  // dragover, so the state is one move behind at exactly the wrong moment.
  const dragState = useRef<{ dragged: number | null; gap: number | null }>({
    dragged: null,
    gap: null,
  });
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setChecking] = useState(false);

  const candidates = arrangeExercises(
    [...(data.set.value?.exercises ?? []), ...added],
    order,
  );
  const formulas = candidates.map((exercise) => exercise.mf);
  const chosen = new Set(selected);

  function toggle(mf: string, checked: boolean): void {
    onChange(
      formulas.filter((formula) =>
        formula === mf ? checked : chosen.has(formula),
      ),
    );
  }

  /**
   * Keep an arrangement. The order of the link is the order the student walks
   * through, so what was ticked is handed out again in the new one.
   * @param moved - The formulas, arranged.
   */
  function arrange(moved: string[]): void {
    setOrder(moved);
    onChange(moved.filter((formula) => chosen.has(formula)));
  }

  /**
   * Where the rows are, read once, when a drag starts. They step aside to open
   * the slot, so reading them again mid-drag would let the answer move the
   * question.
   * @param index - The row being dragged.
   */
  function startDrag(index: number): void {
    const rows = listRef.current?.children ?? [];
    boxes.current = [...rows].map((row) => row.getBoundingClientRect());
    dragState.current = { dragged: index, gap: null };
    setDragged(index);
  }

  function overGap(gapUnder: number | null): void {
    dragState.current.gap = gapUnder;
    setGap(gapUnder);
  }

  function endDrag(): void {
    dragState.current = { dragged: null, gap: null };
    setDragged(null);
    setGap(null);
  }

  async function add(): Promise<void> {
    const mf = draft.trim();
    if (!mf) return;
    setError('');
    if (candidates.some((exercise) => exercise.mf === mf)) {
      setDraft('');
      if (!selected.includes(mf)) toggle(mf, true);
      return;
    }
    setChecking(true);
    try {
      const set = await fetchExerciseSet([mf]);
      const exercise = set.exercises[0];
      if (!exercise) throw new Error(`${mf} is not an exercise`);
      setAdded((previous) => [...previous, exercise]);
      setDraft('');
      onChange([...selected, exercise.mf]);
    } catch (addError) {
      setError(errorMessage(addError));
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <div className="share-set-toolbar">
        <Button
          size="small"
          text="All"
          disabled={selected.length === candidates.length}
          onClick={() => onChange(formulas)}
        />
        <Button
          size="small"
          text="None"
          disabled={selected.length === 0}
          onClick={() => onChange([])}
        />
        <span className="share-set-count">
          <b>{selected.length}</b> of {candidates.length} chosen
        </span>
      </div>

      <ul
        className="share-set"
        ref={listRef}
        onDragOver={(event: DragEvent<HTMLUListElement>) => {
          if (dragState.current.dragged === null) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          overGap(gapAt(boxes.current, event.clientX, event.clientY));
        }}
        onDrop={(event: DragEvent<HTMLUListElement>) => {
          event.preventDefault();
          const { dragged: from, gap: to } = dragState.current;
          if (from !== null && to !== null) {
            arrange(dropFormula(formulas, from, to));
          }
          endDrag();
        }}
      >
        {candidates.map((exercise, index) => (
          <ShareExerciseRow
            key={exercise.mf}
            exercise={exercise}
            index={index}
            isChosen={chosen.has(exercise.mf)}
            isDragged={dragged === index}
            isDragging={dragged !== null}
            gap={gapOf(gap, index, candidates.length)}
            onToggle={toggle}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            onMove={(from, places) =>
              arrange(moveFormula(formulas, from, from + places))
            }
          />
        ))}
      </ul>

      <p className="share-hint share-hint--flush">
        Drag a formula to change the order the student walks through: the bar
        shows where it lands. The one under the cursor also moves with the arrow
        keys.
      </p>

      <div className="share-row share-set-add">
        <InputGroup
          placeholder="Add a formula, for example C5H10O"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          value={draft}
          onValueChange={setDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void add();
          }}
        />
        <Button
          icon="add"
          text="Add"
          loading={isChecking}
          disabled={!draft.trim()}
          onClick={() => void add()}
        />
      </div>
      {error ? (
        <Callout intent="danger" compact icon={null}>
          {error}
        </Callout>
      ) : null}

      {selected.length === 0 ? (
        <p className="share-hint share-hint--flush">
          With nothing chosen, the link hands out the set of the course.
        </p>
      ) : null}
    </>
  );
}

/**
 * What a row does about the gap the formula would land in. The two rows around
 * it step aside so the slot is real, and the one after it carries the line —
 * the last row carries it on its right when the formula lands at the end.
 * @param gap - The gap the pointer is over, or nothing.
 * @param index - The row asking.
 * @param count - How many rows there are.
 * @returns What the row does, or nothing when the gap is elsewhere.
 */
function gapOf(
  gap: number | null,
  index: number,
  count: number,
): 'before' | 'after' | 'aside' | null {
  if (gap === null) return null;
  if (gap === index) return 'before';
  if (gap >= count && index === count - 1) return 'after';
  if (gap === index + 1) return 'aside';
  return null;
}
