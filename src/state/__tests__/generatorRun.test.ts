import { beforeEach, expect, test, vi } from 'vitest';

import type {
  GenerateParameters,
  GenerateResult,
  RunProgress,
} from '../../api/surge.ts';
import { data, preferences, view } from '../generator.ts';
import {
  cancelGeneration,
  isResultCurrent,
  runGeneration,
  setFormula,
} from '../generatorRun.ts';

const generate = vi.hoisted(() =>
  vi.fn(
    (
      parameters: GenerateParameters,
      options?: { onProgress?: (progress: RunProgress) => void },
    ): Promise<GenerateResult> => {
      void options;
      return Promise.resolve({
        mf: parameters.mf,
        found: 7,
        returned: 7,
        time: 1,
        status: 'complete',
        log: '',
        flags: ['-S'],
        result: [],
      });
    },
  ),
);

const cancelEverything = vi.hoisted(() => vi.fn());

const CancelledError = vi.hoisted(() => class CancelledError extends Error {});

vi.mock('../../api/surge.ts', () => ({
  generate,
  cancelEverything,
  CancelledError,
}));

beforeEach(() => {
  generate.mockClear();
  cancelEverything.mockClear();
  view.progress.value = null;
  view.isGenerating.value = false;
  data.result.value = null;
  data.lastRequest.value = '';
  data.fragmentCode.value = '';
  view.error.value = '';
  preferences.mf.value = 'C4H10O';
  preferences.limitBonds.value = '';
});

test('a new formula drops the substructure filter', () => {
  preferences.mf.value = 'C6H10O';
  data.fragmentCode.value = 'gFp@DiTt@@';

  setFormula('C7H14O');

  expect(preferences.mf.value).toBe('C7H14O');
  expect(data.fragmentCode.value).toBe('');
});

test('retyping the same formula keeps the filter', () => {
  preferences.mf.value = 'C6H10O';
  data.fragmentCode.value = 'gFp@DiTt@@';

  setFormula('C6H10O');

  expect(data.fragmentCode.value).toBe('gFp@DiTt@@');
});

test('the filter reaches the run, and a new formula runs without it', async () => {
  data.fragmentCode.value = 'gFp@DiTt@@';
  await runGeneration();

  expect(generate).toHaveBeenCalledTimes(1);
  expect(generate.mock.calls[0]?.[0].fragmentCode).toBe('gFp@DiTt@@');
  expect(isResultCurrent.value).toBe(true);

  setFormula('C5H12O');
  expect(isResultCurrent.value).toBe(false);

  await runGeneration();
  expect(generate).toHaveBeenCalledTimes(2);
  expect(generate.mock.calls[1]?.[0].fragmentCode).toBeUndefined();
  expect(generate.mock.calls[1]?.[0].mf).toBe('C5H12O');
});

test('a form nobody touched since the run is already answered', async () => {
  expect(isResultCurrent.value).toBe(false);

  await runGeneration();

  expect(generate).toHaveBeenCalledTimes(1);
  expect(data.result.value?.found).toBe(7);
  expect(isResultCurrent.value).toBe(true);
});

test('changing the formula asks for a new run', async () => {
  await runGeneration();
  setFormula('C5H12');

  expect(isResultCurrent.value).toBe(false);
});

test('changing a restriction asks for a new run', async () => {
  await runGeneration();
  preferences.limitBonds.value = '4';

  expect(isResultCurrent.value).toBe(false);
});

test('how far the run is reaches the page, and leaves with it', async () => {
  let duringRun: RunProgress | null = null;
  generate.mockImplementationOnce((parameters, options) => {
    options?.onProgress?.({
      phase: 'filter',
      done: 500,
      total: 1000,
    });
    duringRun = view.progress.peek();
    return Promise.resolve({
      mf: parameters.mf,
      found: 1,
      returned: 1,
      time: 1,
      status: 'complete',
      log: '',
      flags: ['-S'],
      result: [],
    });
  });

  await runGeneration();

  expect(duringRun).toStrictEqual({ phase: 'filter', done: 500, total: 1000 });
  expect(view.progress.value).toBeNull();
});

test('giving up on a run ends the worker and keeps what was on screen', async () => {
  await runGeneration();
  const shown = data.result.value;
  const answered = data.lastRequest.value;
  setFormula('C9H20');
  generate.mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        queueMicrotask(() => {
          cancelGeneration();
          reject(new CancelledError('The generation was cancelled'));
        });
      }),
  );

  await runGeneration();

  expect(cancelEverything).toHaveBeenCalledTimes(1);
  expect(view.error.value).toBe('');
  expect(data.result.value).toBe(shown);
  expect(data.lastRequest.value).toBe(answered);
  expect(view.isGenerating.value).toBe(false);
  expect(view.progress.value).toBeNull();
});

test('nothing is cancelled when no run is going on', () => {
  cancelGeneration();

  expect(cancelEverything).not.toHaveBeenCalled();
});

test('a run that failed leaves the search to be made again', async () => {
  generate.mockRejectedValueOnce(new Error('surge said no'));

  await runGeneration();

  expect(view.error.value).toBe('surge said no');
  expect(data.result.value).toBeNull();
  expect(isResultCurrent.value).toBe(false);
});
