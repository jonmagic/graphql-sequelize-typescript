import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin'
import typescriptEslintParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import vitest from "@vitest/eslint-plugin"

export default [
  {
    ignores: ['node_modules'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: prettierPlugin,
      vitest,
    },
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      'prettier/prettier': ['error', { usePrettierrc: true }],
      ...vitest.configs.recommended.rules,

    },
    settings: {
      prettier: {
        ...eslintConfigPrettier.rules,
      }
    }
  },
]
