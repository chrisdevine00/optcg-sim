import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Dependency arrows point downward only: app -> ai -> engine -> cards.
const noUi = [
  { group: ['react', 'react-dom', 'react/*', 'react-dom/*'], message: 'No React outside app/.' },
  { group: ['@optcg/app', '@optcg/app/*'], message: 'Nothing depends on app/.' },
];
const enginePublicOnly = {
  group: ['@optcg/engine/*', '@optcg/ai/*', '!@optcg/ai/worker', '**/engine/src/*', '**/ai/src/*'],
  message: 'Import the package public API (@optcg/engine, @optcg/ai), never its internals.',
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['cards/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...noUi,
            {
              group: ['@optcg/engine', '@optcg/engine/*', '@optcg/ai', '@optcg/ai/*'],
              message: 'cards/ depends on nothing.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['engine/src/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...noUi,
            { group: ['@optcg/ai', '@optcg/ai/*'], message: 'engine/ must not know about ai/.' },
          ],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'Date', 'localStorage', 'navigator'],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG in state.' },
      ],
    },
  },
  {
    files: ['ai/src/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...noUi, enginePublicOnly] }],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use a seeded RNG.' },
      ],
    },
  },
  {
    files: ['app/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': ['error', { patterns: [enginePublicOnly] }],
    },
  },
);
