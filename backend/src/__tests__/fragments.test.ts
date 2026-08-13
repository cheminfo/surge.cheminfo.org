import { afterAll, beforeAll, expect, test } from 'vitest';

import { buildApp } from '../app.ts';
import { FRAGMENTS } from '../chemistry/fragments/index.ts';
import type { FastifyTyped } from '../types.ts';

let app: FastifyTyped;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

test('GET /v1/fragments serves the whole library, queries included', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/fragments' });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.count).toBe(FRAGMENTS.length);
  expect(body.fragments).toHaveLength(FRAGMENTS.length);
  expect(body.fragments[0]).toStrictEqual({
    id: 'ring-3',
    label: 'a three-membered ring',
    category: 'ring',
    description: 'Any atom sitting in a ring of three atoms',
    idCodes: ['fH@Mk}y@'],
    missing:
      'Three atoms close a strained but perfectly stable ring, and what is left of the formula hangs off it.',
    partial: 'The same small ring carries its substituents in several ways.',
  });
});

test('a motif with no sentence of its own falls back to the one of its category', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/fragments' });

  const allene = response
    .json()
    .fragments.find((fragment: { id: string }) => fragment.id === 'allene');
  expect(allene.partial).toBe(
    'The same multiple bond sits at more than one place of the skeleton.',
  );
});

test('GET /v1/fragments/usage counts the isomers of a formula holding each motif', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/fragments/usage?mf=C4H10O',
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.mf).toBe('C4H10O');
  expect(body.count).toBe(7);

  const usage = new Map<string, number>(
    body.usage.map((entry: { id: string; answers: number }) => [
      entry.id,
      entry.answers,
    ]),
  );
  expect(usage.get('alcohol')).toBe(4);
  expect(usage.get('alcohol-primary')).toBe(2);
  expect(usage.get('alcohol-secondary')).toBe(1);
  expect(usage.get('alcohol-tertiary')).toBe(1);
  expect(usage.get('ether')).toBe(3);
  expect(usage.get('ring-3')).toBe(0);
});

test('a motif found in a formula comes with one structure showing it', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/fragments/usage?mf=C4H10O',
  });

  const tertiary = response
    .json()
    .usage.find((entry: { id: string }) => entry.id === 'alcohol-tertiary');
  expect(tertiary).toStrictEqual({
    id: 'alcohol-tertiary',
    answers: 1,
    example: 'gJQ@@duU@@',
  });
});
