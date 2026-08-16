import { defineConfig, globalIgnores } from 'eslint/config';
import react from 'eslint-config-zakodium/react';
import ts from 'eslint-config-zakodium/ts';
import unicorn from 'eslint-config-zakodium/unicorn';

export default defineConfig(
  globalIgnores([
    // The old layout's build output, still on disk until it is cleaned up.
    'bin',
    'backend',
    'frontend',
    'coverage',
    'dist',
    // Outside the tsconfig, so the type-aware rules cannot parse them.
    'playwright-report',
    'test-results',
  ]),
  ts,
  unicorn,
  {
    // Driving a page is one thing after another, and a browser test reads
    // better as the sequence it is.
    files: ['e2e/**'],
    rules: { 'no-await-in-loop': 'off' },
  },
  {
    files: ['src/**', 'e2e/**'],
    extends: [react],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@blueprintjs/core',
              importNames: ['Popover'],
              message:
                'Blueprint’s legacy Popover does not position itself under React 19: use PopoverNext.',
            },
          ],
        },
      ],
    },
  },
);
