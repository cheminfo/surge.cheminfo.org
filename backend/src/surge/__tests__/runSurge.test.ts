import { expect, test } from 'vitest';

import { config } from '../../config.ts';
import { runSurge } from '../runSurge.ts';

test('an executable that cannot be run fails loudly', async () => {
  const previous = config.surgePath;
  config.surgePath = '/nonexistent/surge';
  try {
    // A missing binary must not look like a formula with no isomer: every
    // answer would then be a confident zero.
    await expect(runSurge(['-S', 'C5H12'], 2000)).rejects.toThrow(
      /surge could not be run/,
    );
  } finally {
    config.surgePath = previous;
  }
});

test('a run that finishes reports what surge wrote', async () => {
  const run = await runSurge(['-S', '-R', 'C5H12'], 5000);

  expect(run.lines).toStrictEqual(['CC(C)(C)C', 'CC(C)CC', 'CCCCC']);
  expect(run.timedOut).toBe(false);
  expect(run.truncated).toBe(false);
  expect(run.written).toBe(3);
  expect(run.log).toContain('C5H12');
});

test('an enumeration larger than the output cap is truncated, not buffered whole', async () => {
  const previous = config.maxOutputBytes;
  config.maxOutputBytes = 64 * 1024;
  try {
    const run = await runSurge(['-S', '-R', 'C10H16O'], 20_000);

    expect(run.truncated).toBe(true);
    expect(run.timedOut).toBe(false);
    // Every line kept is whole: the half line the kill left behind is dropped.
    for (const line of run.lines) expect(line).not.toContain('\n');
    expect(run.lines.length).toBeGreaterThan(100);
    expect(run.lines.length).toBeLessThan(10_000);
  } finally {
    config.maxOutputBytes = previous;
  }
});
