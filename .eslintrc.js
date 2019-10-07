'use strict'

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
    'linebreak-style': 'off',

    strict: ['error', 'global'],

    // FIXME allow all currently used _fields for now
    'no-underscore-dangle': ['warn', { allow: ['_metadata'] }],
    // 'no-underscore-dangle': ['error', { allowAfterThis: true }],

    // Node 4 does not support backtick therefore disallow them
    quotes: ['error', 'single'],
    'prefer-template': 'off',

    // comma dangling for functions is not supported in es2016
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    }],

    // Change these rules if we drop Node 4 support
    'prefer-spread': 'off',
    'prefer-rest-params': 'off',
    'prefer-destructuring': 'off',
    'no-param-reassign': ['error', { props: false }],
    'class-methods-use-this': 'off',

    'node/no-deprecated-api': 'error',
    'no-buffer-constructor': 'error',
    'no-console': 'error',

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

  overrides: [
    {
      files: ['spec/*.js'],

      globals: {
        'Abort': true,
        'ArrayBuffer': true,
        'DB': true,
        'env': true,
        'expect': true,
        'helper': true,
        'Map': true,
        'Promise': true,
        'Set': true,
      },

      env: {
        es6: false,
        node: true,
        mocha: true,
      },

      rules: {
        'consistent-return': 'off',
        'func-names': 'off',
        'global-require': 'off',
        'guard-for-in': 'warn',
        'new-cap': 'warn',
        'no-console': 'warn',
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-eval': 'warn',
        'no-mixed-operators': 'off',
        'no-multi-str': 'off',
        'no-new': 'off',
        'no-restricted-syntax': 'off',
        'no-shadow': 'warn',
        'no-unused-expressions': 'off',
        'no-unused-vars': 'warn',
        'no-use-before-define': 'warn',
        'no-var': 'off',
        'node/no-unpublished-require': 'off',
        'object-shorthand': 'off',
        'one-var': 'off',
        'one-var-declaration-per-line': 'off',
        'prefer-arrow-callback': 'off',
        'prefer-promise-reject-errors': 'warn',
        'vars-on-top': 'off',
      },
    },
  ],
}
