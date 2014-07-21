module.exports = function (grunt) {

  'use strict';

  var jar = null;

  grunt.initConfig({
    /**
     * Building
     * ========
     */
    browserify: {
      debug: {
        files: {
          'build/baqend.js': ['lib/index.js']
        },
        options: {
          browserifyOptions: {
            builtins: false
          },
          bundleOptions: {
            debug: true,
            insertGlobals: false,
            standalone: "jspa"
          }
        }
      },
      dist: {
        files: {
          'dist/baqend.js': ['lib/index.js']
        },
        options: {
          browserifyOptions: {
            builtins: false
          },
          bundleOptions: {
            insertGlobals: false,
            standalone: "jspa"
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
      }
    },

    karma: {
      dev: {
        configFile: 'karma.conf.js'
      },
      test: {
        configFile: 'karma.conf.js',
        reporters: ['junit'],
        singleRun: true,
        browsers: ['PhantomJS'],

        junitReporter: {
          outputFile: 'build/test-results.xml'
        }
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
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-zip');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('default', [
    'connect',
    'watch'
  ]);

  grunt.registerTask('dist', [
    'browserify',
    'uglify',
    'jsdoc'
  ]);

  grunt.registerTask('test', [
    'browserify:debug',
    'unzip:test',
    'prepare:server',
    'run:server',
    'karma:test',
    'stop:server'
  ]);

  grunt.registerTask('prepare', 'Finds the executable server jar and configuration in build folder', function() {
    var jar = grunt.file.expand({cwd: 'build'}, 'orestes-mongo*.jar')[0];
    var config = grunt.file.expand({cwd: 'build'}, '*.json')[0];

    grunt.config('run.server.args', ['-jar', jar, config]);

    grunt.log.write('Executable Jar: ' + jar + ' Used config: ' + config);
  });

  grunt.registerTask('index', 'Build library index.', function () {
    var tmpl = grunt.file.read('tool/loader.js');

    var index = tmpl.replace('[]', JSON.stringify(jahdep('src'), null, "  "));

    grunt.file.write('index.js', index);
  });
};