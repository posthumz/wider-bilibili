// @ts-check
import { FlatCompat } from '@eslint/eslintrc'
import stylistic from '@stylistic/eslint-plugin'

const customized = stylistic.configs.customize({
  indent: 2,
  quotes: 'single',
  semi: false,
  blockSpacing: true,
  quoteProps: 'as-needed',
  commaDangle: 'always-multiline',
})

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...new FlatCompat({ recommendedConfig: {} }).config({
    env: { browser: true, es2022: true, greasemonkey: true },
    plugins: ['@stylistic'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@stylistic/disable-legacy',
    ],
    ignorePatterns: ['node_modules', 'dist'],
    parser: '@typescript-eslint/parser',
    rules: {
      ...customized.rules,
      '@stylistic/arrow-parens': ['warn', 'as-needed'],
      '@stylistic/brace-style': ['warn', 'stroustrup', { allowSingleLine: true }],
      '@stylistic/max-statements-per-line': 'off',
      '@stylistic/member-delimiter-style': ['warn', { multiline: { delimiter: 'none' } }],
    },
  }),
  // {
  //   name: 'typescript',
  //   files: ['src/**/*.ts'],
  //   plugins: {
  //     '@typescript-eslint': eslintPlugin.rules,
  //   },
  //   languageOptions: {
  //     ecmaVersion: 2022,
  //     // globals: { ...globals.browser, ...globals.greasemonkey },
  //   },
  // },
]
