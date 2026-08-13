import { Molecule } from 'openchemlib';
import { afterAll, beforeAll, expect, test } from 'vitest';

import { buildApp } from '../app.ts';
import { enumerate } from '../exercises/answerSet.ts';
import type { FastifyTyped } from '../types.ts';

let app: FastifyTyped;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

/** What a structure editor hands over: the idCode and its coordinates. */
function drawn(smiles: string): string {
  const molecule = Molecule.fromSmiles(smiles);
  molecule.inventCoordinates();
  const { idCode, coordinates } = molecule.getIDCodeAndCoordinates();
  return `${idCode} ${coordinates}`;
}

test('GET /v1/exercises describes the shipped set', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/exercises' });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.id).toBe('structural-isomers');
  expect(body.exercises).toHaveLength(23);
  expect(body.exercises[0]).toStrictEqual({
    mf: 'C5H12',
    level: 'beginner',
    count: 3,
  });
  const c4h8o = body.exercises.find(
    (exercise: { mf: string }) => exercise.mf === 'C4H8O',
  );
  expect(c4h8o).toStrictEqual({ mf: 'C4H8O', level: 'advanced', count: 26 });
});

test('GET /v1/exercises builds the set a teacher named in the address', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/exercises?mf=C4H10O,%20C3H8',
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().exercises).toStrictEqual([
    { mf: 'C4H10O', level: 'intermediate', count: 7 },
    { mf: 'C3H8', level: 'beginner', count: 1 },
  ]);
  expect(response.json().skipped).toStrictEqual([]);
});

test('GET /v1/exercises drops a formula nobody could draw, and keeps the rest', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/exercises?mf=C4H10O,C6H10O',
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().exercises).toStrictEqual([
    { mf: 'C4H10O', level: 'intermediate', count: 7 },
  ]);
  expect(response.json().skipped).toStrictEqual([
    {
      mf: 'C6H10O',
      reason: 'C6H10O has more than 500 isomers, which is too many to draw',
    },
  ]);
});

test('GET /v1/exercises/:mf gives the count and the hints, never the answers', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/exercises/C4H10O',
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.mf).toBe('C4H10O');
  expect(body.count).toBe(7);
  expect(body.hints).toHaveLength(4);
  expect(response.body).not.toContain('CCOCC');
});

test('POST /v1/exercises/:mf/hints opens on the formula, then names what has not been drawn yet', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/exercises/C4H10O/hints',
    payload: { found: [] },
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.mf).toBe('C4H10O');
  expect(
    body.hints.slice(0, 4).map((hint: { kind: string }) => hint.kind),
  ).toStrictEqual(['general', 'general', 'general', 'general']);
  expect(body.hints[1].text).toBe('With oxygen, look for alcohols and ethers.');
  expect(body.hints[4]).toStrictEqual({
    id: 'alcohol',
    kind: 'missing',
    text: '4 answers hold a hydroxyl group, and none of yours does. The simplest thing an oxygen does is carry a hydrogen and hang off a carbon.',
  });
});

test('a family every answer of which was drawn is no longer offered', async () => {
  const { fragmentsByIDCode } = await enumerate('C4H10O');
  const alcohols: string[] = [];
  for (const [idCode, fragments] of fragmentsByIDCode) {
    if (fragments.includes('alcohol')) alcohols.push(idCode);
  }
  expect(alcohols).toHaveLength(4);

  const response = await app.inject({
    method: 'POST',
    url: '/v1/exercises/C4H10O/hints',
    payload: { found: alcohols },
  });

  const body = response.json();
  const general = body.hints.filter(
    (hint: { kind: string }) => hint.kind === 'general',
  );
  expect(
    general.map((hint: { text: string }) => hint.text).join(' '),
  ).toContain('With oxygen, look for ethers.');
  expect(
    body.hints.every(
      (hint: { text: string }) => !hint.text.includes('a hydroxyl group'),
    ),
  ).toBe(true);
});

test('POST /v1/exercises/:mf/hints counts out what was only half explored', async () => {
  const answers = await app.inject({
    method: 'GET',
    url: '/v1/exercises/C4H10O/answers',
  });
  const alcohols = answers
    .json()
    .answers.filter((answer: { smiles: string }) => answer.smiles.includes('O'))
    .slice(0, 1)
    .map((answer: { idCode: string }) => answer.idCode);

  const response = await app.inject({
    method: 'POST',
    url: '/v1/exercises/C4H10O/hints',
    payload: { found: alcohols },
  });

  const body = response.json();
  expect(
    body.hints.some((hint: { kind: string }) => hint.kind === 'partial'),
  ).toBe(true);
  expect(
    body.hints.every(
      (hint: { text: string }) => !hint.text.includes('undefined'),
    ),
  ).toBe(true);
});

test('a student who found every isomer is told there is nothing left to look for', async () => {
  const answers = await app.inject({
    method: 'GET',
    url: '/v1/exercises/C4H10O/answers',
  });
  const found = answers
    .json()
    .answers.map((answer: { idCode: string }) => answer.idCode);

  const response = await app.inject({
    method: 'POST',
    url: '/v1/exercises/C4H10O/hints',
    payload: { found },
  });

  expect(response.json().hints).toHaveLength(1);
  expect(response.json().hints[0].kind).toBe('complete');
});

test('GET /v1/exercises/:mf/answers is the correction', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/exercises/C4H10O/answers',
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.count).toBe(7);
  expect(body.answers).toHaveLength(7);
  expect(
    body.answers.map((answer: { smiles: string }) => answer.smiles),
  ).toContain('CCOCC');
});

test('a drawn isomer is accepted', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/exercises/C4H10O/check',
    payload: { idCode: drawn('CCOCC') },
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toStrictEqual({
    correct: true,
    reason: 'correct',
    idCode: 'gJQ@@eKU@@',
    mf: 'C4H10O',
  });
});

test('a structure with another formula is refused, and told which one it is', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/exercises/C4H10O/check',
    payload: { idCode: drawn('CCCO') },
  });

  expect(response.json()).toStrictEqual({
    correct: false,
    reason: 'wrong-formula',
    idCode: 'gCa@@dmP@',
    mf: 'C3H8O',
  });
});

test('a structure of the right formula that surge does not generate is refused', async () => {
  // A charged structure has the right atoms but is not a constitutional isomer
  // surge would ever write.
  const response = await app.inject({
    method: 'POST',
    url: '/v1/exercises/C2H7N/check',
    payload: { idCode: drawn('C[NH3+]') },
  });

  const body = response.json();
  expect(body.correct).toBe(false);
  expect(body.reason).toBe('wrong-formula');
});

test('an exercise with too many isomers is refused rather than served', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/exercises/C10H16O',
  });

  expect(response.statusCode).toBe(400);
  expect(response.json().message).toBe(
    'C10H16O has more than 500 isomers, which is too many to draw',
  );
});

test('a fractional timeout is accepted, not rejected by spawn', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/generate?mf=C5H12&timeout=2.5',
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().found).toBe(3);
});

test('a structure holding an atom surge never builds is refused, not fatal', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/exercises/C4H10O/check',
    payload: { idCode: drawn('CC[Si](C)C') },
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.correct).toBe(false);
  expect(body.reason).toBe('wrong-formula');
  expect(body.mf).toBe('C4H11Si');
});

test('an idCode that is not one is a 400, not a 500', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/exercises/C4H10O/check',
    payload: { idCode: 'certainly not an idCode' },
  });

  expect(response.statusCode).toBe(400);
  expect(response.json().message).toBe('That structure could not be read');
});
