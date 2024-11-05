import pluginJs from "@eslint/js"
import stylistic from '@stylistic/eslint-plugin'
import globals from "globals"
import { configs } from "typescript-eslint"

/** @type {import('eslint').Linter.Config[]} */ // @ts-expect-error idk? it works
const tsConfigs = configs.recommendedTypeChecked

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["dist", "eslint.config.mjs"] },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: {...globals.browser, ...globals.es2022, ...globals.greasemonkey},
    },
  },
  // js&ts
  ...tsConfigs,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // stylistic
  stylistic.configs["disable-legacy"],
  stylistic.configs.customize({
    flat: true,
    indent: 2,
    quotes: 'single',
    semi: false,
    arrowParens: false,
    blockSpacing: true,
    quoteProps: 'as-needed',
    commaDangle: 'always-multiline',
  }),

  {
    rules: {
      '@stylistic/arrow-parens': ['warn', 'as-needed'],
      '@stylistic/brace-style': ['warn', 'stroustrup', { allowSingleLine: true }],
      '@stylistic/member-delimiter-style': ['warn', { multiline: { delimiter: 'none' } }],
      '@stylistic/max-statements-per-line': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
]
