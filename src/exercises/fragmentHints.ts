import type { FragmentDefinition } from '../chemistry/fragments/index.ts';
import {
  FRAGMENTS,
  fragmentLabel,
  fragmentMissing,
  fragmentPartial,
} from '../chemistry/fragments/index.ts';
import type { Language } from '../i18n/messages.ts';
import { translate } from '../i18n/messages.ts';

/** How often one motif appears, on each side of the exercise. */
export interface FragmentCount {
  /** Answers holding the motif. */
  answers: number;
  /** Structures the student found that hold it. */
  found: number;
}

export interface ProgressHint {
  /** Fragment the hint is about, empty when it is about the whole exercise. */
  id: string;
  kind: 'general' | 'missing' | 'partial' | 'complete';
  text: string;
}

/** A ladder nobody climbs is not a ladder. */
const MAX_MISSING = 5;
const MAX_PARTIAL = 3;

/**
 * Turn a comparison of the answers with what the student found into hints,
 * the motif they have not touched at all coming before the one they have
 * only half explored.
 * @param counts - How often each motif appears on each side.
 * @param language - Language the hints are written in.
 * @returns The hints, most useful first.
 */
export function buildFragmentHints(
  counts: Map<string, FragmentCount>,
  language: Language,
): ProgressHint[] {
  const missing: Array<{ fragment: FragmentDefinition; count: FragmentCount }> =
    [];
  const partial: Array<{ fragment: FragmentDefinition; count: FragmentCount }> =
    [];

  for (const fragment of FRAGMENTS) {
    const count = counts.get(fragment.id);
    if (!count || count.answers === 0) continue;
    // A motif nobody has reached yet is described by its parent, not by its
    // own detail: there is no point naming the nitrogen of a ring that has
    // not been drawn.
    if (fragment.parent && (counts.get(fragment.parent)?.found ?? 0) === 0) {
      continue;
    }
    if (count.found === 0) missing.push({ fragment, count });
    else if (count.found < count.answers) partial.push({ fragment, count });
  }

  missing.sort((a, b) => b.count.answers - a.count.answers);
  partial.sort(
    (a, b) =>
      b.count.answers - b.count.found - (a.count.answers - a.count.found),
  );

  const hints: ProgressHint[] = [];
  for (const { fragment, count } of missing.slice(0, MAX_MISSING)) {
    hints.push({
      id: fragment.id,
      kind: 'missing',
      text: translate('ui.hint.missing', language, {
        values: {
          holders: holders(count.answers, language),
          label: fragmentLabel(fragment, language),
          nudge: fragmentMissing(fragment, language),
        },
      }),
    });
  }
  for (const { fragment, count } of partial.slice(0, MAX_PARTIAL)) {
    hints.push({
      id: fragment.id,
      kind: 'partial',
      text: translate('ui.hint.partial', language, {
        values: {
          found: count.found,
          answers: count.answers,
          label: fragmentLabel(fragment, language),
          nudge: fragmentPartial(fragment, language),
        },
      }),
    });
  }

  if (hints.length === 0 && isEveryMotifFound(counts)) {
    hints.push({
      id: '',
      kind: 'complete',
      text: translate('ui.hint.complete', language),
    });
  }
  return hints;
}

function isEveryMotifFound(counts: Map<string, FragmentCount>): boolean {
  for (const count of counts.values()) {
    if (count.answers > 0 && count.found > 0) return true;
  }
  return false;
}

/**
 * How many answers hold a motif, as the sentence reads it.
 *
 * The two forms are two keys rather than one ICU plural: outside translate
 * mode the site fills placeholders itself and does not carry a plural
 * formatter. A language needing more than one and other wants that formatter.
 */
function holders(answers: number, language: Language): string {
  return answers === 1
    ? translate('ui.hint.holders.one', language)
    : translate('ui.hint.holders.other', language, {
        values: { count: answers },
      });
}
