import { defineConfig, globalIgnores } from 'eslint/config';
import { globals } from 'eslint-config-zakodium';
import react from 'eslint-config-zakodium/react';
import ts from 'eslint-config-zakodium/ts';
import unicorn from 'eslint-config-zakodium/unicorn';

export default defineConfig(
  globalIgnores([
    'bin',
    '**/coverage',
    '**/dist',
    // Outside every tsconfig, so the type-aware rules cannot parse them.
    'frontend/e2e',
    'frontend/playwright.config.ts',
    'frontend/playwright-report',
    'frontend/test-results',
  ]),
  ts,
  unicorn,
  {
    // TypeBox and Fastify use uppercase non-constructor calls.
    rules: { 'new-cap': ['error', { capIsNew: false }] },
  },
  {
    files: ['backend/**', 'scripts/**'],
    languageOptions: { globals: { ...globals.nodeBuiltin } },
  },
  {
    files: ['frontend/**'],
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
