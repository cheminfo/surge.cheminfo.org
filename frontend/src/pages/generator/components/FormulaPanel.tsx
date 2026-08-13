import {
  Button,
  Callout,
  Card,
  FormGroup,
  H5,
  InputGroup,
  Switch,
} from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { MF } from 'react-mf';

import {
  data,
  preferences,
  runGeneration,
  view,
} from '../../../state/generator.ts';

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
            if (event.key === 'Enter') void runGeneration();
          }}
        />
      </FormGroup>
      <div className="field-row">
        <FormGroup label="Limit" helperText="Structures returned">
          <InputGroup
            type="number"
            min={1}
            value={String(preferences.limit.value)}
            onValueChange={(value) => {
              preferences.limit.value = Number(value) || 1;
            }}
          />
        </FormGroup>
        <FormGroup label="Timeout" helperText="Seconds, at most 30">
          <InputGroup
            type="number"
            min={0.1}
            max={30}
            step={1}
            value={String(preferences.timeout.value)}
            onValueChange={(value) => {
              preferences.timeout.value = Number(value) || 2;
            }}
          />
        </FormGroup>
      </div>
      <Switch
        checked={preferences.idCode.value}
        label="Compute the openchemlib idCode"
        onChange={(event) => {
          preferences.idCode.value = event.currentTarget.checked;
        }}
      />
      <Button
        fill
        size="large"
        intent="primary"
        icon="search"
        text="Search structural isomers"
        loading={view.isGenerating.value}
        onClick={() => void runGeneration()}
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
    </Card>
  );
}
