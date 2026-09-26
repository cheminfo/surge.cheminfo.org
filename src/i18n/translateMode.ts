/**
 * Translating this site in place.
 *
 * A page opened with `?translate=<locale>` formats every message through a
 * session that marks it invisibly, hands that session to the overlay
 * translate.cheminfo.org serves, and re-renders whenever an edit is typed. An
 * ordinary visit loads none of it: the module carrying the session and its ICU
 * formatter is fetched only once the parameter has been seen.
 */

import { signal } from '@preact/signals-react';

import de from '../locales/de.json' with { type: 'json' };
import en from '../locales/en.json' with { type: 'json' };
import es from '../locales/es.json' with { type: 'json' };
import fr from '../locales/fr.json' with { type: 'json' };

import { CATALOGS, TRANSLATABLE_TABLES } from './catalog.ts';
import { SITE_CATALOG_ID, setTranslateSession } from './messages.ts';

/** Changes on every edit a translator types, so the page redraws with it. */
export const translateVersion = signal(0);

const PUBLISHED: Readonly<Record<string, Record<string, string>>> = {
  en,
  fr,
  de,
  es,
};

/**
 * Put the page into translate mode when its address asks for it.
 * @param search - The query string, e.g. `location.search`.
 * @returns The locale being translated into, or `undefined` when the address
 * does not ask for translate mode.
 */
export async function startTranslateMode(
  search: string,
): Promise<string | undefined> {
  // Answered before anything is fetched: an ordinary visit must not pay for
  // the formatter and the checks that only a translator uses. The name is
  // `react-cheminfo/translate`'s TRANSLATE_PARAM, written out because
  // importing it is the very thing being avoided.
  if (!new URLSearchParams(search).has('translate')) return undefined;

  const { readTranslateLocale, startTranslating } =
    await import('react-cheminfo/translate');
  const locale = readTranslateLocale(search);
  if (locale === undefined) return undefined;

  const published = PUBLISHED[locale];
  const session = startTranslating({
    locale,
    catalogs: CATALOGS,
    tables: TRANSLATABLE_TABLES,
    translations:
      published === undefined ? {} : { [SITE_CATALOG_ID]: published },
    origin: import.meta.env.VITE_TRANSLATE_ORIGIN,
  });

  setTranslateSession(session);
  session.subscribe(() => {
    translateVersion.value++;
  });
  translateVersion.value++;
  return locale;
}
