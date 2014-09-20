// Karma configuration
// Generated on Thu Mar 06 2014 17:16:01 GMT+0100 (Mitteleuropäische Zeit)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',

    // frameworks to use
    frameworks: ['mocha', 'chai', 'chai-as-promised'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/jahcode/jahcode.js',
      'build/baqend.js',
      'spec/env.js',
      'spec/**/*.spec.js'
    ],

    // list of files to exclude
    exclude: [],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],

    // web server hostname
    //hostname: 'localhost',

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
    browsers: ['Chrome', 'Firefox', 'PhantomJS', 'IE9'],

    customLaunchers: {
      'IE9': {
        base: 'WebDriver',
        config:  {
          hostname: '134.100.11.233',
          port: 4444
        },
        browserName: 'internet explorer',
        platform: 'WINDOWS',
        version: '9',
        name: 'Karma'
      }
    },

    // How long does Karma wait for a browser to reconnect (in ms).
    browserNoActivityTimeout: 10000,

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 10000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
