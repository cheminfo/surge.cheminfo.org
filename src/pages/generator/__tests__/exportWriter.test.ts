import { afterEach, expect, test, vi } from 'vitest';

import { fileWriter } from '../exportWriter.ts';

interface FakeFile {
  written: string[];
  closed: boolean;
  aborted: boolean;
}

/** A file picker that answers with a file the test can read afterwards. */
function fakePicker(file: FakeFile) {
  const picker = vi.fn((options: unknown) =>
    Promise.resolve({
      asked: options,
      createWritable: () =>
        Promise.resolve({
          write: (text: string) => {
            file.written.push(text);
            return Promise.resolve();
          },
          close: () => {
            file.closed = true;
            return Promise.resolve();
          },
          abort: () => {
            file.aborted = true;
            return Promise.resolve();
          },
        }),
    }),
  );
  Object.assign(globalThis, { showSaveFilePicker: picker });
  return { picker };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'showSaveFilePicker');
});

test('a large document goes to the file the visitor names, piece by piece', async () => {
  const file: FakeFile = { written: [], closed: false, aborted: false };
  const { picker } = fakePicker(file);

  const writer = await fileWriter(
    'C6H10O2.sdf',
    'chemical/x-mdl-sdfile',
    'SDF',
    true,
  );
  if (!writer) throw new Error('the picker answered with nothing');
  writer.write('first\n');
  writer.write('second\n');
  await writer.close();

  expect(picker).toHaveBeenCalledTimes(1);
  expect(picker.mock.calls[0]?.[0]).toStrictEqual({
    suggestedName: 'C6H10O2.sdf',
    types: [
      {
        description: 'SDF',
        accept: { 'chemical/x-mdl-sdfile': ['.sdf'] },
      },
    ],
  });
  // The pieces are written in the order they were made, and nothing joins
  // them into a single string on the way.
  expect(file.written).toStrictEqual(['first\n', 'second\n']);
  expect(file.closed).toBe(true);
});

test('giving up leaves no file behind', async () => {
  const file: FakeFile = { written: [], closed: false, aborted: false };
  fakePicker(file);

  const writer = await fileWriter(
    'a.sdf',
    'chemical/x-mdl-sdfile',
    'SDF',
    true,
  );
  if (!writer) throw new Error('the picker answered with nothing');
  writer.write('half a document\n');
  await writer.abort();

  expect(file.aborted).toBe(true);
  expect(file.closed).toBe(false);
});

test('closing the file picker writes nothing at all', async () => {
  const picker = vi.fn(() => {
    const error = new Error('the visitor closed the picker');
    error.name = 'AbortError';
    return Promise.reject(error);
  });
  Object.assign(globalThis, { showSaveFilePicker: picker });

  const writer = await fileWriter(
    'a.sdf',
    'chemical/x-mdl-sdfile',
    'SDF',
    true,
  );

  expect(writer).toBeNull();
});

test('a document that fits is downloaded without a picker to answer', async () => {
  const file: FakeFile = { written: [], closed: false, aborted: false };
  const { picker } = fakePicker(file);

  const writer = await fileWriter('a.smi', 'text/plain', 'SMILES', false);

  expect(picker).not.toHaveBeenCalled();
  expect(writer).not.toBeNull();
});
