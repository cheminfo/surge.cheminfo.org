import { Button, Callout, Card, H5, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';

import type { Hint } from '../../../state/exercises.ts';
import {
  data,
  hintLadder,
  progressOf,
  revealHint,
} from '../../../state/exercises.ts';

/**
 * The hint ladder, revealed one rung at a time. The first rungs are what the
 * formula alone says; the ones after them come from comparing the answers
 * with the structures already found, so they change as the student works.
 * @returns The hints panel component.
 */
export default function HintsPanel() {
  useSignals();
  const exercise = data.current.value;
  const hints = hintLadder();
  if (!exercise || hints.length === 0) return null;

  const { hintsRevealed } = progressOf(exercise.mf);
  const revealed = hints.slice(0, hintsRevealed);

  return (
    <Card>
      <div className="card-header">
        <H5>Hints</H5>
        {hintsRevealed < hints.length ? (
          <Button
            size="small"
            icon="lightbulb"
            text={revealed.length === 0 ? 'Reveal a hint' : 'Another hint'}
            onClick={revealHint}
          />
        ) : null}
      </div>
      {revealed.length === 0 ? (
        <p className="muted">
          The first hints are about the formula. The ones after them look at
          what you have already drawn and name what is missing from it.
        </p>
      ) : (
        revealed.map((hint) => <HintCallout key={hint.id} hint={hint} />)
      )}
    </Card>
  );
}

const KIND_TAG: Record<Hint['kind'], string | null> = {
  general: null,
  missing: 'Never drawn',
  partial: 'Half explored',
  complete: 'Nothing missing',
};

const KIND_INTENT: Record<Hint['kind'], 'primary' | 'warning' | 'success'> = {
  general: 'primary',
  missing: 'warning',
  partial: 'primary',
  complete: 'success',
};

function HintCallout(props: { hint: Hint }) {
  const { hint } = props;
  const tag = KIND_TAG[hint.kind];
  return (
    <Callout intent={KIND_INTENT[hint.kind]} style={{ marginTop: 8 }}>
      {tag ? (
        <Tag minimal intent={KIND_INTENT[hint.kind]} style={{ marginRight: 6 }}>
          {tag}
        </Tag>
      ) : null}
      {hint.text}
    </Callout>
  );
}
