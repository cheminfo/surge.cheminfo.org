import { expect, test } from '@playwright/test';

import type * as SurgeApi from '../src/api/surge.ts';

/**
 * Everything the tool computes now happens in the page, in a worker of its
 * own, with nothing asked of any service. The module is loaded through the
 * dev server the way the pages load it, so this exercises the real worker and
 * the real WebAssembly.
 */
test('the worker generates, follows its progress and answers exercises', async ({
  page,
}) => {
  const failed: string[] = [];
  page.on('requestfailed', (request) => failed.push(request.url()));
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const result = await page.evaluate(async () => {
    const address = '/src/api/surge.ts';
    const { generate, fetchExercise, checkStructure, fetchVersion } =
      (await import(address)) as unknown as typeof SurgeApi;

    const progress: string[] = [];
    // The idCode makes the worker read every structure it enumerated, which is
    // the second phase a caller is told about — the one the filter waits on.
    const run = await generate(
      { mf: 'C4H10O', idCode: true },
      {
        onProgress: (step) => progress.push(`${step.phase}:${step.done}`),
      },
    );

    const big = await generate({ mf: 'C7H8O', limit: 5 });
    const exercise = await fetchExercise('C4H10O');
    // Diethyl ether, one of the seven.
    const check = await checkStructure('C4H10O', 'gJQ@@eKU@@');

    return {
      smiles: run.result.map((entry) => entry.smiles),
      status: run.status,
      progress,
      bigFound: big.found,
      bigReturned: big.returned,
      exercise,
      correct: check.correct,
      version: await fetchVersion(),
    };
  });

  expect(result.smiles).toStrictEqual([
    'CC(C)(O)C',
    'CC(C)OC',
    'CC(O)CC',
    'CC(C)CO',
    'CCCOC',
    'CCCCO',
    'CCOCC',
  ]);
  expect(result.status).toBe('complete');
  expect(result.progress).toStrictEqual(['generate:7', 'filter:7']);
  expect(result.bigFound).toBe(13_175);
  expect(result.bigReturned).toBe(5);
  expect(result.exercise.count).toBe(7);
  expect(result.exercise.hints.length).toBeGreaterThan(0);
  expect(result.correct).toBe(true);
  expect(result.version).toBe('2.0');
  // Nothing is asked of a service, because there is not one.
  expect(failed).toStrictEqual([]);
});
