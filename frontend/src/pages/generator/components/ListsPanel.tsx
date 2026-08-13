import { Button, Card, H5 } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';

import { data } from '../../../state/generator.ts';

/**
 * The results as plain text, ready to be copied into another tool.
 * @returns The lists panel component.
 */
export default function ListsPanel() {
  useSignals();
  const result = data.result.value;
  if (!result || result.result.length === 0) return null;

  const smiles = result.result.map((entry) => entry.smiles);
  const idCodes = result.result
    .map((entry) => entry.idCode)
    .filter((idCode): idCode is string => idCode !== undefined);

  return (
    <div className="panel-grid">
      <TextList title="SMILES" lines={smiles} fileName={`${result.mf}.smi`} />
      {idCodes.length > 0 ? (
        <TextList
          title="idCodes"
          lines={idCodes}
          fileName={`${result.mf}.idcodes.txt`}
        />
      ) : null}
    </div>
  );
}

function TextList(props: { title: string; lines: string[]; fileName: string }) {
  const text = props.lines.join('\n');
  return (
    <Card>
      <div className="card-header">
        <H5>{props.title}</H5>
        <div className="field-row">
          <Button
            size="small"
            icon="duplicate"
            text="Copy"
            onClick={() => void navigator.clipboard.writeText(text)}
          />
          <Button
            size="small"
            icon="download"
            text="Download"
            onClick={() => download(props.fileName, text)}
          />
        </div>
      </div>
      <ol className="text-list">
        {/* The service returns each structure once, so a line identifies itself. */}
        {props.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </Card>
  );
}

function download(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
