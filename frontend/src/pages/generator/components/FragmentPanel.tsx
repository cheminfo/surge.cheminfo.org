import { Button, Card, H5, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useState } from 'react';

import StructureEditor from '../../../components/StructureEditor.tsx';
import { countAtoms } from '../../../components/editorValue.ts';
import { data, runGeneration, view } from '../../../state/generator.ts';

/**
 * Draw a fragment to keep only the isomers that contain it. Query features
 * are available, because the editor is in fragment mode.
 * @returns The fragment panel component.
 */
export default function FragmentPanel() {
  useSignals();
  const [generation, setGeneration] = useState(0);
  const fragmentCode = data.fragmentCode.value;

  return (
    <Card className="fill-card">
      <div className="card-header">
        <H5>Substructure filter</H5>
        {fragmentCode ? <Tag intent="primary">active</Tag> : null}
      </div>
      <p className="muted">
        Draw a fragment to keep only the isomers containing it. Leave it empty
        to keep them all.
      </p>
      <StructureEditor
        // Remounting is how the editor is emptied: it owns its canvas.
        key={generation}
        fragment
        minHeight={280}
        onChange={(idCode) => {
          // An erased drawing still has an idCode, and taking it for a filter
          // would quietly reject every structure.
          data.fragmentCode.value = countAtoms(idCode) > 0 ? idCode : '';
        }}
      />
      <div className="field-row" style={{ marginTop: 8 }}>
        <Button
          icon="eraser"
          text="Clear"
          disabled={!fragmentCode}
          onClick={() => {
            data.fragmentCode.value = '';
            setGeneration((value) => value + 1);
          }}
        />
        <Button
          intent="primary"
          icon="filter"
          text="Apply filter"
          loading={view.isGenerating.value}
          onClick={() => void runGeneration()}
        />
      </div>
    </Card>
  );
}
