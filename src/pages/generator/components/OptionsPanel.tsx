import {
  Button,
  Collapse,
  Divider,
  FormGroup,
  InputGroup,
  Switch,
  Tag,
} from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';

import { data, preferences, view } from '../../../state/generator.ts';
import {
  COUNTS,
  MAIN_SWITCHES,
  RANGES,
  SUBSTRUCTURE_SWITCHES,
} from '../../../state/generatorOptions.ts';
import { runSearch } from '../../../state/generatorUrl.ts';
import { isEmbedded, isHidden } from '../../../state/shareConfig.ts';

/**
 * Everything a search does not need: how much to return, the substructure
 * filter and what surge is allowed to build. It lives inside a fold, and the
 * last block is the kind of restriction only a chemist asks for, so it folds
 * again.
 * @returns The options panel component.
 */
export default function OptionsPanel() {
  useSignals();
  const fragmentCode = data.fragmentCode.value;
  return (
    <div className="options-panel">
      {/* What a run costs the service is never handed to a framed page: it
          runs on the limit and the timeout its link carries. */}
      {isEmbedded() ? null : (
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
      )}
      <Switch
        checked={preferences.idCode.value}
        label="Compute the openchemlib idCode"
        onChange={(event) => {
          preferences.idCode.value = event.currentTarget.checked;
        }}
      />

      {isHidden('substructure') ? null : (
        <>
          <Divider />
          <div className="field-row">
            <Button
              icon="draw"
              text="Substructure filter"
              onClick={() => {
                view.isFragmentDialogOpen.value = true;
              }}
            />
            {fragmentCode ? (
              <>
                <Tag intent="primary">active</Tag>
                <Button
                  icon="eraser"
                  text="Clear filter"
                  onClick={() => {
                    data.fragmentCode.value = '';
                    void runSearch();
                  }}
                />
              </>
            ) : (
              <span className="muted">No fragment drawn</span>
            )}
          </div>
        </>
      )}

      <Divider />
      {MAIN_SWITCHES.map(({ signal, label }) => (
        <Switch
          key={label}
          checked={signal.value}
          label={label}
          onChange={(event) => {
            signal.value = event.currentTarget.checked;
          }}
        />
      ))}

      <Switch
        checked={view.showAdvancedOptions.value}
        label="Show ring and substructure restrictions"
        onChange={(event) => {
          view.showAdvancedOptions.value = event.currentTarget.checked;
        }}
      />
      <Collapse isOpen={view.showAdvancedOptions.value}>
        <div className="field-row field-row--wrap">
          {RANGES.map((option) => (
            <FormGroup key={option.label} label={option.label}>
              <InputGroup
                size="small"
                placeholder="max or min:max"
                spellCheck={false}
                value={option.signal.value}
                onValueChange={(value) => {
                  option.signal.value = value;
                }}
              />
            </FormGroup>
          ))}
          {COUNTS.map((option) => (
            <FormGroup key={option.label} label={option.label}>
              <InputGroup
                size="small"
                placeholder="4"
                spellCheck={false}
                value={option.signal.value}
                onValueChange={(value) => {
                  option.signal.value = value.replaceAll(/\D/g, '');
                }}
              />
            </FormGroup>
          ))}
        </div>
        {SUBSTRUCTURE_SWITCHES.map(({ signal, label }) => (
          <Switch
            key={label}
            checked={signal.value}
            label={label}
            onChange={(event) => {
              signal.value = event.currentTarget.checked;
            }}
          />
        ))}
      </Collapse>
    </div>
  );
}
