import { expect, test } from 'vitest';

import { injectTrackingScript } from '../injectTrackingScript.ts';

const SNIPPET =
  '<script defer src="https://analytics.example.org/script.js" data-website-id="00000000-0000-0000-0000-000000000000"></script>';

const PAGE =
  '<!doctype html>\n<html>\n  <head>\n    <title>Surge</title>\n  </head>\n  <body></body>\n</html>\n';

test('the snippet lands just before the end of the head', () => {
  const page = injectTrackingScript(PAGE, SNIPPET);

  expect(page).toBe(
    `<!doctype html>\n<html>\n  <head>\n    <title>Surge</title>\n  ${SNIPPET}\n</head>\n  <body></body>\n</html>\n`,
  );
});

test('a deployment that tracks nothing is served the page it built', () => {
  expect(injectTrackingScript(PAGE)).toBe(PAGE);
  expect(injectTrackingScript(PAGE, ' '.repeat(3))).toBe(PAGE);
});

test('the value is taken as written, whitespace of the variable aside', () => {
  expect(injectTrackingScript(PAGE, `\n  ${SNIPPET}  \n`)).toBe(
    injectTrackingScript(PAGE, SNIPPET),
  );
});

test('a page already carrying the snippet is left alone', () => {
  const once = injectTrackingScript(PAGE, SNIPPET);

  expect(injectTrackingScript(once, SNIPPET)).toBe(once);
});

test('a page without a head still gets the script', () => {
  expect(injectTrackingScript('<div id="root"></div>\n', SNIPPET)).toBe(
    `<div id="root"></div>\n\n${SNIPPET}\n`,
  );
});
