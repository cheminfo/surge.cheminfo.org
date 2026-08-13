import { expect, test } from 'vitest';

import {
  applyShareConfig,
  isShareConfigured,
  parseShareConfig,
  stringifyParams,
} from '../shareConfig.ts';

test('a configured link is read back whole', () => {
  expect(
    parseShareConfig('?formulas=C4H10O,C5H12&embed=1&hide=hints,answers'),
  ).toStrictEqual({
    embed: true,
    hidden: ['hints', 'answers'],
  });
});

test('a plain link configures nothing', () => {
  const config = parseShareConfig('?mf=C4H10O');
  expect(config).toStrictEqual({ embed: false, hidden: [] });
  expect(isShareConfigured(config)).toBe(false);
});

test('a bare ?embed switches embed mode on, ?embed=0 leaves it off', () => {
  expect(parseShareConfig('?embed').embed).toBe(true);
  expect(parseShareConfig('?embed=0').embed).toBe(false);
});

test('an unknown or repeated hide key is dropped', () => {
  expect(
    parseShareConfig('?hide=hints,ionization,hints, answers').hidden,
  ).toStrictEqual(['hints', 'answers']);
});

test('the configuration is written next to the inputs, which are left alone', () => {
  const params = new URLSearchParams('formulas=C4H10O&exercise=C4H10O&embed=1');
  applyShareConfig(params, { embed: false, hidden: ['list', 'clear'] });
  expect(stringifyParams(params)).toBe(
    'formulas=C4H10O&exercise=C4H10O&hide=list,clear',
  );
});

test('parse, apply and parse again give the same configuration', () => {
  const config = parseShareConfig('?embed=1&hide=options,substructure');
  const params = new URLSearchParams('mf=C6H10O');
  applyShareConfig(params, config);
  expect(parseShareConfig(stringifyParams(params))).toStrictEqual(config);
});
