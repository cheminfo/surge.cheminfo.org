import { Type } from '@sinclair/typebox';

import { getVersion } from '../surge/getVersion.ts';
import type { FastifyTyped } from '../types.ts';

/**
 * Register the health route.
 * @param fastify - Instance to register on.
 */
export default async function healthRoutes(fastify: FastifyTyped) {
  fastify.get(
    '/v1/health',
    {
      schema: {
        tags: ['service'],
        summary: 'Liveness probe and surge version',
        response: {
          200: Type.Object({
            status: Type.Literal('ok'),
            surge: Type.String({ description: 'Version of the executable' }),
          }),
        },
      },
    },
    async () => ({ status: 'ok' as const, surge: await getVersion() }),
  );
}
