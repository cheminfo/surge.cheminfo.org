import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  InputGroup,
  Tab,
  Tabs,
} from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useMemo, useState } from 'react';

import type { GenerateResult } from '../../../api/surge.ts';
import CopyButton from '../../../components/share/CopyButton.tsx';
import { data, view } from '../../../state/generator.ts';
import type { ExportFormat } from '../exportResult.ts';
import {
  EXPORT_FORMATS,
  exportCount,
  exportFileName,
  exportText,
  formatDescriptor,
  previewOf,
} from '../exportResult.ts';

/** How much of the document the dialog shows, in lines. */
const PREVIEW_LINES = 60;

/**
 * Take the results away: the structures as SMILES, as idCodes or as an SDF,
 * copied or downloaded under a name of one's choosing.
 * @returns The export dialog component.
 */
export default function ExportDialog() {
  useSignals();
  const isOpen = view.isExportDialogOpen.value;
  const result = data.result.value;
  return (
    <Dialog
      isOpen={isOpen && result !== null}
      icon="export"
      title="Export the structures"
      className="export-dialog"
      onClose={close}
    >
      {/* The body only exists while the dialog is open, so it starts from the
          result currently on screen every time it is reopened. */}
      {isOpen && result ? <ExportDialogBody result={result} /> : null}
    </Dialog>
  );
}

function ExportDialogBody(props: { result: GenerateResult }) {
  const entries = props.result.result;
  const [format, setFormat] = useState<ExportFormat>('smiles');
  const [name, setName] = useState(props.result.mf);

  // An SDF is built by openchemlib for every structure, so it waits until the
  // tab that shows it is open.
  const text = useMemo(() => exportText(entries, format), [entries, format]);
  const preview = useMemo(() => previewOf(text, PREVIEW_LINES), [text]);
  const count = exportCount(entries, format);
  const fileName = exportFileName(name, format);

  return (
    <>
      <DialogBody>
        <Tabs
          id="export-format"
          selectedTabId={format}
          onChange={(id) => setFormat(id as ExportFormat)}
        >
          {EXPORT_FORMATS.map((descriptor) => (
            <Tab
              key={descriptor.id}
              id={descriptor.id}
              title={descriptor.label}
            />
          ))}
        </Tabs>
        <p className="muted">{formatDescriptor(format).description}</p>

        <FormGroup label="File name" helperText={`Downloaded as ${fileName}`}>
          <InputGroup
            fill
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            rightElement={
              <span className="export-extension">
                .{formatDescriptor(format).extension}
              </span>
            }
            value={name}
            onValueChange={setName}
          />
        </FormGroup>

        <div className="card-header">
          <span className="muted">
            {count} structure{count === 1 ? '' : 's'}
          </span>
          {preview.truncated ? (
            <span className="muted">
              showing the first {PREVIEW_LINES} lines
            </span>
          ) : null}
        </div>
        <pre className="export-preview">{preview.text}</pre>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Close" onClick={close} />
            {/* Remounted per format, so the confirmation of one tab is not
                still showing on the next. */}
            <CopyButton
              key={format}
              code={text}
              text="Copy"
              disabled={count === 0}
            />
            <Button
              intent="primary"
              icon="download"
              text="Download"
              disabled={count === 0}
              onClick={() =>
                download(fileName, text, formatDescriptor(format).mediaType)
              }
            />
          </>
        }
      />
    </>
  );
}

function download(fileName: string, text: string, mediaType: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mediaType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function close(): void {
  view.isExportDialogOpen.value = false;
}
