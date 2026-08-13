import { Button, Callout } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { MF } from 'react-mf';

import {
  data,
  instructionPreferences,
  setShowInstructions,
} from '../../../state/exercises.ts';
import { isHidden } from '../../../state/shareConfig.ts';

/**
 * What the student is asked to do, once, at the top of the page. It folds
 * itself away as soon as they start drawing, and one button brings it back.
 * @returns The instructions panel component.
 */
export default function InstructionsPanel() {
  useSignals();
  const set = data.set.value;

  if (!instructionPreferences.showInstructions.value) {
    return (
      <div className="instructions-folded">
        <SkippedCallout />
        <Button
          size="small"
          variant="minimal"
          icon="learning"
          text="How this works"
          onClick={() => setShowInstructions(true)}
        />
      </div>
    );
  }

  return (
    <>
      <SkippedCallout />
      <Instructions description={set?.description} />
    </>
  );
}

/**
 * The formulas of the address that could not become an exercise. They are
 * named rather than dropped in silence: a teacher has to know their link is
 * not handing out what they wrote.
 * @returns The callout, or nothing when the whole set was usable.
 */
function SkippedCallout() {
  useSignals();
  const skipped = data.set.value?.skipped ?? [];
  if (skipped.length === 0) return null;

  return (
    <Callout icon="warning-sign" intent="warning" title="Left out of this set">
      {skipped.map((entry) => (
        <p key={entry.mf}>
          <MF mf={entry.mf} /> {withoutFormula(entry.reason, entry.mf)}
        </p>
      ))}
    </Callout>
  );
}

/** The reason opens on the formula, which is drawn properly next to it. */
function withoutFormula(reason: string, mf: string): string {
  return reason.startsWith(`${mf} `) ? reason.slice(mf.length + 1) : reason;
}

/**
 * The instructions describe what is on the page and nothing else: a link that
 * switches the hints or the correction off must not offer them in prose.
 */
function Instructions(props: { description: string | undefined }) {
  useSignals();
  return (
    <Callout
      className="instructions-callout"
      icon="learning"
      intent="warning"
      title="Find all structural isomers"
    >
      <Button
        className="instructions-fold"
        size="small"
        variant="minimal"
        icon="cross"
        title="Hide these instructions"
        aria-label="Hide these instructions"
        onClick={() => setShowInstructions(false)}
      />
      <p>{props.description}</p>
      <ol className="instructions">
        {isHidden('list') ? null : <li>Pick an exercise on the left.</li>}
        <li>
          Draw one possible isomer: it is checked on its own and kept when it
          counts, so there is nothing to press. Stereochemistry is ignored.
        </li>
        <StuckStep />
      </ol>
    </Callout>
  );
}

function StuckStep() {
  useSignals();
  const hints = !isHidden('hints');
  const answers = !isHidden('answers');
  if (!hints && !answers) return null;

  return (
    <li>
      {hints ? (
        <>
          Stuck? Reveal a hint: the first ones read the formula, the ones after
          them name what is missing from what you drew.{' '}
        </>
      ) : null}
      {answers ? (
        <>
          {hints ? 'Really stuck?' : 'Stuck?'} Give up, and every answer is
          shown — the ones you had found in green, the ones you missed in pink.
        </>
      ) : null}
    </li>
  );
}
