import { expect, test } from 'vitest';

import { CATEGORY_NUDGE, FRAGMENTS } from '../../chemistry/fragments/index.ts';
import { DEFAULT_EXERCISE_SET } from '../../exercises/defaultSet.ts';
import de from '../../locales/de.json' with { type: 'json' };
import en from '../../locales/en.json' with { type: 'json' };
import es from '../../locales/es.json' with { type: 'json' };
import fr from '../../locales/fr.json' with { type: 'json' };
import { LANGUAGES, isLanguage, translate } from '../messages.ts';

const CATALOGS: Record<string, Record<string, string>> = { en, fr, de, es };

test('the site is written in four languages', () => {
  expect(LANGUAGES).toStrictEqual(['en', 'fr', 'de', 'es']);
  expect(Object.keys(CATALOGS)).toStrictEqual([...LANGUAGES]);
});

test('every motif carries its English in the catalog, field by field', () => {
  expect(FRAGMENTS).toHaveLength(55);
  const missing: string[] = [];
  for (const fragment of FRAGMENTS) {
    for (const field of ['label', 'description', 'missing']) {
      const key = `fragment.${fragment.id}.${field}`;
      if (!(key in en)) missing.push(key);
    }
    if (fragment.partial !== undefined) {
      const key = `fragment.${fragment.id}.partial`;
      if (!(key in en)) missing.push(key);
    }
  }
  expect(missing).toStrictEqual([]);
});

test('the English in the catalog is the English in the definitions', () => {
  const drifted: string[] = [];
  const messages = en as Record<string, string>;
  for (const fragment of FRAGMENTS) {
    if (messages[`fragment.${fragment.id}.label`] !== fragment.label) {
      drifted.push(`${fragment.id}.label`);
    }
    if (messages[`fragment.${fragment.id}.missing`] !== fragment.missing) {
      drifted.push(`${fragment.id}.missing`);
    }
  }
  for (const [category, nudge] of Object.entries(CATEGORY_NUDGE)) {
    if (messages[`fragmentCategory.${category}.nudge`] !== nudge) {
      drifted.push(category);
    }
  }
  expect(drifted).toStrictEqual([]);
});

test('the exercise set says what it wants, in the catalog', () => {
  expect(en).toHaveProperty(
    `exerciseSet.${DEFAULT_EXERCISE_SET.id}.title`,
    DEFAULT_EXERCISE_SET.title,
  );
  expect(en).toHaveProperty(
    `exerciseSet.${DEFAULT_EXERCISE_SET.id}.description`,
    DEFAULT_EXERCISE_SET.description,
  );
});

test('the interface is written in every language', () => {
  const keys = Object.keys(en).filter((key) => key.startsWith('ui.'));
  expect(keys.length).toBeGreaterThan(60);
  for (const language of LANGUAGES) {
    const catalog = CATALOGS[language] as Record<string, string>;
    expect(keys.filter((key) => !(key in catalog))).toStrictEqual([]);
  }
});

test('a translation never invents a key English does not carry', () => {
  for (const language of LANGUAGES) {
    const catalog = CATALOGS[language] as Record<string, string>;
    expect(Object.keys(catalog).filter((key) => !(key in en))).toStrictEqual(
      [],
    );
  }
});

test('no message is left empty', () => {
  for (const language of LANGUAGES) {
    const catalog = CATALOGS[language] as Record<string, string>;
    const empty = Object.entries(catalog)
      .filter(([, message]) => message.trim() === '')
      .map(([key]) => key);
    expect(empty).toStrictEqual([]);
  }
});

test('a motif nobody has translated yet reads as its English', () => {
  expect(translate('fragment.alcohol.label', 'de')).toBe('a hydroxyl group');
  expect(translate('ui.tab.exercises', 'de')).toBe('Übungen');
});

test('a placeholder is filled from the values given', () => {
  expect(
    translate('ui.hint.holders.other', 'fr', { values: { count: 7 } }),
  ).toBe('7 réponses contiennent');
});

test('only the four languages are accepted', () => {
  expect(isLanguage('de')).toBe(true);
  expect(isLanguage('it')).toBe(false);
});
