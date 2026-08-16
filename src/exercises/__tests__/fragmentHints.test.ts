import { expect, test } from 'vitest';

import type { FragmentCount } from '../fragmentHints.ts';
import { buildFragmentHints } from '../fragmentHints.ts';

/**
 * Build the counts of an exercise from the motifs that matter to it, every
 * other motif being absent from its answers.
 * @param entries - Motif, how many answers hold it, how many were found.
 * @returns The counts, as the service hands them over.
 */
function counts(
  entries: Array<[string, number, number]>,
): Map<string, FragmentCount> {
  return new Map(
    entries.map(([id, answers, found]) => [id, { answers, found }]),
  );
}

test('a motif nobody drew is reported, most represented first', () => {
  const hints = buildFragmentHints(
    counts([
      ['ring-3', 7, 0],
      ['alkene', 12, 0],
    ]),
  );

  expect(hints).toHaveLength(2);
  expect(hints[0]?.id).toBe('alkene');
  expect(hints[0]?.kind).toBe('missing');
  expect(hints[0]?.text).toContain(
    '12 answers hold a carbon-carbon double bond, and none of yours does.',
  );
  expect(hints[1]?.text).toContain('7 answers hold a three-membered ring');
});

test('a single answer is spoken of in the singular', () => {
  const hints = buildFragmentHints(counts([['ring-5', 1, 0]]));

  expect(hints[0]?.text).toContain(
    'One answer holds a five-membered ring, and none of yours does.',
  );
});

test('a motif that is only half explored is counted out', () => {
  const hints = buildFragmentHints(counts([['ether', 8, 3]]));

  expect(hints).toHaveLength(1);
  expect(hints[0]?.kind).toBe('partial');
  expect(hints[0]?.text).toContain(
    'You have 3 of the 8 answers that hold an ether.',
  );
});

test('what was never drawn comes before what was only half explored', () => {
  const hints = buildFragmentHints(
    counts([
      ['ether', 8, 3],
      ['ring-3', 2, 0],
    ]),
  );

  expect(hints.map((hint) => hint.kind)).toStrictEqual(['missing', 'partial']);
});

test('a motif nothing in the answers holds is never mentioned', () => {
  expect(buildFragmentHints(counts([['nitrile', 0, 0]]))).toStrictEqual([]);
});

test('the detail of a motif waits until the motif itself has been found', () => {
  const withoutTheRing = buildFragmentHints(
    counts([
      ['ring-3', 4, 0],
      ['ring-3-oxygen', 2, 0],
    ]),
  );
  expect(withoutTheRing.map((hint) => hint.id)).toStrictEqual(['ring-3']);

  const withTheRing = buildFragmentHints(
    counts([
      ['ring-3', 4, 1],
      ['ring-3-oxygen', 2, 0],
    ]),
  );
  expect(withTheRing.map((hint) => hint.id)).toStrictEqual([
    'ring-3-oxygen',
    'ring-3',
  ]);
});

test('the ladder stays short enough to be climbed', () => {
  const hints = buildFragmentHints(
    counts([
      ['ring-3', 9, 0],
      ['ring-4', 8, 0],
      ['ring-5', 7, 0],
      ['ring-6', 6, 0],
      ['alkene', 5, 0],
      ['alkyne', 4, 0],
      ['alcohol', 3, 0],
      ['ether', 12, 2],
      ['ketone', 11, 2],
      ['aldehyde', 10, 2],
      ['thiol', 9, 2],
    ]),
  );

  expect(hints.filter((hint) => hint.kind === 'missing')).toHaveLength(5);
  expect(hints.filter((hint) => hint.kind === 'partial')).toHaveLength(3);
});

test('a student who has covered every motif is told so', () => {
  const hints = buildFragmentHints(
    counts([
      ['alkene', 4, 4],
      ['ether', 2, 2],
    ]),
  );

  expect(hints).toStrictEqual([
    {
      id: '',
      kind: 'complete',
      text: 'Every motif your structures show is already complete. What is left is the same chemistry on another skeleton, or the same group on another carbon.',
    },
  ]);
});

test('an exercise whose answers hold no motif at all says nothing', () => {
  expect(buildFragmentHints(counts([]))).toStrictEqual([]);
});
