import { expect, test } from 'vitest';

import { everyPage, pageMetaFor } from '../pageMeta.ts';
import { PAGE_PATHS, readPageOf } from '../pages.ts';

test('every page is an address of its own, the generator being the home page', () => {
  expect(PAGE_PATHS).toStrictEqual({
    generator: '/',
    exercises: '/exercises',
    fragments: '/fragments',
    news: '/news',
  });
});

test('an address opens the page it names', () => {
  expect(readPageOf('/')).toBe('generator');
  expect(readPageOf('/exercises')).toBe('exercises');
  expect(readPageOf('/fragments')).toBe('fragments');
  expect(readPageOf('/news')).toBe('news');
});

test('an address the site does not know opens the generator', () => {
  expect(readPageOf('/nowhere')).toBe('generator');
  expect(readPageOf('')).toBe('generator');
});

test('every page is titled and described on its own', () => {
  const pages = everyPage();

  expect(pages).toHaveLength(4);
  expect(new Set(pages.map((page) => page.title)).size).toBe(4);
  expect(new Set(pages.map((page) => page.description)).size).toBe(4);
  expect(pages.map((page) => page.canonicalPath)).toStrictEqual([
    '/',
    '/exercises',
    '/fragments',
    '/news',
  ]);

  for (const page of pages) {
    expect(page.description.length).toBeGreaterThan(60);
  }
});

test('what the page is working on is never a page of its own', () => {
  // A formula, a set of exercises and a share configuration ride in the query;
  // the canonical address is the page holding them.
  expect(pageMetaFor(readPageOf('/exercises')).canonicalPath).toBe(
    '/exercises',
  );
  expect(pageMetaFor(readPageOf('/')).canonicalPath).toBe('/');
});

test('the generator is described by what somebody would search for', () => {
  const meta = pageMetaFor('generator');

  expect(meta.title).toBe('Every constitutional isomer of a molecular formula');
  expect(meta.description).toContain('constitutional isomer');
});
