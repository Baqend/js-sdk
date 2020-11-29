

module.exports = {
  parser: '@typescript-eslint/parser',

  plugins: [
    '@typescript-eslint',
    'node',
  ],

  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/eslint-recommended',
    // "plugin:@typescript-eslint/recommended",
    // 'plugin:node/recommended-module',
  ],

  env: {
    es6: true,
    browser: true,
    node: true,
  },

  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2015,
    project: './tsconfig.json',
  },

  rules: {
    // enforce consistent linebreak style
    // https://eslint.org/docs/rules/linebreak-style
    'linebreak-style': 'off',

    strict: ['error', 'global'],

    // we disallow default exports
    "import/prefer-default-export": "off",
    "import/no-default-export": "error",

    // we use this in several places, should be discussed if we want to re-enable this
    'class-methods-use-this': 'off',
    "no-underscore-dangle": ['error', { "allowAfterThis": true }],

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

    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "never",
        "jsx": "never",
        "ts": "never",
        "tsx": "never",
      },
    ],
  },

  overrides: [
    {
      files: ['spec/*.js'],

      globals: {
        Abort: true,
        ArrayBuffer: true,
        DB: true,
        env: true,
        expect: true,
        helper: true,
        Map: true,
        Promise: true,
        Set: true,
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
};
