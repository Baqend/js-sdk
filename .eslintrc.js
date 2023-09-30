module.exports = {
  parser: '@typescript-eslint/parser',

  plugins: [
    '@typescript-eslint',
    'node',
  ],

  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    // "plugin:@typescript-eslint/recommended",
    // 'plugin:node/recommended-module',
  ],

  env: {
    node: true,
  },

  ignorePatterns: ['dist/**', 'doc/**', 'commonjs/**', 'lib/**/*.js', 'cli/**/*.js'],

  rules: {
    // enforce consistent linebreak style
    // https://eslint.org/docs/rules/linebreak-style
    'linebreak-style': 'off',

    strict: ['error', 'global'],

    // specify the maximum length of a line in your program
    // http://eslint.org/docs/rules/max-len
    'max-len': ['error', 120, 2, {
      ignoreUrls: true,
      ignoreComments: false,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],

    // we are using unused args in several interface definitions
    'no-unused-vars': 'off',
  },

  overrides: [
    {
      files: ['lib/**/*.ts', 'realtime/*.js', 'connect.js'],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2015,
        project: './tsconfig.json',
      },

      env: {
        es6: true,
        browser: true,
        node: true,
      },

      rules: {
        // we disallow default exports
        "import/prefer-default-export": "off",
        "import/no-default-export": "error",
        // we do not need that, since we are using ts
        'import/no-unresolved': 'off',

        // we use this in several places, should be discussed if we want to re-enable this
        'class-methods-use-this': 'off',
        "no-underscore-dangle": ['error', { "allowAfterThis": true }],

        'node/no-deprecated-api': 'error',
        'no-buffer-constructor': 'error',
        'no-console': 'error',
      }
    },

    {
      files: ['cli/*.ts'],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2015,
        project: './tsconfig.json',
      },

      env: {
        node: true,
      },

      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        // we must require our self which isn't supported right now in ts
        // https://github.com/microsoft/TypeScript/issues/38675
        'import/no-extraneous-dependencies': 'off',
        'no-restricted-syntax': 'off',
      }
    },

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
        Baqend: true,
        rxjs: true,
      },

      env: {
        es6: false,
        node: true,
        mocha: true,
        browser: true,
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
        '@typescript-eslint/no-unused-expressions': 'off',
        'no-await-in-loop': 'off',
      },
    },
  ],
};
