import { Card, H5, NonIdealState, Spinner, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useMemo } from 'react';

import type { GridStructure } from '../../../components/StructureGrid.tsx';
import StructureGrid from '../../../components/StructureGrid.tsx';
import { useT } from '../../../i18n/useT.ts';
import { data, view } from '../../../state/generator.ts';

/**
 * Every structure that came back, drawn.
 * @returns The results panel component.
 */
export default function ResultsPanel() {
  useSignals();
  const t = useT();
  const generated = data.result.value;
  // A formula can hold a hundred thousand isomers, so the cells are built once
  // per result rather than on every render of the page.
  const structures = useMemo<GridStructure[]>(() => {
    const entries = generated?.result;
    if (!entries) return [];
    const cells = new Array<GridStructure>(entries.length);
    for (let index = 0; index < entries.length; index++) {
      cells[index] = {
        smiles: entries[index]?.smiles,
        label: String(index + 1),
      };
    }
    return cells;
  }, [generated]);

  if (view.isGenerating.value) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  const result = generated;
  if (!result) {
    return (
      <Card>
        <NonIdealState
          icon="graph"
          title={t('ui.generator.noStructure')}
          description={t('ui.generator.typeFormula')}
        />
      </Card>
    );
  }

  if (result.result.length === 0) {
    return (
      <Card>
        <NonIdealState
          icon="search"
          title={t('ui.generator.noMatch')}
          description={
            result.found === 0
              ? t('ui.generator.generatedNothing')
              : 'The restrictions or the substructure filter left nothing. Relax them and try again.'
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="card-header">
        <H5>{t('ui.generator.isomers')}</H5>
        <Tag minimal>
          {result.returned} of {result.found}
        </Tag>
      </div>
      <div className="results-scroll">
        <StructureGrid structures={structures} />
      </div>
    </Card>
  );
}
