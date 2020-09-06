// Karma configuration
// Generated on Thu Mar 06 2014 17:16:01 GMT+0100 (Mitteleuropäische Zeit)
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',

    // frameworks to use
    frameworks: ['mocha', 'chai', 'chai-as-promised'],

    client: {
      mocha: {
        timeout: 30000,
      },
    },

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'node_modules/rxjs/bundles/rxjs.umd.js', included: true },
      { pattern: 'node_modules/validator/validator.js', included: true },
      { pattern: 'dist/baqend.es5.js', watched: true, included: true },
      { pattern: 'dist/baqend.es5.js.map', included: false, served: true, watched: true },
      'spec/env.js',
      'spec/helper.js',
      'spec/**/*.spec.js',
      { pattern: 'spec/assets/*', watched: false, included: false, served: true, nocache: false },
    ],

    proxies: {
      '/spec/': '/base/spec/',
    },

    // list of files to exclude
    exclude: [],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],

    // JUnit reporter output dir
    junitReporter: {
      outputDir: 'build/test-results/',
    },

    // web server hostname
    hostname: process.env.KARMA_HOST || 'localhost',

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // How many browsers Karma launches in parallel.
    concurrency: 1,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome'],

    customLaunchers: Object.assign({}, require('./localSeleniumBrowser'), require('./browserstack')),

    // config for browserstack
    browserStack: {
      project: 'JS SDK',
      // startTunnel: false,
      timeout: 1800,
    },

    // How long does Karma wait for a browser to reconnect (in ms).
    browserNoActivityTimeout: 10 * 60 * 1000,

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 10 * 60 * 1000,

    browserDisconnectTimeout: 30 * 1000, // default 2000
    browserDisconnectTolerance: 5, // default 0

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,
  });
};
