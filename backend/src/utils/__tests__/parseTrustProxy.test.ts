import { expect, test } from 'vitest';

import { parseTrustProxy } from '../parseTrustProxy.ts';

test('an unset variable trusts nobody', () => {
  expect(parseTrustProxy(undefined)).toBe(false);
  expect(parseTrustProxy('')).toBe(false);
  expect(parseTrustProxy(' '.repeat(3))).toBe(false);
  expect(parseTrustProxy('false')).toBe(false);
});

test('true trusts every peer', () => {
  expect(parseTrustProxy('true')).toBe(true);
});

test('a bare number is a hop count', () => {
  expect(parseTrustProxy('2')).toBe(2);
});

test('anything else is passed through as an address or a range', () => {
  expect(parseTrustProxy('192.168.1.5')).toBe('192.168.1.5');
  expect(parseTrustProxy(' 172.16.0.0/12, 192.168.0.0/16 ')).toBe(
    '172.16.0.0/12, 192.168.0.0/16',
  );
});
