import { H6 } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useState } from 'react';
import { ShareDialog as SharePanel } from 'react-cheminfo/ui';

import { useT } from '../../i18n/useT.ts';
import { FORMULAS_PARAM } from '../../state/exerciseSets.ts';
import { data } from '../../state/exercises.ts';
import { route } from '../../state/router.ts';
import { shareOptionsOf } from '../../state/shareOptions.ts';

import ShareExerciseSet from './ShareExerciseSet.tsx';

/**
 * Build a link to the page as it is set up now, and the iframe that frames it
 * in a course. What the page is working on comes from the address; what an
 * embedder may change comes from this dialog.
 * @param props - Whether the dialog is open, and how to dismiss it.
 * @returns The share dialog component.
 */
export default function ShareDialog(props: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useSignals();
  const t = useT();
  const options = shareOptionsOf(route.page.value);
  // Until the teacher touches the list, the link hands out the whole set —
  // derived rather than copied at mount, so a set still loading when the
  // dialog opens does not leave it ticking nothing.
  const [chosen, setChosen] = useState<string[] | null>(null);
  const selected =
    chosen ?? data.set.value?.exercises.map((exercise) => exercise.mf) ?? [];

  return (
    <SharePanel
      isOpen={props.isOpen}
      onClose={props.onClose}
      vocabulary={options.vocabulary}
      title={options.title}
      frameTitle={`Surge — ${options.title}`}
      frameHeight={800}
      search={
        options.hasExercises
          ? exerciseSearch(selected)
          : globalThis.location?.search
      }
    >
      {(draft) => (
        <>
          {options.hasExercises ? (
            <>
              <H6>{t('ui.share.exercises')}</H6>
              <ShareExerciseSet selected={selected} onChange={setChosen} />
            </>
          ) : null}
          {draft.config.embed && !options.hasExercises ? (
            <p className="share-hint share-hint--flush">
              {t('ui.share.framedHint')}
            </p>
          ) : null}
        </>
      )}
    </SharePanel>
  );
}

/**
 * The address of the page with the chosen exercises written into it, which is
 * what the dialog then writes its own configuration over.
 * @param formulas - The chosen exercises, in the order they are handed out.
 * @returns The query string, without its leading `?`.
 */
function exerciseSearch(formulas: readonly string[]): string {
  const params = new URLSearchParams(globalThis.location?.search ?? '');
  const loaded = (data.set.peek()?.exercises ?? []).map(
    (exercise) => exercise.mf,
  );
  const isWholeSet =
    formulas.length === loaded.length &&
    formulas.every((mf, index) => mf === loaded[index]);

  if (formulas.length === 0) {
    // Nothing chosen: the set of the course, which is what a bare address gives.
    params.delete(FORMULAS_PARAM);
    params.delete('set');
  } else if (params.has('set') && isWholeSet) {
    // The document the teacher hosts still describes the set, wording included.
    params.delete(FORMULAS_PARAM);
  } else {
    params.delete('set');
    params.set(FORMULAS_PARAM, formulas.join(','));
  }

  const exercise = params.get('exercise');
  if (exercise && formulas.length > 0 && !formulas.includes(exercise)) {
    params.delete('exercise');
  }
  return params.toString();
}
