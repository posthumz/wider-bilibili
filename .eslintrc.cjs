module.exports = {
  root: true,
  env: { es2020: true, greasemonkey: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:@typescript-eslint/stylistic',
    'plugin:@stylistic/recommended-extends',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@stylistic/indent': ['warn', 2],
    '@stylistic/quotes': ['warn', 'single'],
    '@stylistic/max-statements-per-line': 'off',
    '@stylistic/arrow-parens': ['warn', 'as-needed'],
  },
}
