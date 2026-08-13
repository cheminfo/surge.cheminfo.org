import { Button, Callout, Card, H5 } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';

import { data, progressOf, revealHint } from '../../../state/exercises.ts';

/**
 * The hint ladder, revealed one rung at a time.
 * @returns The hints panel component.
 */
export default function HintsPanel() {
  useSignals();
  const exercise = data.current.value;
  if (!exercise || exercise.hints.length === 0) return null;

  const { hintsRevealed } = progressOf(exercise.mf);
  const revealed = exercise.hints.slice(0, hintsRevealed);

  return (
    <Card>
      <div className="card-header">
        <H5>Hints</H5>
        <Button
          size="small"
          icon="lightbulb"
          disabled={hintsRevealed >= exercise.hints.length}
          text={
            hintsRevealed >= exercise.hints.length
              ? 'No hint left'
              : `Reveal hint ${hintsRevealed + 1} of ${exercise.hints.length}`
          }
          onClick={revealHint}
        />
      </div>
      {revealed.length === 0 ? (
        <p className="muted">
          Hints go from a general remark to a concrete method. Try without them
          first.
        </p>
      ) : (
        revealed.map((hint) => (
          <Callout key={hint} intent="primary" style={{ marginTop: 8 }}>
            {hint}
          </Callout>
        ))
      )}
    </Card>
  );
}
