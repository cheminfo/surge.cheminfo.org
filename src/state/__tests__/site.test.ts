import { afterEach, expect, test, vi } from 'vitest';

import { configuredSiteUrl } from '../sitePath.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/**
 * The site as a deployment stamped it, loaded fresh so its mount is read again.
 * @param baseUri - What `document.baseURI` reads on the page handed out.
 * @returns The module, bound to that mount.
 */
async function siteMountedAt(baseUri: string) {
  vi.stubGlobal('document', { baseURI: baseUri });
  vi.resetModules();
  return import('../site.ts');
}

test('a deployment on a host of its own writes its addresses unchanged', async () => {
  const site = await siteMountedAt('https://surge.cheminfo.org/');

  expect(site.BASE_PATH).toBe('');
  expect(site.withBase('/')).toBe('/');
  expect(site.withBase('/exercises')).toBe('/exercises');
  expect(site.pathWithoutBase('/exercises')).toBe('/exercises');
});

test('a deployment mounted under a path writes every address under it', async () => {
  const site = await siteMountedAt('https://www.cheminfo.org/surge/');

  expect(site.BASE_PATH).toBe('/surge');
  expect(site.withBase('/')).toBe('/surge/');
  expect(site.withBase('/exercises')).toBe('/surge/exercises');
  expect(site.pathWithoutBase('/surge/exercises')).toBe('/exercises');
  expect(site.pathWithoutBase('/surge')).toBe('/');
});

test('the same build serves both addresses, because the mount is not built in', async () => {
  const own = await siteMountedAt('https://surge.cheminfo.org/');
  const shared = await siteMountedAt('https://www.cheminfo.org/surge/');

  expect(own.withBase('/fragments')).toBe('/fragments');
  expect(shared.withBase('/fragments')).toBe('/surge/fragments');
});

test('every page survives the round trip under a mount', async () => {
  const site = await siteMountedAt('https://www.cheminfo.org/surge/');
  for (const path of ['/', '/exercises', '/fragments', '/news']) {
    expect(site.pathWithoutBase(site.withBase(path))).toBe(path);
  }
});

test('a page of another tool on the shared host is not read as one of ours', async () => {
  const site = await siteMountedAt('https://www.cheminfo.org/surge/');

  expect(site.pathWithoutBase('/tex/tutorial')).toBe('/tex/tutorial');
  expect(site.pathWithoutBase('/surgeon')).toBe('/surgeon');
});

test('the published address is the default until the build is told another', () => {
  expect(configuredSiteUrl()).toBe('https://surge.cheminfo.org/');

  vi.stubGlobal('process', { env: { SITE_URL: 'https://example.org/surge/' } });

  expect(configuredSiteUrl()).toBe('https://example.org/surge/');
});
