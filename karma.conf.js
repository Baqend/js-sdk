// Karma configuration
// Generated on Thu Mar 06 2014 17:16:01 GMT+0100 (Mitteleuropäische Zeit)

module.exports = function(config) {
  var webdriverConfig = {
    hostname: 'jenkins.baqend.com',
    port: 4444
  };

  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',

    // frameworks to use
    frameworks: ['mocha', 'chai', 'chai-as-promised'],

    client: {
      mocha: {
        timeout: 30000
      }
    },

    // list of files / patterns to load in the browser
    files: [
      'node_modules/jahcode/jahcode.js',
      'build/baqend.js',
      'spec/env.js',
      'spec/helper.js',
      'spec/**/*.spec.js',
      {pattern: 'build/*.html', included: false, watched: false}
    ],

    // list of files to exclude
    exclude: [],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],

    // web server hostname
    hostname: 'local.baqend.com',

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome', 'Firefox', 'PhantomJS'],

    customLaunchers: {
      'Chrome-Linux': {
        base: 'WebDriver',
        config: webdriverConfig,
        browserName: 'chrome',
        platform: 'LINUX',
        version: '',
        name: 'Karma'
      },
      'Firefox-Linux': {
        base: 'WebDriver',
        config: webdriverConfig,
        browserName: 'firefox',
        platform: 'LINUX',
        version: '',
        name: 'Karma'
      },
      'Safari-Mac': {
        base: 'WebDriver',
        config: webdriverConfig,
        browserName: 'safari',
        platform: 'MAC',
        version: '',
        name: 'Karma'
      },
      'Chrome-Win': {
        base: 'WebDriver',
        config: webdriverConfig,
        browserName: 'chrome',
        platform: 'WINDOWS',
        version: '',
        name: 'Karma'
      },
      'Firefox-Win': {
        base: 'WebDriver',
        config: webdriverConfig,
        browserName: 'firefox',
        platform: 'WINDOWS',
        version: '',
        name: 'Karma'
      },
      'IE9-Win': {
        base: 'WebDriver',
        config: webdriverConfig,
        browserName: 'internet explorer',
        platform: 'WINDOWS',
        version: '9',
        name: 'Karma'
      },
      'IE10-Win': {
        base: 'WebDriver',
        config: webdriverConfig,
        browserName: 'internet explorer',
        platform: 'WINDOWS',
        version: '10',
        name: 'Karma'
      },
      'IE11-Win': {
        base: 'WebDriver',
        config: webdriverConfig,
        browserName: 'internet explorer',
        platform: 'WINDOWS',
        version: '11',
        name: 'Karma'
      }
    },

    // How long does Karma wait for a browser to reconnect (in ms).
    browserNoActivityTimeout: 10 * 60 * 1000,

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 10 * 60 * 1000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
