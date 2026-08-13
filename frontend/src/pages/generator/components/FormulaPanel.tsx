import {
  Button,
  Callout,
  Card,
  Collapse,
  FormGroup,
  H5,
  InputGroup,
  Tag,
} from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { MF } from 'react-mf';

import { data, preferences, view } from '../../../state/generator.ts';
import { activeRestrictionCount } from '../../../state/generatorOptions.ts';
import { runSearch } from '../../../state/generatorUrl.ts';
import { isHidden } from '../../../state/shareConfig.ts';

import OptionsPanel from './OptionsPanel.tsx';

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
  const result = data.result.value;
  const showOptions = view.showOptions.value;
  const restrictions = activeRestrictionCount.value;
  return (
    <Card>
      <H5>Molecular formula</H5>
      <FormGroup
        label="Formula"
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
          onValueChange={(value) => {
            preferences.mf.value = value;
          }}
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
        text="Search structural isomers"
        loading={view.isGenerating.value}
        onClick={() => void runSearch()}
      />

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
            <MF mf={result.mf} /> — {result.found} isomers
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
          text="Export the structures"
          style={{ marginTop: 12 }}
          onClick={() => {
            view.isExportDialogOpen.value = true;
          }}
        />
      ) : null}

      {isHidden('options') ? null : (
        <>
          <div className="options-toggle">
            <Button
              variant="minimal"
              icon={showOptions ? 'chevron-down' : 'chevron-right'}
              text="Options and restrictions"
              onClick={() => {
                view.showOptions.value = !showOptions;
              }}
            />
            {restrictions > 0 ? (
              <Tag intent="primary">{restrictions}</Tag>
            ) : null}
          </div>
          <Collapse isOpen={showOptions}>
            <OptionsPanel />
          </Collapse>
        </>
      )}
    </Card>
  );
}
