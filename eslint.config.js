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

// Full-state engine functions (ADR 0005, M2-12). The AI and the UI see only views: these are
// allowed only in the app's session store and in AI search over its own determinized states.
const fullState = {
  name: '@optcg/engine',
  importNames: ['queries', 'legalActions', 'whyNot', 'preview', 'autoSkip', 'reduce', 'replay'],
  message:
    'Full-state engine calls are allowed only in app/src/session/ (the store) and ai/src/search/ (determinized states). Use project(), view actions and previewFromView().',
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
      '.cache/**',
      '.claude/**',
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
    ignores: ['ai/src/search/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [fullState], patterns: [...noUi, enginePublicOnly] },
      ],
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
      'no-restricted-imports': ['error', { paths: [fullState], patterns: [enginePublicOnly] }],
    },
  },
  {
    files: ['ai/src/search/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...noUi, enginePublicOnly] }],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use a seeded RNG.' },
      ],
    },
  },
  {
    files: ['app/src/session/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [enginePublicOnly] }],
    },
  },
);
