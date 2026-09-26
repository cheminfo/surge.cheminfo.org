/**
 * The text of the site, in every language it is written in.
 *
 * One flat catalog per language in `src/locales`, from key to text: the
 * interface, the motifs a structure is looked at for, and what an exercise
 * set says it wants. English is the source of truth, and a key a translation
 * does not carry falls back to it — a language half filled in is a page partly
 * in English rather than a page of raw keys.
 */

import de from '../locales/de.json' with { type: 'json' };
import en from '../locales/en.json' with { type: 'json' };
import es from '../locales/es.json' with { type: 'json' };
import fr from '../locales/fr.json' with { type: 'json' };

/**
 * The name this page knows its own catalog by, and which a translator's edit
 * is routed back to the repository with.
 */
export const SITE_CATALOG_ID = 'surge.cheminfo.org';

/** The languages the site is written in. */
export const LANGUAGES = ['en', 'fr', 'de', 'es'] as const;

/** One of {@link LANGUAGES}. */
export type Language = (typeof LANGUAGES)[number];

/**
 * The language the catalogs are written in first, and the one a site of the
 * family opens in: an address naming it carries nothing, a translation
 * missing a key falls back to it.
 */
export const DEFAULT_LANGUAGE: Language = 'en';

/** What the language switch writes in each entry, in that language itself. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
};

/** Every key the English catalog defines. */
export type MessageKey = keyof typeof en;

/** What a message's placeholders are filled with. */
export type MessageValues = Record<string, string | number>;

/** How a key is resolved when the catalogs do not carry it, and with what. */
export interface TranslateOptions {
  /**
   * What to return when neither the language nor English carries the key.
   * @default the key itself
   */
  fallback?: string;
  /**
   * What each `{placeholder}` of the message stands for.
   * @default undefined
   */
  values?: MessageValues;
}

const CATALOGS: Record<Language, Readonly<Record<string, string>>> = {
  en,
  fr,
  de,
  es,
};

/** What {@link setTranslateSession} needs of a session. */
export interface MessageSession {
  format: (catalogId: string, key: string, values?: MessageValues) => string;
}

let session: MessageSession | null = null;

/**
 * The text a key carries in one language.
 *
 * The key is a plain string rather than a {@link MessageKey} because many are
 * built from the data — `fragment.alcohol.label` — so a motif added before
 * the catalogs have caught up reads as its English rather than throwing.
 * @param key - Key to read.
 * @param language - Language to read it in.
 * @param options - See {@link TranslateOptions}.
 * @returns The text.
 */
export function translate(
  key: string,
  language: Language,
  options: TranslateOptions = {},
): string {
  const { fallback = key, values } = options;
  if (session !== null) {
    if (own(en, key) === undefined) return fallback;
    return session.format(SITE_CATALOG_ID, key, values);
  }
  const message = own(CATALOGS[language], key) ?? own(en, key) ?? fallback;
  return values === undefined ? message : fill(message, values);
}

/**
 * Format every message through a translator's session from now on.
 *
 * While one is set it is the session's locale that the page is written in,
 * not the visitor's preference, and every message carries the invisible marker
 * the overlay finds it by.
 * @param active - The session, or `null` to go back to the catalogs.
 */
export function setTranslateSession(active: MessageSession | null): void {
  session = active;
}

/**
 * Whether a string is one of the languages the site is written in.
 * @param value - Candidate code, typically a URL query value.
 * @returns True when the site has a catalog for it.
 */
export function isLanguage(value: string): value is Language {
  for (const language of LANGUAGES) {
    if (language === value) return true;
  }
  return false;
}

/** A catalog's own message, never one inherited from `Object.prototype`. */
function own(
  catalog: Readonly<Record<string, string>>,
  key: string,
): string | undefined {
  return Object.hasOwn(catalog, key) ? catalog[key] : undefined;
}

/**
 * A message with its placeholders filled in.
 *
 * Only the simple `{name}` argument of ICU MessageFormat is understood, which
 * is all any message here uses; a plural or a select would need the formatter
 * itself, which is what translate mode loads.
 */
function fill(message: string, values: MessageValues): string {
  return message.replaceAll(/\{(?<name>\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}
