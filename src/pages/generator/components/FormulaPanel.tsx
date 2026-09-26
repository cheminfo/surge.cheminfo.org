import {
  Button,
  Callout,
  Card,
  FormGroup,
  H5,
  InputGroup,
  Tag,
} from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { ClickToCopy, CollapsibleSection } from 'react-cheminfo/ui';
import { MF } from 'react-mf';

import { useT } from '../../../i18n/useT.ts';
import { data, preferences, view } from '../../../state/generator.ts';
import { activeRestrictionCount } from '../../../state/generatorOptions.ts';
import { isResultCurrent, setFormula } from '../../../state/generatorRun.ts';
import { runSearch } from '../../../state/generatorUrl.ts';
import { isHidden } from '../../../state/shareConfig.ts';

import OptionsPanel from './OptionsPanel.tsx';
import RunProgress from './RunProgress.tsx';

const STATUS_MESSAGE = {
  complete: 'Every isomer was enumerated.',
  timeout:
    'The enumeration was stopped by the timeout, so this is a partial result. Raise the timeout or restrict the search.',
  'output-limit':
    'Surge produced more output than the service accepts, so this is a partial result.',
} as const;

/**
 * The molecular formula, how much to return, and the button that runs it.
 * @returns The formula panel component.
 */
export default function FormulaPanel() {
  useSignals();
  const t = useT();
  const result = data.result.value;
  const showOptions = view.showOptions.value;
  const restrictions = activeRestrictionCount.value;
  return (
    <Card>
      <H5>{t('ui.generator.formula')}</H5>
      <FormGroup
        label={t('ui.generator.formulaLabel')}
        helperText="C, B, N, P, O, S, H, Cl, F, Br and I at their lowest valence. Nx, Sx, Sy and Px select a higher one."
      >
        <InputGroup
          size="large"
          fill
          autoFocus
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          value={preferences.mf.value}
          onValueChange={setFormula}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void runSearch();
          }}
        />
      </FormGroup>
      <Button
        fill
        size="large"
        intent="primary"
        icon="search"
        text={t('ui.generator.search')}
        loading={view.isGenerating.value}
        disabled={isResultCurrent.value}
        onClick={() => void runSearch()}
      />

      <RunProgress />

      {view.error.value ? (
        <Callout intent="danger" style={{ marginTop: 12 }}>
          {view.error.value}
        </Callout>
      ) : null}

      {result ? (
        <Callout
          intent={result.status === 'complete' ? 'success' : 'warning'}
          style={{ marginTop: 12 }}
        >
          <div className="result-title">
            <MF mf={result.mf} /> —{' '}
            {/* The noun is inside the target so the glyph lands at the end of
                the line rather than over the word. */}
            <ClickToCopy
              value={String(result.found)}
              label={t('ui.generator.isomerCount')}
            >
              {result.found} isomers
            </ClickToCopy>
          </div>
          <div>
            Showing {result.returned}
            {result.matched !== undefined && result.matched !== result.found
              ? ` of the ${result.matched} matching the fragment`
              : ` of ${result.found}`}
            , in {result.time} ms.
          </div>
          <div>{STATUS_MESSAGE[result.status]}</div>
        </Callout>
      ) : null}

      {result && result.result.length > 0 && !isHidden('lists') ? (
        <Button
          fill
          icon="export"
          text={t('ui.export.title')}
          style={{ marginTop: 12 }}
          onClick={() => {
            view.isExportDialogOpen.value = true;
          }}
        />
      ) : null}

      {isHidden('options') ? null : (
        <CollapsibleSection
          className="options-toggle"
          title={t('ui.generator.options')}
          isOpen={showOptions}
          rightElement={
            restrictions > 0 ? <Tag intent="primary">{restrictions}</Tag> : null
          }
          onToggle={() => {
            view.showOptions.value = !showOptions;
          }}
        >
          <OptionsPanel />
        </CollapsibleSection>
      )}
    </Card>
  );
}
