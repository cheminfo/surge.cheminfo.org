import {
  Button,
  Callout,
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

import type { ExportFormat, GenerateResult } from '../../../api/surge.ts';
import RunProgressBar from '../../../components/RunProgressBar.tsx';
import { data, view } from '../../../state/generator.ts';
import {
  EXPORT_FORMATS,
  exportFileName,
  exportPreview,
  formatDescriptor,
} from '../exportResult.ts';
import { clipboardWriter, fileWriter } from '../exportWriter.ts';
import type { ExportRunState } from '../useExportRun.ts';
import { useExportRun } from '../useExportRun.ts';

/** How much of the document the dialog shows, in lines. */
const PREVIEW_LINES = 60;

/**
 * How many structures may be copied. The clipboard takes one string, so what
 * is copied is held whole — a file is the way to take a large result away.
 */
const COPY_LIMIT = 20_000;

/**
 * Past this many bytes the document is written straight to a file the visitor
 * names rather than held until it is whole. Below it nothing changes: the
 * download arrives with no second dialog to answer.
 */
const STREAM_THRESHOLD = 64 * 1024 * 1024;

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
  const run = useExportRun(entries, format);

  const descriptor = formatDescriptor(format);
  const fileName = exportFileName(name, format);
  const count = entries.length;
  // Only the first structures are written for the preview: a million of them
  // must cost no more to look at than ten.
  const preview = useMemo(
    () => exportPreview(entries, format, PREVIEW_LINES),
    [entries, format],
  );

  const writing = run.state?.status === 'writing';
  return (
    <>
      <DialogBody>
        <Tabs
          id="export-format"
          selectedTabId={format}
          onChange={(id) => setFormat(id as ExportFormat)}
        >
          {EXPORT_FORMATS.map((entry) => (
            <Tab key={entry.id} id={entry.id} title={entry.label} />
          ))}
        </Tabs>
        <p className="muted">{descriptor.description}</p>

        <FormGroup label="File name" helperText={`Downloaded as ${fileName}`}>
          <InputGroup
            fill
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            rightElement={
              <span className="export-extension">.{descriptor.extension}</span>
            }
            value={name}
            onValueChange={setName}
          />
        </FormGroup>

        {/* What is happening sits above the preview: a dialog whose document
            is being written must say so where the eye already is. */}
        <ExportStatus run={run.state} fileName={fileName} />
        {writing ? (
          <RunProgressBar
            label={`Writing ${run.state?.done ?? 0} of ${count} structures`}
            value={count > 0 ? (run.state?.done ?? 0) / count : undefined}
            onCancel={run.cancel}
          />
        ) : null}

        <div className="card-header">
          <span className="muted">
            {count} structure{count === 1 ? '' : 's'}
            {sizeNote(preview.size)}
          </span>
          {preview.truncated ? (
            <span className="muted">showing the first lines</span>
          ) : null}
        </div>
        <pre className="export-preview">{preview.text}</pre>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Close" onClick={close} />
            <Button
              icon="duplicate"
              text="Copy"
              disabled={count === 0 || count > COPY_LIMIT || writing}
              title={
                count > COPY_LIMIT
                  ? `More than ${COPY_LIMIT} structures: download the file instead`
                  : undefined
              }
              onClick={() => {
                void run.start(
                  () => Promise.resolve(clipboardWriter()),
                  'clipboard',
                );
              }}
            />
            <Button
              intent="primary"
              icon="download"
              text="Download"
              disabled={count === 0 || writing}
              onClick={() => {
                void run.start(
                  () =>
                    fileWriter(
                      fileName,
                      descriptor.mediaType,
                      descriptor.label,
                      preview.size > STREAM_THRESHOLD,
                    ),
                  'file',
                );
              }}
            />
          </>
        }
      />
    </>
  );
}

function ExportStatus({
  run,
  fileName,
}: {
  run: ExportRunState | null;
  fileName: string;
}) {
  if (run === null || run.status === 'writing') return null;
  if (run.status === 'failed') {
    return <Callout intent="danger">{run.message}</Callout>;
  }
  return (
    <Callout intent="success">
      {run.target === 'clipboard'
        ? `Copied ${run.records} structures`
        : `Wrote ${run.records} structures to ${fileName}`}
    </Callout>
  );
}

/** What the document weighs, said only when that is worth knowing. */
function sizeNote(size: number): string {
  const megabytes = size / (1024 * 1024);
  if (megabytes < 1) return '';
  return megabytes < 1024
    ? `, about ${Math.round(megabytes)} MB`
    : `, about ${(megabytes / 1024).toFixed(1)} GB`;
}

function close(): void {
  view.isExportDialogOpen.value = false;
}
