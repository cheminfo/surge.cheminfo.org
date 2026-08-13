import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

/**
 * A surge range flag: `3` or `1:3` (`1-3` is accepted too). Empty means the
 * restriction is not applied, so a form can send every field every time.
 */
const range = (description: string) =>
  Type.Optional(
    Type.String({
      description,
      pattern: String.raw`^(\d+([:-]\d+)?)?$`,
      examples: ['0', '1:2'],
    }),
  );

const flag = (description: string) =>
  Type.Optional(Type.Boolean({ description, default: false }));

/**
 * Everything that changes which structures surge enumerates. Shared by the
 * generation route and by an exercise definition, so a teacher can restrict an
 * exercise exactly the way the generator can.
 */
export const surgeOptionsSchema = Type.Object({
  disallowTripleBonds: flag('Disallow triple bonds (-T)'),
  requirePlanarity: flag('Only generate planar structures (-P)'),
  aromaticity: Type.Optional(
    Type.Boolean({
      description:
        'Remove all but one structure of each set of Kekulé structures that are equivalent under carbon-ring aromaticity (-R)',
      default: true,
    }),
  ),
  evenRingsOnly: flag('Only rings of even length (-b)'),
  limitBonds: range('Limit the number of distinct non-H bonds (-e)'),
  limit3Rings: range('Limit the number of cycles of length 3 (-t)'),
  limit4Rings: range('Limit the number of cycles of length 4 (-f)'),
  limit5Rings: range('Limit the number of cycles of length 5 (-p)'),
  limit6Rings: range('Limit the number of cycles of length 6 (-h)'),
  limitCarbon6Rings: range(
    'Limit the number of chord-free cycles of 6 carbon atoms (-C)',
  ),
  maxDegree: Type.Optional(
    Type.Integer({
      description:
        'Maximum degree, not counting bond multiplicity or hydrogens (-d)',
      minimum: 1,
      maximum: 8,
    }),
  ),
  maxCoordination: Type.Optional(
    Type.Integer({
      description:
        'Maximum number of distinct atoms, hydrogens included, an atom may be bonded to (-c)',
      minimum: 1,
      maximum: 8,
    }),
  ),
  noSmallRingsTripleBonds: flag(
    'No triple bonds in rings up to length 7 (-B1)',
  ),
  bredsRuleOne: flag(
    "Bredt's rule for two rings ij with one bond in common (33, 34, 35, 36, 44, 45) (-B2)",
  ),
  bredsRuleTwo: flag(
    "Bredt's rule for two rings ij with two bonds in common (i,j up to 56) (-B3)",
  ),
  bredsRuleThree: flag(
    "Bredt's rule for two rings of length 6 sharing three bonds (-B4)",
  ),
  noAllene: flag('No substructure A=A=A, in a ring or not (-B5)'),
  noAlleneInSmallRings: flag(
    'No substructure A=A=A in rings up to length 8 (-B6)',
  ),
  noK33K24: flag('No K33 or K24 substructure (-B7)'),
  noCone: flag('No cone of P4 and no K4 with a 3-ear (-B8)'),
  noSmallRingsCommonAtoms: flag(
    'No atom in more than one ring of length 3 or 4 (-B9)',
  ),
});

export type SurgeOptions = Static<typeof surgeOptionsSchema>;
