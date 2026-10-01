import type { Language } from 'react-cheminfo/core';
import {
  LANGUAGES,
  pageDocumentMeta,
  pageMetaFor,
  readLanguagePath,
  routeProblems,
  withLanguagePath,
} from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { PAGE_PATHS, readPageOf } from '../../state/pages.ts';
import { PAGE_ROUTES, routesFor } from '../routes.ts';

const ORIGIN = 'https://surge.cheminfo.org';

test('every page is an address of its own, the generator being the home page', () => {
  expect(PAGE_PATHS).toStrictEqual({
    generator: '/',
    exercises: '/exercises',
    fragments: '/fragments',
    about: '/about',
  });
});

test('an address opens the page it names', () => {
  expect(readPageOf('/')).toBe('generator');
  expect(readPageOf('/exercises')).toBe('exercises');
  expect(readPageOf('/fragments')).toBe('fragments');
  expect(readPageOf('/about')).toBe('about');
});

test('a prefixed address opens the same page', () => {
  expect(readPageOf('/fr')).toBe('generator');
  expect(readPageOf('/fr/')).toBe('generator');
  expect(readPageOf('/de/exercises')).toBe('exercises');
  expect(readPageOf('/es/fragments')).toBe('fragments');
  expect(readPageOf('/it/about')).toBe('about');
});

test('an address the site does not know opens the generator', () => {
  expect(readPageOf('/nowhere')).toBe('generator');
  expect(readPageOf('/fr/nowhere')).toBe('generator');
  expect(readPageOf('')).toBe('generator');
});

test('a language the site does not speak is a page name, not a prefix', () => {
  // `/pt/exercises` is an address this site does not answer, so it opens the
  // generator rather than a Portuguese exercises page nobody wrote.
  expect(readPageOf('/pt/exercises')).toBe('generator');
});

test('the address of every page round-trips in every language', () => {
  for (const language of LANGUAGES) {
    for (const path of Object.values(PAGE_PATHS)) {
      const written = withLanguagePath(language, path);
      expect(readLanguagePath(written, LANGUAGES)).toStrictEqual({
        language,
        path,
      });
    }
  }
  // English writes no prefix at all, so every link handed out before the site
  // was translated still points at the page it named.
  expect(withLanguagePath('en', '/exercises')).toBe('/exercises');
  expect(withLanguagePath('fr', '/')).toBe('/fr');
});

test('every page is titled and described on its own, in every language', () => {
  for (const language of LANGUAGES) {
    const pages = routesFor(language);

    expect(pages).toHaveLength(4);
    expect(new Set(pages.map((page) => page.title)).size).toBe(4);
    expect(new Set(pages.map((page) => page.description)).size).toBe(4);
    expect(routeProblems(pages)).toStrictEqual([]);
  }
});

test('an address is never translated', () => {
  const paths = ['/', '/exercises', '/fragments', '/about'];
  for (const language of LANGUAGES) {
    expect(routesFor(language).map((page) => page.path)).toStrictEqual(paths);
  }
});

test('what the page is working on is never a page of its own', () => {
  // A formula, a set of exercises and a share configuration ride in the query;
  // the canonical address is the page holding them.
  expect(pageMetaFor(PAGE_ROUTES, '/exercises?formulas=C4H10O').path).toBe(
    '/exercises',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/?mf=C5H12').path).toBe('/');
});

test('the generator is described by what somebody would search for', () => {
  const meta = pageMetaFor(PAGE_ROUTES, '/');

  expect(meta.title).toBe('Every constitutional isomer of a molecular formula');
  expect(meta.description).toContain('constitutional isomer');
});

test('each language of the exercises page is indexed under its own words', () => {
  expect(metaOf('en', '/exercises')).toStrictEqual({
    title:
      'Isomer exercises — find them yourself, then check — surge.cheminfo.org',
    description:
      'Draw the constitutional isomers of a formula yourself and have each one marked against the complete set Surge enumerates, with hints when you are stuck.',
    canonical: 'https://surge.cheminfo.org/exercises',
    language: 'en',
  });
  expect(metaOf('fr', '/exercises')).toStrictEqual({
    title:
      "Exercices d'isomérie : trouvez-les, puis vérifiez — surge.cheminfo.org",
    description:
      "Dessinez vous-même les isomères de constitution d'une formule et faites corriger chacun contre l'ensemble complet énuméré par Surge, avec des indices.",
    canonical: 'https://surge.cheminfo.org/fr/exercises',
    language: 'fr',
  });
  expect(metaOf('de', '/exercises')).toStrictEqual({
    title: 'Isomerie-Übungen: selbst finden, dann prüfen — surge.cheminfo.org',
    description:
      'Zeichnen Sie die Konstitutionsisomere einer Summenformel selbst und lassen Sie jede gegen den vollständigen Satz von Surge prüfen, mit Hinweisen.',
    canonical: 'https://surge.cheminfo.org/de/exercises',
    language: 'de',
  });
  expect(metaOf('es', '/exercises')).toStrictEqual({
    title: 'Ejercicios de isomería: búsquelos y compruebe — surge.cheminfo.org',
    description:
      'Dibuje usted mismo los isómeros constitucionales de una fórmula y corrija cada uno contra el conjunto completo que enumera Surge, con pistas si se atasca.',
    canonical: 'https://surge.cheminfo.org/es/exercises',
    language: 'es',
  });
  expect(metaOf('it', '/exercises')).toStrictEqual({
    title: 'Esercizi di isomeria: li trovi, poi verifichi — surge.cheminfo.org',
    description:
      "Disegni lei stesso gli isomeri costituzionali di una formula e faccia correggere ciascuno contro l'insieme completo enumerato da Surge, con indizi.",
    canonical: 'https://surge.cheminfo.org/it/exercises',
    language: 'it',
  });
});

test('the front page of a language is canonical to that language', () => {
  expect(metaOf('fr', '/').canonical).toBe('https://surge.cheminfo.org/fr');
  expect(metaOf('en', '/').canonical).toBe('https://surge.cheminfo.org/');
  // The query is not a page, in any language.
  expect(metaOf('de', '/exercises?formulas=C4H10O').canonical).toBe(
    'https://surge.cheminfo.org/de/exercises',
  );
});

/**
 * What the head of one address says in one language.
 * @param language - The language the page is served in.
 * @param path - The address from the site's own root, with no prefix on it.
 * @returns Its title, description, canonical address and language.
 */
function metaOf(language: Language, path: string) {
  return pageDocumentMeta({
    site: 'surge',
    routes: routesFor,
    languages: LANGUAGES,
    url: withLanguagePath(language, path),
    origin: ORIGIN,
  });
}
