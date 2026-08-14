import { Callout, Card, NonIdealState, Spinner } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useEffect } from 'react';

import { data, loadSet, syncFromAddress, view } from '../../state/exercises.ts';
import { route } from '../../state/router.ts';
import { isHidden } from '../../state/shareConfig.ts';

import AnswersPanel from './components/AnswersPanel.tsx';
import DrawAnswerPanel from './components/DrawAnswerPanel.tsx';
import ExerciseList from './components/ExerciseList.tsx';
import FoundPanel from './components/FoundPanel.tsx';
import HintsPanel from './components/HintsPanel.tsx';
import InstructionsPanel from './components/InstructionsPanel.tsx';
import { setDrawingAnchor } from './drawingAnchor.ts';

/**
 * Find every constitutional isomer of a formula yourself.
 * @returns The exercises page component.
 */
export default function ExercisesPage() {
  useSignals();

  const search = route.search.value;

  useEffect(() => {
    void loadSet();
  }, []);

  // The back and forward buttons move the address without going through us.
  useEffect(() => {
    syncFromAddress();
  }, [search]);

  if (view.isLoadingSet.value && !data.set.value) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  if (!data.set.value) {
    return (
      <Card>
        <NonIdealState
          icon="error"
          title="No exercise could be loaded"
          description={view.error.value || 'The service did not answer.'}
        />
      </Card>
    );
  }

  return (
    <div
      className={isHidden('list') ? 'exercises exercises--alone' : 'exercises'}
    >
      {isHidden('list') ? null : <ExerciseList />}
      <div className="panel-stack">
        <InstructionsPanel />
        <div ref={setDrawingAnchor}>
          <DrawAnswerPanel />
        </div>
        {isHidden('hints') ? null : <HintsPanel />}
      </div>
      <div className="panel-stack">
        {view.error.value ? (
          <Callout intent="danger">{view.error.value}</Callout>
        ) : null}
        <FoundPanel />
        {isHidden('answers') ? null : <AnswersPanel />}
      </div>
    </div>
  );
}
