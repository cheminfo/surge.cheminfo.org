import { Callout } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';

import { data } from '../../../state/exercises.ts';

/**
 * What the student is asked to do, once, at the top of the page.
 * @returns The instructions panel component.
 */
export default function InstructionsPanel() {
  useSignals();
  const set = data.set.value;
  return (
    <Callout
      icon="learning"
      intent="warning"
      title="Find all structural isomers"
    >
      <p>{set?.description}</p>
      <ol className="instructions">
        <li>Pick an exercise on the left.</li>
        <li>
          Draw one possible isomer in the editor, then add it. Stereochemistry
          is not taken into account.
        </li>
        <li>
          The <strong>found</strong> column counts the distinct isomers you
          already got.
        </li>
        <li>
          Stuck? Reveal a hint. Really stuck? Give up, and every answer is shown
          — the ones you had found in green, the ones you missed in pink.
        </li>
      </ol>
    </Callout>
  );
}
