import {
  Card,
  Collapse,
  FormGroup,
  H5,
  InputGroup,
  Switch,
} from '@blueprintjs/core';
import type { Signal } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';

import { preferences, view } from '../../../state/generator.ts';

interface SwitchOption {
  signal: Signal<boolean>;
  label: string;
}

interface RangeOption {
  signal: Signal<string>;
  label: string;
}

const MAIN_SWITCHES: SwitchOption[] = [
  {
    signal: preferences.aromaticity,
    label: 'Keep one Kekulé structure per aromatic ring',
  },
  { signal: preferences.disallowTripleBonds, label: 'Disallow triple bonds' },
  { signal: preferences.requirePlanarity, label: 'Require planarity' },
  { signal: preferences.evenRingsOnly, label: 'Only rings of even length' },
];

const RANGES: RangeOption[] = [
  { signal: preferences.limitBonds, label: 'Distinct non-H bonds' },
  { signal: preferences.limit3Rings, label: 'Cycles of length 3' },
  { signal: preferences.limit4Rings, label: 'Cycles of length 4' },
  { signal: preferences.limit5Rings, label: 'Cycles of length 5' },
  { signal: preferences.limit6Rings, label: 'Cycles of length 6' },
  { signal: preferences.limitCarbon6Rings, label: 'Chord-free C6 cycles' },
];

/** Single integers rather than ranges; empty leaves surge on its default of 4. */
const COUNTS: RangeOption[] = [
  { signal: preferences.maxDegree, label: 'Maximum degree' },
  { signal: preferences.maxCoordination, label: 'Maximum coordination' },
];

const SUBSTRUCTURE_SWITCHES: SwitchOption[] = [
  {
    signal: preferences.noSmallRingsTripleBonds,
    label: 'No triple bond in a ring up to length 7',
  },
  {
    signal: preferences.bredsRuleOne,
    label: "Bredt's rule, two rings sharing one bond",
  },
  {
    signal: preferences.bredsRuleTwo,
    label: "Bredt's rule, two rings sharing two bonds",
  },
  {
    signal: preferences.bredsRuleThree,
    label: "Bredt's rule, two six-rings sharing three bonds",
  },
  { signal: preferences.noAllene, label: 'No allene A=A=A' },
  {
    signal: preferences.noAlleneInSmallRings,
    label: 'No allene in a ring up to length 8',
  },
  { signal: preferences.noK33K24, label: 'No K33 or K24 substructure' },
  { signal: preferences.noCone, label: 'No cone of P4, no K4 with a 3-ear' },
  {
    signal: preferences.noSmallRingsCommonAtoms,
    label: 'No atom in two rings of length 3 or 4',
  },
];

/**
 * What surge is allowed to build. Everything below the first block is the
 * kind of restriction only a chemist asks for, so it starts folded.
 * @returns The options panel component.
 */
export default function OptionsPanel() {
  useSignals();
  return (
    <Card>
      <H5>Restrictions</H5>
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
    </Card>
  );
}
