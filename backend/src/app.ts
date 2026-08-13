import { existsSync } from 'node:fs';
import { join } from 'node:path';

import fastifyCors from '@fastify/cors';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';

import { config } from './config.ts';
import exerciseRoutes from './routes/exercises.ts';
import generateRoutes from './routes/generate.ts';
import healthRoutes from './routes/health.ts';
import type { FastifyTyped } from './types.ts';

export interface BuildAppOptions {
  /**
   * Whose `X-Forwarded-For` to believe.
   * @default read from TRUST_PROXY
   */
  trustProxy?: boolean | number | string;
  /**
   * Log requests.
   * @default false
   */
  logger?: boolean;
}

/**
 * Build the Fastify application: the API, its documentation, and the built
 * frontend when there is one.
 * @param options - Overrides, used by the tests.
 * @returns The instance, ready to listen or to inject into.
 */
export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyTyped> {
  const fastify = Fastify({
    logger: options.logger ?? false,
    trustProxy: options.trustProxy ?? config.trustProxy,
  }).withTypeProvider<TypeBoxTypeProvider>();

  await fastify.register(fastifyCors, { maxAge: 86_400 });
  await fastify.register(fastifySensible);

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Surge — structural isomer generator',
        description:
          'Generate every constitutional isomer of a molecular formula, and grade the structures a student draws against them.',
        version: '1.0.0',
      },
      tags: [
        { name: 'generate', description: 'Enumerate isomers' },
        { name: 'exercises', description: 'Find every isomer yourself' },
        { name: 'service', description: 'Health and version' },
      ],
    },
  });
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });
  fastify.get('/documentation', (_request, reply) => reply.redirect('/docs'));

  await fastify.register(healthRoutes);
  await fastify.register(generateRoutes);
  await fastify.register(exerciseRoutes);

  registerFrontend(fastify);

  // The instance is deliberately left un-readied, so a caller — a test, or a
  // future plugin — can still add to it. `listen` and `inject` both ready it.
  return fastify;
}

/**
 * Serve the built frontend, and answer any address it routes itself with its
 * index so a link a teacher handed out loads. Without a build — a plain
 * `npm run dev`, where Vite serves the frontend — the root shows the API
 * documentation instead.
 * @param fastify - Instance to register on.
 */
function registerFrontend(fastify: FastifyTyped): void {
  const root = join(import.meta.dirname, '../../frontend/dist');
  if (!existsSync(root)) {
    fastify.get('/', (_request, reply) => reply.redirect('/docs'));
    return;
  }

  void fastify.register(fastifyStatic, { root });
  fastify.setNotFoundHandler((request, reply) => {
    if (request.method !== 'GET' || request.url.startsWith('/v1/')) {
      return reply.notFound();
    }
    return reply.sendFile('index.html');
  });
}
