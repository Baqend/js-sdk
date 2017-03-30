module.exports = function (grunt) {
  'use strict';

  var banner = '/*! <%= pkg.name %> <%= pkg.version %> | <%= copyright %> | <%= pkg.license %> */\n';
  var longBanner = grunt.file.read('tpl/banner.tpl');

  var TEST = 'spec/**/*.spec.js';

  var browserifyOptions = {
    builtins: [],
    insertGlobalVars: {
      Buffer: undefined,
      __filename: undefined,
      __dirname: undefined,
      process: undefined
    },
    standalone: "DB"
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copyright: grunt.file.read('LICENSE.md').split(/[\r\n]/)[0],
    date: new Date().toUTCString(),

    /**
     * Building
     * ========
     */
    browserify: {
      options: {
        browserifyOptions: browserifyOptions,
        banner: longBanner,
        plugin: ['./scripts/babel-helper', 'bundle-collapser/plugin', 'browserify-derequire'],
        exclude: ['rxjs/Observable'], //never bundle rxjs
        transform: [
          ['babelify', {
            "plugins": ["external-helpers"]
          }]
        ]
      },

      debug: {
        files: {
          'build/baqend.js': ['realtime/index.js']
        },
        options: {
          watch: true,
          keepAlive: true,
          browserifyOptions: Object.assign({debug: true}, browserifyOptions),
          banner: '',
          plugin: [],
          transform: ['babelify']
        }
      },

      test: {
        files: {
          'build/baqend.js': ['realtime/index.js']
        }
      },

      dist: {
        files: {
          'dist/baqend.js': ['lib/index.js'],
          'dist/baqend-realtime.js': ['realtime/index.js']
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

    clean: {
      dist: {
        src: [
          'dist', 'doc'
        ]
      }
    },

    karma: {
      dev: {
        configFile: 'karma.conf.js'
      },
      test: {
        hostname: 'jenkins.baqend.com',
        configFile: 'karma.conf.js',
        client: {
          mocha: {
            timeout: 30000
          }
        },
        browsers: ['PhantomJS', 'Edge-Win', 'IE10-Win', 'IE11-Win', 'Firefox-Win', 'Chrome-Win', 'Chrome-Linux', 'Firefox-Linux', 'Safari-Mac'],
        reporters: ['junit'],
        singleRun: true,
        junitReporter: {
          outputDir: 'build/test-results/'
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'mocha-jenkins-reporter',
          quiet: true,
          reporterOptions: {
            junit_report_name: "Node Tests",
            junit_report_path: "build/test-results/node.xml",
            junit_report_stack: 1
          },
          timeout: 4000
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
        preserveComments: false,
        banner: banner,
        mangle: true,
        compress: true
      },

      dist: {
        files: {
          'dist/baqend.min.js': 'dist/baqend.js',
          'dist/baqend-realtime.min.js': 'dist/baqend-realtime.js'
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

  grunt.registerTask('debug', [
    'template:debug',
    'connect:debug',
    'browserify:debug'
  ]);

  grunt.registerTask('dist', [
    'clean:dist',
    'browserify:dist',
    'uglify:dist'
  ]);

  grunt.registerTask('test', [
    'browserify:test',

    // don't fail task when a test failed
    'force:on',
    'karma:test',
    'mochaTest:test',
    'force:restore'
  ]);

  grunt.registerTask('default', 'debug');

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