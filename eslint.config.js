import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist', 'build', 'release', '.wwebjs_cache', 'whatsapp-bot/sessions', 'node_modules',
    '.venv',
    'backups',
    '**/Devotee Management - Copy/**',
    '**/*.mjs',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Uppercase identifiers are component slots (imported icon components, props
      // passed through as JSX elements like `icon: Icon`). ESLint core marks JSX
      // *element names* as usages only via react/jsx-uses-vars, which this project
      // does not pull in, so treat them the way variables are already treated.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
      // Hooks-from-context-files is the established pattern in this codebase and is
      // only a fast-refresh DX concern, not a correctness one.
      'react-refresh/only-export-components': 'off',
      // New, highly opinionated eslint-plugin-react-hooks rule matching the React
      // Compiler era. The codebase uses the patterns it flags pervasively and they
      // are correct in practice, so it is disabled to keep the build noise-free.
      'react-hooks/set-state-in-effect': 'off',
      // Fire-and-forget error handlers (logging already done at the source) are
      // intentional; empty catch clauses are also used to swallow probe failures.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // The Electron wrapper (main/preload) runs under Node and is not part of the React app.
    files: ['electron/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
])