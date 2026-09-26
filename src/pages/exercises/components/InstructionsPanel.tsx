import { Button, Callout } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { MF } from 'react-mf';

import { exerciseSetDescription } from '../../../exercises/setText.ts';
import { useLanguage, useT } from '../../../i18n/useT.ts';
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
  const t = useT();
  const language = useLanguage();
  const set = data.set.value;

  if (!instructionPreferences.showInstructions.value) {
    return (
      <div className="instructions-folded">
        <SkippedCallout />
        <Button
          size="small"
          variant="minimal"
          icon="learning"
          text={t('ui.exercises.howItWorks')}
          onClick={() => setShowInstructions(true)}
        />
      </div>
    );
  }

  return (
    <>
      <SkippedCallout />
      <Instructions
        description={set ? exerciseSetDescription(set, language) : undefined}
      />
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
  const t = useT();
  const skipped = data.set.value?.skipped ?? [];
  if (skipped.length === 0) return null;

  return (
    <Callout
      icon="warning-sign"
      intent="warning"
      title={t('ui.exercises.leftOut')}
    >
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
  const t = useT();
  return (
    <Callout
      className="instructions-callout"
      icon="learning"
      intent="warning"
      title={t('ui.exercises.findAll')}
    >
      <Button
        className="instructions-fold"
        size="small"
        variant="minimal"
        icon="cross"
        title={t('ui.exercises.hideInstructions')}
        aria-label={t('ui.exercises.hideInstructions')}
        onClick={() => setShowInstructions(false)}
      />
      <p>{props.description}</p>
      <ol className="instructions">
        {isHidden('list') ? null : <li>{t('ui.exercises.pickOne')}</li>}
        <li>{t('ui.exercises.stepDraw')}</li>
        <StuckStep />
      </ol>
    </Callout>
  );
}

function StuckStep() {
  useSignals();
  const t = useT();
  const hints = !isHidden('hints');
  const answers = !isHidden('answers');
  if (!hints && !answers) return null;

  return (
    <li>
      {hints ? t('ui.exercises.stepHints') : null}
      {answers
        ? `${hints ? t('ui.exercises.reallyStuck') : t('ui.exercises.stuck')}${t('ui.exercises.stepGiveUp')}`
        : null}
    </li>
  );
}
