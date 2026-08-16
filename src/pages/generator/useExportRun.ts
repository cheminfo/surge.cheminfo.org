import { useState } from 'react';

import type { ExportFormat, StructureEntry } from '../../api/surge.ts';
import {
  CancelledError,
  cancelEverything,
  exportStructures,
} from '../../api/surge.ts';
import { errorMessage } from '../../utils/errorMessage.ts';

import type { ExportWriter } from './exportWriter.ts';

/** What a run is doing, for the format it was started on. */
export interface ExportRunState {
  format: ExportFormat;
  /** Where it is going, so the confirmation can say what happened. */
  target: 'file' | 'clipboard';
  status: 'writing' | 'done' | 'failed';
  /** Structures written so far, and how many there are. */
  done: number;
  total: number;
  /** Records the finished document holds. */
  records: number;
  message: string;
}

export interface ExportRun {
  /** The run of the format being looked at, or nothing when there is none. */
  state: ExportRunState | null;
  /**
   * Write the structures into a writer, telling the page how far it is. The
   * writer is built first, so the file picker opens on the visitor's click.
   */
  start: (
    open: () => Promise<ExportWriter | null>,
    target: 'file' | 'clipboard',
  ) => Promise<void>;
  cancel: () => void;
}

/**
 * Write an export, with somewhere to say how far it is and a way to stop.
 *
 * Everything happens in the worker: reading a large result back into molecules
 * is minutes of openchemlib, and the document is taken away piece by piece
 * rather than built in the page.
 * @param entries - The structures to write.
 * @param format - The format the dialog is showing.
 * @returns The state of the run and the two ways to drive it.
 */
export function useExportRun(
  entries: readonly StructureEntry[],
  format: ExportFormat,
): ExportRun {
  const [state, setState] = useState<ExportRunState | null>(null);

  async function start(
    open: () => Promise<ExportWriter | null>,
    target: 'file' | 'clipboard',
  ): Promise<void> {
    const writer = await open();
    if (writer === null) return;
    const started: ExportRunState = {
      format,
      target,
      status: 'writing',
      done: 0,
      total: entries.length,
      records: 0,
      message: '',
    };
    setState(started);
    try {
      const records = await exportStructures(entries, format, {
        onChunk: writer.write,
        onProgress: (progress) => {
          setState({ ...started, done: progress.done });
        },
      });
      await writer.close();
      setState({ ...started, status: 'done', done: entries.length, records });
    } catch (error) {
      await writer.abort();
      // Giving up is not a failure: nothing is said about a run the visitor
      // themselves ended.
      setState(
        error instanceof CancelledError
          ? null
          : { ...started, status: 'failed', message: errorMessage(error) },
      );
    }
  }

  return {
    state: state?.format === format ? state : null,
    start,
    cancel: cancelEverything,
  };
}
