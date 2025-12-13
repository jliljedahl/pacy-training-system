import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'prisma/migrations/**',
    ],
  },

  // Base JS/TS rules for all files
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // TypeScript-specific settings
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // React-specific rules (frontend only)
  {
    files: ['frontend/**/*.tsx', 'frontend/**/*.ts'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Backend-specific rules
  {
    files: ['backend/**/*.ts'],
    rules: {
      'no-console': 'off', // Allow console in backend
    },
  },

  // Prettier compatibility (must be last)
  prettier
);
