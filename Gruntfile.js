module.exports = function (grunt) {

  'use strict';

  // redirect mocha node tests to the given xml
  // @see https://github.com/peerigon/xunit-file/blob/master/lib/xunit-file.js
  process.env.JUNIT_REPORT_PATH = 'build/test-results/node.xml';

  var TEST = 'spec/{env.js,spec.helper.js,**/*.spec.js}';

  var orestesMessagePath = '../orestes/orestes-message';

  grunt.initConfig({
    /**
     * Building
     * ========
     */
    browserify: {
      options: {
        browserifyOptions: {
          builtins: [],
          insertGlobals: false,
          detectGlobals: false,
          standalone: "baqend"
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
            builtins: [],
            insertGlobals: false,
            detectGlobals: false,
            standalone: "baqend",
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
          'build/debug.html': 'tpl/debug.tpl'
        }
      },
      loader: {
        options: {
          data: {
            loader: grunt.file.read('loader.js')
          }
        },
        files: {
          'build/test-loader.html': 'tpl/test-loader.tpl'
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

    run: {
      server: {
        cmd: "java",
        options: {
          cwd: "node_modules/orestes",
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
            'build/install/orestes-message/lib/orestes-message-1.0.0-SNAPSHOT.jar',
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
        configFile: 'karma.conf.js',
      },
      internal: {
        hostname: 'fb.baqend.com',
        configFile: 'karma.conf.js',
        browsers: ['IE9-Win', 'IE10-Win', 'IE11-Win', 'Firefox-Win', 'Chrome-Win', 'Chrome-Linux', 'Firefox-Linux'],
        singleRun: true
      },
      test: {
        hostname: 'jenkins.baqend.com',
        configFile: 'karma.conf.js',
        browsers: ['PhantomJS', 'IE9-Win', 'IE10-Win', 'IE11-Win', 'Firefox-Win', 'Chrome-Win', 'Chrome-Linux', 'Firefox-Linux'],
        reporters: ['junit'],
        singleRun: true,
        junitReporter: {
          outputFile: 'build/test-results/karma.xml'
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
        files: {
          'dist/baqend.min.js': 'dist/baqend.js',
          'dist/loader.js': 'loader.js'
        }
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
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('debug', [
    'template:debug',
    'template:loader',
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
    'template:loader',
    'prepare:server',
    'run:server',

    // don't fail task when a test failed
    'force:on',
    'karma:test',
    'mochaTest:test',
    'force:restore',

    'stop:server'
  ]);

  grunt.registerTask('build', [
      'clean:msg',
      'run:buildMsgProject',
      'run:buildMsg'
  ]);

  grunt.registerTask('default', 'debug');

  grunt.registerTask('prepare', 'Finds the executable server jar and configuration in node_modules/orestes folder', function() {
    var jar = grunt.file.expand({cwd: 'node_modules/orestes'}, 'orestes-mongo*.jar')[0];

    grunt.config('run.server.args', ['-jar', jar, "config.json"]);

    grunt.log.write('Executable Jar: ' + jar);
  });

  var previous_force_state = grunt.option("force");

  grunt.registerTask("force", 'A helper task for temporary en/disabling the force flag', function(set){
    if (set === "on") {
      grunt.option("force", true);
    } else if (set === "off") {
      grunt.option("force", false);
    } else if (set === "restore") {
      grunt.option("force", previous_force_state);
    }
  });

};