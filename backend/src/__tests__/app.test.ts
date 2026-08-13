import { Molecule } from 'openchemlib';
import { afterAll, beforeAll, expect, test } from 'vitest';

import { buildApp } from '../app.ts';
import type { FastifyTyped } from '../types.ts';

let app: FastifyTyped;

beforeAll(async () => {
  app = await buildApp({ trustProxy: '192.168.1.5' });
});

afterAll(async () => {
  await app.close();
});

test('GET /v1/health reports the surge version', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/health' });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toStrictEqual({ status: 'ok', surge: '2.0' });
});

test('the Swagger UI is served at /docs', async () => {
  const response = await app.inject({ method: 'GET', url: '/docs/' });

  expect(response.statusCode).toBe(200);
  expect(response.headers['content-type']).toContain('text/html');
  expect(response.body).toContain('Swagger UI');
});

test('the Swagger UI static assets are served', async () => {
  // Regression test for fastify/fastify-static#573, which once made these
  // 404 and left the documentation page blank.
  const response = await app.inject({
    method: 'GET',
    url: '/docs/static/index.css',
  });

  expect(response.statusCode).toBe(200);
  expect(response.headers['content-type']).toContain('text/css');
});

test('the old documentation address still leads to the documentation', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/documentation',
  });

  expect(response.statusCode).toBe(302);
  expect(response.headers.location).toBe('/docs');
});

test('GET /v1/generate enumerates the isomers of a formula', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/generate?mf=C5H10&limit=3&idCode=true',
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.mf).toBe('C5H10');
  expect(body.status).toBe('complete');
  expect(body.found).toBe(10);
  expect(body.returned).toBe(3);
  expect(body.flags).toStrictEqual(['-S', '-R', 'C5H10']);
  expect(body.result[0]).toStrictEqual({
    smiles: 'CC(=C)CC',
    idCode: 'gJP@Djvh@',
  });
});

test('POST /v1/generate takes the same parameters in a JSON body', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/generate',
    payload: { mf: 'C4H10O', limit: 100 },
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.found).toBe(7);
  expect(body.returned).toBe(7);
  expect(
    body.result.map((entry: { smiles: string }) => entry.smiles),
  ).toContain('CCOCC');
});

test('a restriction reaches surge and changes the answer', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/generate?mf=C5H10&limit=100&limit3Rings=0&limit4Rings=0&limit5Rings=0',
  });

  const body = response.json();
  expect(body.flags).toStrictEqual(['-S', '-R', '-t0', '-f0', '-p0', 'C5H10']);
  // Only the five acyclic pentenes are left.
  expect(body.found).toBe(5);
});

test('a substructure filter keeps only the structures holding it', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/generate',
    payload: {
      mf: 'C5H10',
      limit: 100,
      fragmentCode: Molecule.fromSmiles('C1CC1').getIDCode(),
    },
  });

  const body = response.json();
  expect(body.found).toBe(10);
  expect(body.matched).toBe(3);
  expect(body.returned).toBe(3);
});

test('an impossible formula is answered, not crashed on', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/generate?mf=CH5',
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().found).toBe(0);
});

test('a formula that is not one is a 500 with the parser message', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/generate?mf=%20',
  });

  expect(response.statusCode).toBe(500);
  expect(response.json().message).toBe('The molecular formula is empty');
});

test('an unknown API address is a 404, not the frontend', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/nope' });

  expect(response.statusCode).toBe(404);
});

test('only the named proxy may say who the client is', async () => {
  const proxied = await buildApp({ trustProxy: '192.168.1.5' });
  proxied.get('/test-ip', async (request) => ({ ip: request.ip }));

  const trusted = await proxied.inject({
    method: 'GET',
    url: '/test-ip',
    remoteAddress: '192.168.1.5',
    headers: { 'x-forwarded-for': '203.0.113.7' },
  });
  expect(trusted.json()).toStrictEqual({ ip: '203.0.113.7' });

  const untrusted = await proxied.inject({
    method: 'GET',
    url: '/test-ip',
    remoteAddress: '10.1.2.3',
    headers: { 'x-forwarded-for': '203.0.113.7' },
  });
  expect(untrusted.json()).toStrictEqual({ ip: '10.1.2.3' });

  await proxied.close();
});
