import { expect, test } from 'vitest';

import {
  clearProgress,
  drawingOf,
  lastDrawing,
  progress,
  progressOf,
  setProgressStore,
  updateProgress,
} from '../exerciseProgress.ts';
import type { ProgressByFormula, ProgressStore } from '../progressStore.ts';

function memoryStore(initial: ProgressByFormula = {}): ProgressStore & {
  saved: ProgressByFormula[];
} {
  const saved: ProgressByFormula[] = [];
  return {
    name: 'memory',
    saved,
    load: () => initial,
    save: (byFormula) => {
      saved.push(byFormula);
    },
  };
}

test('a found structure keeps the drawing it was made with, under its formula', async () => {
  await setProgressStore(memoryStore());
  updateProgress('C4H10', {
    found: ['gJPHATeVA'],
    drawings: { gJPHATeVA: 'gJPHATeVA !BbqZbrqR@' },
  });

  expect(progressOf('C4H10').found).toStrictEqual(['gJPHATeVA']);
  expect(drawingOf('C4H10', 'gJPHATeVA')).toBe('gJPHATeVA !BbqZbrqR@');
  expect(lastDrawing('C4H10')).toBe('gJPHATeVA !BbqZbrqR@');
  expect(progressOf('C5H12').found).toStrictEqual([]);
  expect(lastDrawing('C5H12')).toBe('');
});

test('the canvas reopens on the last answer that was accepted', async () => {
  await setProgressStore(memoryStore());
  updateProgress('C4H10', {
    found: ['first', 'second'],
    drawings: { first: 'first !coords1', second: 'second !coords2' },
  });

  expect(lastDrawing('C4H10')).toBe('second !coords2');
});

test('an entry stored before drawings were kept still opens', async () => {
  await setProgressStore(
    memoryStore({
      // The shape written by an earlier version: no drawings at all.
      C4H10: { found: ['gJPHATeVA'], gaveUp: false, hintsRevealed: 2 } as never,
    }),
  );

  expect(progressOf('C4H10')).toStrictEqual({
    found: ['gJPHATeVA'],
    drawings: {},
    gaveUp: false,
    hintsRevealed: 2,
  });
  expect(drawingOf('C4H10', 'gJPHATeVA')).toBe('gJPHATeVA');
});

test('every change reaches the bound store, clearing included', async () => {
  const store = memoryStore();
  await setProgressStore(store);
  store.saved.length = 0;

  updateProgress('C4H10O', { hintsRevealed: 1 });
  updateProgress('C4H10O', { found: ['a'], drawings: { a: 'a !coords' } });
  clearProgress();

  expect(store.saved).toHaveLength(3);
  expect(store.saved[1]?.C4H10O).toStrictEqual({
    found: ['a'],
    drawings: { a: 'a !coords' },
    gaveUp: false,
    hintsRevealed: 1,
  });
  expect(store.saved[2]).toStrictEqual({});
  expect(progress.byFormula.value).toStrictEqual({});
});
