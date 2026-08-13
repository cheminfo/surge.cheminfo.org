import { Type } from '@sinclair/typebox';

import { generateIsomers } from '../generate/generateIsomers.ts';
import { surgeOptionsSchema } from '../schemas/surgeOptions.ts';
import type { FastifyTyped } from '../types.ts';

const parametersSchema = Type.Composite([
  Type.Object({
    mf: Type.String({
      description: 'Molecular formula, for example C6H10O',
      examples: ['C6H10O'],
    }),
    limit: Type.Optional(
      Type.Integer({
        description: 'How many structures to return',
        minimum: 1,
        default: 1000,
      }),
    ),
    timeout: Type.Optional(
      Type.Number({
        description: 'Seconds after which the enumeration is killed',
        minimum: 0.1,
        default: 2,
      }),
    ),
    idCode: Type.Optional(
      Type.Boolean({
        description: 'Append the openchemlib idCode of every structure',
        default: false,
      }),
    ),
    fragmentCode: Type.Optional(
      Type.String({
        description:
          'idCode of a drawn fragment; only structures containing it are returned',
      }),
    ),
  }),
  surgeOptionsSchema,
]);

const responseSchema = Type.Object({
  mf: Type.String(),
  status: Type.Union([
    Type.Literal('complete'),
    Type.Literal('timeout'),
    Type.Literal('output-limit'),
  ]),
  found: Type.Integer(),
  matched: Type.Optional(Type.Integer()),
  returned: Type.Integer(),
  time: Type.Integer(),
  log: Type.String(),
  flags: Type.Array(Type.String()),
  result: Type.Array(
    Type.Object({
      smiles: Type.String(),
      idCode: Type.Optional(Type.String()),
    }),
  ),
});

/**
 * Register the structure generation route.
 * @param fastify - Instance to register on.
 */
export default async function generateRoutes(fastify: FastifyTyped) {
  const summary = 'Generate the constitutional isomers of a molecular formula';
  const description =
    'Enumerates every non-isomorphic constitutional isomer of the formula with surge.';

  fastify.get(
    '/v1/generate',
    {
      schema: {
        tags: ['generate'],
        summary,
        description: `${description} Parameters are read from the query string.`,
        querystring: parametersSchema,
        response: { 200: responseSchema },
      },
    },
    async (request) => generateIsomers(request.query),
  );

  fastify.post(
    '/v1/generate',
    {
      schema: {
        tags: ['generate'],
        summary,
        description: `${description} Parameters are read from a JSON body, which is how a drawn fragment is passed without stuffing it in a URL.`,
        body: parametersSchema,
        response: { 200: responseSchema },
      },
    },
    async (request) => generateIsomers(request.body),
  );
}
