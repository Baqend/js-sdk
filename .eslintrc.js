'use strict';

module.exports = {
  plugins: ['node'],

  extends: [
    require.resolve('eslint-config-airbnb-base'),
    'plugin:node/recommended',
  ],

  env: {
    es6: true,
    browser: true,
    node: true,
  },

  parserOptions: {
    sourceType: 'script',
    ecmaVersion: 6,
  },

  rules: {
    // enforce consistent linebreak style
    // https://eslint.org/docs/rules/linebreak-style
    'linebreak-style': 0,

    strict: ['error', 'global'],

    // allow _metadata for now, we might replace them bei Metadata.get calls
    'no-underscore-dangle': ['error', { allow: ['_metadata'] }],
    // 'no-underscore-dangle': ['error', { allowAfterThis: true }],

    // Node 4 does not support backtick therefore disallow them
    quotes: ['error', 'single'],
    // comma dangling for functions is not supported in es2016
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'ignore',
    }],
    'prefer-template': 'off',
    'prefer-spread': 'off',
    'prefer-rest-params': 'off',
    'prefer-destructuring': 'off',
    'no-param-reassign': 'warn',
    'class-methods-use-this': 'warn',

    // FIXME: Discuss, if we want to change new Buffer to Buffer.from(), since it is deprecated since node 6.
    // FIXME: But we must bump required node engine to at least 4.5 since Buffer.from() is not available beforehand
    'node/no-deprecated-api': 'warn',
    'no-buffer-constructor': 'warn',

    // specify the maximum length of a line in your program
    // http://eslint.org/docs/rules/max-len
    'max-len': ['error', 120, 2, {
      ignoreUrls: true,
      ignoreComments: false,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
  },
};