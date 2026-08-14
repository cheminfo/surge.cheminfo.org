import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import fastifyCors from '@fastify/cors';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyReply } from 'fastify';
import Fastify from 'fastify';

import { config } from './config.ts';
import exerciseRoutes from './routes/exercises.ts';
import fragmentRoutes from './routes/fragments.ts';
import generateRoutes from './routes/generate.ts';
import healthRoutes from './routes/health.ts';
import type { FastifyTyped } from './types.ts';
import { injectTrackingScript } from './utils/injectTrackingScript.ts';

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
  /**
   * The analytics provider's `<script>` tag, put into every page served.
   * @default read from TRACKING_SCRIPT
   */
  trackingScript?: string;
  /**
   * Where the built frontend is.
   * @default the frontend/dist of this checkout
   */
  frontendRoot?: string;
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
        title: 'Surge — constitutional isomer generator',
        description:
          'Generate every constitutional isomer of a molecular formula, and grade the structures a student draws against them.',
        version: '1.0.0',
      },
      tags: [
        { name: 'generate', description: 'Enumerate isomers' },
        { name: 'exercises', description: 'Find every isomer yourself' },
        {
          name: 'fragments',
          description: 'The motifs a hint is built from',
        },
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
  await fastify.register(fragmentRoutes);

  registerFrontend(
    fastify,
    options.frontendRoot ?? join(import.meta.dirname, '../../frontend/dist'),
    options.trackingScript ?? config.trackingScript,
  );

  // The instance is deliberately left un-readied, so a caller — a test, or a
  // future plugin — can still add to it. `listen` and `inject` both ready it.
  return fastify;
}

/**
 * Serve the built frontend, and answer any address it routes itself with its
 * index so a link a teacher handed out loads. Without a build — a plain
 * `npm run dev`, where Vite serves the frontend — the root shows the API
 * documentation instead.
 *
 * The index is read once and served from memory, so the operator's tracking
 * snippet is in it whichever address the visitor arrived at: a page the
 * frontend routes itself is the same page as the root, and it must be counted
 * the same way.
 * @param fastify - Instance to register on.
 * @param root - Where the built frontend is.
 * @param trackingScript - The analytics provider's tag, when there is one.
 */
function registerFrontend(
  fastify: FastifyTyped,
  root: string,
  trackingScript?: string,
): void {
  if (!existsSync(root)) {
    fastify.get('/', (_request, reply) => reply.redirect('/docs'));
    return;
  }

  const index = injectTrackingScript(
    readFileSync(join(root, 'index.html'), 'utf8'),
    trackingScript,
  );
  const sendIndex = (_request: unknown, reply: FastifyReply) =>
    reply.type('text/html; charset=utf-8').send(index);

  void fastify.register(fastifyStatic, { root, index: false });
  fastify.get('/', sendIndex);
  fastify.get('/index.html', sendIndex);
  fastify.setNotFoundHandler((request, reply) => {
    if (request.method !== 'GET' || request.url.startsWith('/v1/')) {
      return reply.notFound();
    }
    return sendIndex(request, reply);
  });
}
