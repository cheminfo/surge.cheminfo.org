/**
 * The language switch.
 *
 * Every word the site shows is in the catalogs of `src/locales`, one per
 * language, so switching rewrites the page — the hints a student is given
 * included, which are built in the worker and asked for again in the new
 * language.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import type { HeaderToggleOption } from 'react-cheminfo/ui';
import { HeaderToggle } from 'react-cheminfo/ui';

import type { Language } from '../i18n/messages.ts';
import { LANGUAGES, LANGUAGE_LABELS } from '../i18n/messages.ts';
import { useT } from '../i18n/useT.ts';
import { preferences, setLanguage } from '../state/language.ts';

/** Props of {@link LanguageSelect}. */
export interface LanguageSelectProps {
  /**
   * Whether the bar has run out of room, so the languages collapse to the one
   * in force.
   * @default false
   */
  compact?: boolean;
}

/**
 * The languages, the one the site is written in pressed.
 * @param props - See {@link LanguageSelectProps}.
 * @returns The toggle.
 */
export default function LanguageSelect(
  props: LanguageSelectProps,
): ReactElement {
  useSignals();
  const t = useT();

  return (
    <HeaderToggle
      label={t('ui.language')}
      options={LANGUAGE_OPTIONS}
      value={preferences.language.value}
      onChange={setLanguage}
      compact={props.compact}
      testId="language-select"
    />
  );
}

// A language names itself: the tag is the mark in the bar, and the name behind
// it is written the way its own speakers write it, never translated.
const LANGUAGE_OPTIONS: ReadonlyArray<HeaderToggleOption<Language>> =
  LANGUAGES.map((language) => ({
    value: language,
    label: language.toUpperCase(),
    title: LANGUAGE_LABELS[language],
  }));
