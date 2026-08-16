/** Where the pieces of an export document go as they are written. */
export interface ExportWriter {
  /** Take one piece. Writing is queued: the caller never waits on the disk. */
  write: (text: string) => void;
  /** Finish: commit the file, or hand it over. */
  close: () => Promise<void>;
  /** Give up: leave nothing behind. */
  abort: () => Promise<void>;
}

interface SaveFilePicker {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (text: string) => Promise<void>;
      close: () => Promise<void>;
      abort: () => Promise<void>;
    }>;
  }>;
}

/**
 * Where a downloaded export is written.
 *
 * An SDF of a large result is hundreds of megabytes, which nothing in the page
 * can hold: those pieces go straight to a file the visitor names, wherever the
 * browser can open one. A document that fits is downloaded as it always was,
 * without a second dialog to answer — and even then the pieces are handed to
 * the blob one at a time, so no single string is ever built.
 * @param fileName - What the file is called.
 * @param mediaType - What the browser is told it is.
 * @param description - What the file picker calls the format.
 * @param streamed - Whether the document is too large to be held.
 * @returns The writer, or nothing when the visitor closed the file picker.
 */
export async function fileWriter(
  fileName: string,
  mediaType: string,
  description: string,
  streamed: boolean,
): Promise<ExportWriter | null> {
  const picker = (globalThis as SaveFilePicker).showSaveFilePicker;
  if (streamed && picker !== undefined) {
    const extension = fileName.slice(fileName.lastIndexOf('.'));
    try {
      const handle = await picker({
        suggestedName: fileName,
        types: [{ description, accept: { [mediaType]: [extension] } }],
      });
      return streamWriter(await handle.createWritable());
    } catch (error) {
      // The visitor closed the picker: that is not a failure, and nothing
      // else should happen. Anything else — a framed page, where opening a
      // file is refused — falls back to the blob below.
      if ((error as DOMException | undefined)?.name === 'AbortError') {
        return null;
      }
    }
  }
  return blobWriter(fileName, mediaType);
}

/**
 * A writer that keeps the document to put it on the clipboard. Only offered
 * for a result small enough to hold, which is what the dialog checks.
 * @returns The writer.
 */
export function clipboardWriter(): ExportWriter {
  const parts: string[] = [];
  return {
    write: (text) => parts.push(text),
    close: () => navigator.clipboard.writeText(parts.join('')),
    abort: () => {
      parts.length = 0;
      return Promise.resolve();
    },
  };
}

function streamWriter(stream: {
  write: (text: string) => Promise<void>;
  close: () => Promise<void>;
  abort: () => Promise<void>;
}): ExportWriter {
  // The pieces arrive faster than the disk takes them, and must be written in
  // the order they were made, so each waits on the one before it.
  let queue = Promise.resolve();
  return {
    write: (text) => {
      queue = queue.then(() => stream.write(text));
    },
    close: async () => {
      await queue;
      await stream.close();
    },
    abort: async () => {
      queue = Promise.resolve();
      await stream.abort().catch(() => undefined);
    },
  };
}

function blobWriter(fileName: string, mediaType: string): ExportWriter {
  const parts: string[] = [];
  return {
    write: (text) => parts.push(text),
    close: () => {
      download(fileName, new Blob(parts, { type: mediaType }));
      parts.length = 0;
      return Promise.resolve();
    },
    abort: () => {
      parts.length = 0;
      return Promise.resolve();
    },
  };
}

function download(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
