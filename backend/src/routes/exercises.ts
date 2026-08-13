import { Type } from '@sinclair/typebox';

import type { ExerciseSet } from '../exercises/defaultSet.ts';
import { DEFAULT_EXERCISE_SET } from '../exercises/defaultSet.ts';
import {
  checkStructure,
  getExercise,
  getExerciseAnswers,
} from '../exercises/exerciseService.ts';
import { surgeOptionsSchema } from '../schemas/surgeOptions.ts';
import type { FastifyTyped } from '../types.ts';

const levelSchema = Type.Union([
  Type.Literal('beginner'),
  Type.Literal('intermediate'),
  Type.Literal('advanced'),
]);

const parametersSchema = Type.Object({
  mf: Type.String({ description: 'Molecular formula of the exercise' }),
});

const answerSchema = Type.Object({
  idCode: Type.String(),
  smiles: Type.String(),
});

/**
 * Register the exercise routes. They hold no state: a teacher describes a set
 * of exercises in the URL, and the service answers about the formulas it names.
 * @param fastify - Instance to register on.
 */
export default async function exerciseRoutes(fastify: FastifyTyped) {
  fastify.get(
    '/v1/exercises',
    {
      schema: {
        tags: ['exercises'],
        summary: 'List the exercises of a set and how many isomers each holds',
        description:
          'Without `mf`, the set shipped with the service is described. With `mf`, a set is built from the formulas listed, which is how a teacher hands out their own selection.',
        querystring: Type.Object({
          mf: Type.Optional(
            Type.String({
              description: 'Comma separated molecular formulas',
              examples: ['C4H10O,C5H12'],
            }),
          ),
        }),
        response: {
          200: Type.Object({
            id: Type.String(),
            title: Type.String(),
            description: Type.String(),
            exercises: Type.Array(
              Type.Object({
                mf: Type.String(),
                level: levelSchema,
                count: Type.Integer(),
              }),
            ),
          }),
        },
      },
    },
    async (request) => {
      const set = readSet(request.query.mf);
      const exercises = [];
      for (const exercise of set.exercises) {
        // One at a time: enumerating a whole set in parallel would take every
        // slot of the generation queue and answer 503 to everyone else.
        // eslint-disable-next-line no-await-in-loop -- intentional, see above
        const { mf, count } = await getExercise(exercise.mf, exercise.options);
        exercises.push({ mf, count, level: exercise.level ?? 'intermediate' });
      }
      return { ...set, exercises };
    },
  );

  fastify.get(
    '/v1/exercises/:mf',
    {
      schema: {
        tags: ['exercises'],
        summary: 'Describe one exercise, without giving its answers away',
        params: parametersSchema,
        querystring: surgeOptionsSchema,
        response: {
          200: Type.Object({
            mf: Type.String(),
            count: Type.Integer(),
            hints: Type.Array(Type.String()),
          }),
        },
      },
    },
    async (request) => getExercise(request.params.mf, request.query),
  );

  fastify.get(
    '/v1/exercises/:mf/answers',
    {
      schema: {
        tags: ['exercises'],
        summary: 'Every isomer of the exercise — the correction',
        params: parametersSchema,
        querystring: surgeOptionsSchema,
        response: {
          200: Type.Object({
            mf: Type.String(),
            count: Type.Integer(),
            answers: Type.Array(answerSchema),
          }),
        },
      },
    },
    async (request) => {
      const { mf } = request.params;
      const answers = await getExerciseAnswers(mf, request.query);
      return { mf, count: answers.length, answers };
    },
  );

  fastify.post(
    '/v1/exercises/:mf/check',
    {
      schema: {
        tags: ['exercises'],
        summary:
          'Check whether a drawn structure is one of the isomers to find',
        params: parametersSchema,
        querystring: surgeOptionsSchema,
        body: Type.Object({
          idCode: Type.String({
            description:
              'idCode of the drawn structure, with or without its coordinates',
          }),
        }),
        response: {
          200: Type.Object({
            correct: Type.Boolean(),
            reason: Type.Union([
              Type.Literal('correct'),
              Type.Literal('wrong-formula'),
              Type.Literal('not-an-isomer'),
            ]),
            idCode: Type.String(),
            mf: Type.String(),
          }),
        },
      },
    },
    async (request) =>
      checkStructure(request.params.mf, request.body.idCode, request.query),
  );
}

function readSet(mf: string | undefined): ExerciseSet {
  if (!mf) return DEFAULT_EXERCISE_SET;
  const formulas = mf
    .split(',')
    .map((formula) => formula.trim())
    .filter(Boolean);
  if (formulas.length === 0) {
    throw Object.assign(new Error('No molecular formula was given'), {
      statusCode: 400,
    });
  }
  return {
    id: 'custom',
    title: 'Structural isomers',
    description: DEFAULT_EXERCISE_SET.description,
    exercises: formulas.map((formula) => ({ mf: formula })),
  };
}
