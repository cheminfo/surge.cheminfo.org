import type { FragmentCategory } from '../chemistry/fragments/index.ts';
import { FRAGMENTS } from '../chemistry/fragments/index.ts';

import type { FragmentCount } from './fragmentHints.ts';

/**
 * What the student has already drawn every answer of. Telling them to look for
 * rings once they hold every cyclic answer sends them after structures they
 * already have, so a hint about something exhausted is dropped rather than
 * repeated.
 */
export interface HintCoverage {
  /** Whether every answer holding that motif has been found. */
  motif: (id: string) => boolean;
  /** Whether every answer holding any motif of that category has been found. */
  topic: (category: FragmentCategory) => boolean;
}

/** Nothing found yet, so nothing is covered — the ladder an exercise opens on. */
export const NO_COVERAGE: HintCoverage = {
  motif: () => false,
  topic: () => false,
};

/**
 * Read what is exhausted off the comparison of the answers with what was found.
 * A motif the answers never hold is never exhausted: it was never on offer, so
 * saying nothing about it would hide what the formula allows.
 * @param counts - How often each motif appears on each side.
 * @returns The two questions a hint asks before it is written.
 */
export function buildCoverage(
  counts: Map<string, FragmentCount>,
): HintCoverage {
  const isDone = (id: string): boolean => {
    const count = counts.get(id);
    return (
      count !== undefined && count.answers > 0 && count.found >= count.answers
    );
  };

  const topics = new Map<FragmentCategory, boolean>();
  for (const fragment of FRAGMENTS) {
    const count = counts.get(fragment.id);
    if (!count || count.answers === 0) continue;
    const done = count.found >= count.answers;
    topics.set(
      fragment.category,
      (topics.get(fragment.category) ?? true) && done,
    );
  }

  return { motif: isDone, topic: (category) => topics.get(category) ?? false };
}
