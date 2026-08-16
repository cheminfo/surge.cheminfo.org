import { Checkbox, Icon, PopoverNext } from '@blueprintjs/core';
import type { DragEvent, KeyboardEvent } from 'react';
import { MF } from 'react-mf';

import type { ExerciseSummary } from '../../api/surge.ts';

import ExercisePreview from './ExercisePreview.tsx';

interface ShareExerciseRowProps {
  exercise: ExerciseSummary;
  index: number;
  isChosen: boolean;
  isDragged: boolean;
  /** Whether a drag is on, and what this row does about where it would land. */
  isDragging: boolean;
  gap: 'before' | 'after' | 'aside' | null;
  onToggle: (mf: string, checked: boolean) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  /** Move the row by that many places, from the keyboard. */
  onMove: (index: number, places: number) => void;
}

/**
 * One formula of the picker: whether the link hands it out, how many isomers it
 * holds, every one of them under the mouse, and a grip to put it in order.
 * @param props - The exercise, where it sits, and what a gesture does to it.
 * @returns The row component.
 */
export default function ShareExerciseRow(props: ShareExerciseRowProps) {
  const { exercise, index, isChosen, isDragged, isDragging, gap } = props;

  function keyMove(event: KeyboardEvent<HTMLSpanElement>): void {
    const places = MOVES[event.key];
    if (places === undefined) return;
    event.preventDefault();
    props.onMove(index, places);
  }

  const classes = ['share-set-item'];
  if (isChosen) classes.push('share-set-item--chosen');
  if (isDragged) classes.push('share-set-item--dragged');
  if (gap) classes.push(`share-set-item--gap-${gap}`);

  return (
    <li
      className={classes.join(' ')}
      draggable
      onDragStart={(event: DragEvent<HTMLLIElement>) => {
        // Firefox starts no drag at all without a payload.
        event.dataTransfer.setData('text/plain', exercise.mf);
        event.dataTransfer.effectAllowed = 'move';
        props.onDragStart(index);
      }}
      onDragEnd={() => props.onDragEnd()}
    >
      <span
        className="share-set-grip"
        role="button"
        tabIndex={0}
        aria-label={`Move ${exercise.mf}`}
        title="Drag to reorder, or use the arrow keys"
        onKeyDown={keyMove}
      >
        <Icon icon="drag-handle-vertical" size={12} />
      </span>
      <PopoverNext
        // A drawing popping up over the row a formula is being dropped on is
        // in the way of the gesture, so no row previews while one is on.
        disabled={isDragging}
        interactionKind="hover"
        hoverOpenDelay={400}
        hoverCloseDelay={100}
        arrow={false}
        fill
        targetTagName="div"
        popoverClassName="exercise-preview-popover"
        content={<ExercisePreview mf={exercise.mf} />}
      >
        <Checkbox
          checked={isChosen}
          onChange={(event) =>
            props.onToggle(exercise.mf, event.currentTarget.checked)
          }
        >
          <MF mf={exercise.mf} />
          <span className="share-set-isomers">
            {exercise.count} {exercise.count === 1 ? 'isomer' : 'isomers'}
          </span>
        </Checkbox>
      </PopoverNext>
    </li>
  );
}

const MOVES: Record<string, number | undefined> = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
};
