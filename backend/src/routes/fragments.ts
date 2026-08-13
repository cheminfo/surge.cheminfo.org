import { Type } from '@sinclair/typebox';

import { FRAGMENTS, partialNudge } from '../chemistry/fragments/index.ts';
import { getFragmentUsage } from '../exercises/exerciseService.ts';
import { surgeOptionsSchema } from '../schemas/surgeOptions.ts';
import type { FastifyTyped } from '../types.ts';

const fragmentSchema = Type.Object({
  id: Type.String(),
  label: Type.String(),
  category: Type.String(),
  description: Type.String(),
  idCodes: Type.Array(Type.String()),
  parent: Type.Optional(Type.String()),
  missing: Type.String(),
  partial: Type.String(),
});

/**
 * Register the fragment routes: the library a hint is built from, and how
 * often each of its motifs appears in one exercise. Both are what the debug
 * page shows, so a teacher can see what the service will say before a student
 * hears it.
 * @param fastify - Instance to register on.
 */
export default async function fragmentRoutes(fastify: FastifyTyped) {
  fastify.get(
    '/v1/fragments',
    {
      schema: {
        tags: ['fragments'],
        summary: 'Every motif a structure is looked at for',
        description:
          'Each motif is one or more openchemlib query fragments, given as idCodes. A structure holds the motif when any of them is found in it by substructure search.',
        response: {
          200: Type.Object({
            count: Type.Integer(),
            fragments: Type.Array(fragmentSchema),
          }),
        },
      },
    },
    () => ({
      count: FRAGMENTS.length,
      fragments: FRAGMENTS.map((fragment) => ({
        ...fragment,
        partial: partialNudge(fragment),
      })),
    }),
  );

  fastify.get(
    '/v1/fragments/usage',
    {
      schema: {
        tags: ['fragments'],
        summary: 'How many isomers of a formula hold each motif',
        params: Type.Object({}),
        querystring: Type.Intersect([
          Type.Object({
            mf: Type.String({
              description: 'Molecular formula to enumerate',
              examples: ['C4H8O'],
            }),
          }),
          surgeOptionsSchema,
        ]),
        response: {
          200: Type.Object({
            mf: Type.String(),
            count: Type.Integer(),
            usage: Type.Array(
              Type.Object({
                id: Type.String(),
                answers: Type.Integer(),
                example: Type.Optional(Type.String()),
              }),
            ),
          }),
        },
      },
    },
    async (request) => {
      const { mf, ...options } = request.query;
      return getFragmentUsage(mf, options);
    },
  );
}
