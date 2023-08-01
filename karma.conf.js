
var webdriverConfig = {
  hostname: 'selenium__standalone-chrome',
  port: 4444,
}

var By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until,
    chrome = require('selenium-webdriver/chrome');

module.exports = function (config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',

    // frameworks to use
    frameworks: ['mocha', 'chai', 'chai-as-promised'],

    client: {
      args:[
         process.env.TEST_SERVER
      ],
      mocha: {
        timeout: 30000,
      },
    },

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'node_modules/rxjs/bundles/rxjs.umd.js', included: true },
      { pattern: 'node_modules/validator/validator.js', included: true },
      { pattern: 'dist/baqend.es5.js', watched: true, included: true },
      {
        pattern: 'dist/baqend.es5.js.map', included: false, served: true, watched: true,
      },
      'spec/env.js',
      'spec/helper.js',
      'spec/**/*.spec.js',
      {
        pattern: 'spec/assets/*', watched: false, included: false, served: true, nocache: false,
      },
    ],

    proxies: {
      '/spec/': '/base/spec/',
    },

    // list of files to exclude
    exclude: [],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['junit'],

    // JUnit reporter output dir
    junitReporter: {
      outputDir: 'build/test-results/',
      outputFile : 'karma-result.xml'
    },

    // web server hostname
    hostname: process.env.KARMA_HOST || 'localhost',

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,

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
    browsers: ['SeleniumChrome'],

    customLaunchers: {
      SeleniumChrome: {
        base: "WebDriver",
        config: webdriverConfig,
        browserName: 'chrome',
        getDriver: function(){
          // example from https://www.npmjs.com/package/selenium-webdriver#usage
          var driver = new chrome.getDriver();
          return driver;
        },
        platform: 'LINUX',
        version: '',
        name: 'KarmaChrome',
        pseudoActivityInterval: 30000
      },
      HeadlessChrome: {
        base: "Chrome",
        flags: [
          "--headless",
          "--disable-gpu",
        ]
      },
      Chrome_without_security: {
        base: 'Chrome',
        // This option is needed to use the crypto module on http origins
        flags: ['--no-sandbox', '--disable-gpu',`--unsafely-treat-insecure-origin-as-secure=http://${process.env.KARMA_HOST}:9876`],
      },
      ...require('./localSeleniumBrowser'),
      ...require('./browserstack'),
    },

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
    singleRun: true,
  });
};
