module.exports = function (grunt) {

  'use strict';

  // prevent grunt failing by test errors
  grunt.option('force', true);

  // redirect mocha node tests to the given xml
  // @see https://github.com/peerigon/xunit-file/blob/master/lib/xunit-file.js
  process.env.JUNIT_REPORT_PATH = 'build/test-results/node.xml';

  var TEST = 'spec/{env.js,**/*.spec.js}';

  var orestesMessagePath = '../orestes/orestes-message';

  grunt.initConfig({
    /**
     * Building
     * ========
     */
    browserify: {
      options: {
        browserifyOptions: {
          builtins: ['_process'],
          insertGlobals: false,
          standalone: "jspa"
        }
      },

      debug: {
        files: {
          'build/baqend.js': ['lib/index.js']
        },
        options: {
          watch: true,
          keepAlive: true,
          browserifyOptions: {
            builtins: ['_process'],
            insertGlobals: false,
            standalone: "jspa",
            debug: true
          }
        }
      },

      test: {
        files: {
          'build/baqend.js': ['lib/index.js']
        }
      },

      dist: {
        files: {
          'dist/baqend.js': ['lib/index.js']
        }
      }
    },

    /**
     * Debugging
     * =========
     */
    template: {
      debug: {
        options: {
          data: {
            scripts: grunt.file.expand(TEST)
          }
        },
        files: {
          'build/debug.html': 'debug/debug.html'
        }
      }
    },

    connect: {
      debug: {
        options: {
          open: {
            target: 'http://localhost:8000/build/debug.html',
            appName: 'Chrome'
          }
        }
      }
    },

    /**
     * Testing
     * =======
     */
    unzip: {
      test: {
        src: "build/orestes-*.zip",
        dest: "build/"
      }
    },

    run: {
      server: {
        cmd: "java",
        options: {
          cwd: "build",
          wait: false,
          ready: 5000
        }
      },
      buildMsgProject: {
        cmd: 'gradle',
        args: [
          'installApp'
        ],
        options: {
          cwd: orestesMessagePath,
          wait: true
        }
      },
      buildMsg: {
        cmd: 'java',
        args: [
            '-jar',
            'build/install/orestes-message/lib/orestes-message-1.0-SNAPSHOT.jar',
            'templates/js.ftl',
            __dirname + '/lib/message'
        ],
        options: {
          wait: true,
          cwd: orestesMessagePath
        }
      }
    },

    clean: {
      msg: {
        src: [
          'lib/message/*',
          '!lib/message/Message.js'
        ]
      }
    },

    karma: {
      dev: {
        configFile: 'karma.conf.js'
      },
      testPhantomjs: {
        configFile: 'karma.jenkins.conf.js',
        browsers: ['PhantomJS'],
        junitReporter: {
          outputFile: 'build/test-results/karma-phantomjs.xml'
        }
      },
      testChrome: {
        configFile: 'karma.jenkins.conf.js',
        browsers: ['Chrome_without_ssl-checking'],
        customLaunchers: {
          Chrome_without_security: {
            base: 'Chrome',
            flags: ['--ignore-certificate-errors']
          }
        },
        junitReporter: {
          outputFile: 'build/test-results/karma-chrome.xml'
        }
      },
      testFirefox: {
        configFile: 'karma.jenkins.conf.js',
        browsers: ['Firefox'],
        junitReporter: {
          outputFile: 'build/test-results/karma-firefox.xml'
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'mocha-jenkins-reporter'
        },
        src: [TEST]
      }
    },

    /**
     * Distribution
     * ============
     */
    uglify: {
      options: {
        preserveComments: 'some',
        banner: ''
      },

      dist: {
        src: 'dist/baqend.js',
        dest: 'dist/baqend.min.js'
      }
    },

    jsdoc: {
      dist: {
        src: ['lib/**/*.js'],
        options: {
          destination: 'dist/doc'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-template');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-zip');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('debug', [
    'template:debug',
    'connect:debug',
    'browserify:debug'
  ]);

  grunt.registerTask('dist', [
    'browserify:dist',
    'uglify:dist',
    'jsdoc:dist'
  ]);

  grunt.registerTask('test', [
    'browserify:test',
    'unzip:test',
    'prepare:server',
    'run:server',
    'karma:testPhantomjs',
    'karma:testChrome',
    'karma:testFirefox',
    'mochaTest:test',
    'stop:server'
  ]);

  grunt.registerTask('build', [
      'clean:msg',
      'run:buildMsgProject',
      'run:buildMsg'
  ]);

  grunt.registerTask('default', 'debug');

  grunt.registerTask('prepare', 'Finds the executable server jar and configuration in build folder', function() {
    var jar = grunt.file.expand({cwd: 'build'}, 'orestes-mongo*.jar')[0];
    var config = grunt.file.expand({cwd: 'build'}, '*.json')[0];

    grunt.config('run.server.args', ['-jar', jar, config]);

    grunt.log.write('Executable Jar: ' + jar + ' Used config: ' + config);
  });

};