module.exports = function (grunt) {

  'use strict';
  console.log(process.cwd() + "/build")

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
        src: "build/orestes-mongo*.zip",
        dest: "build/"
      }
    },

    run: {
      server: {
        cmd: "java",
        args: [
          '-jar',
          grunt.file.expand({cwd: 'build'}, 'orestes-mongo*.jar')[0]
        ],
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
    },
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
    'run:server',
    'karma:test',
    'stop:server'
  ]);

  grunt.registerTask('index', 'Build library index.', function () {
    var tmpl = grunt.file.read('tool/loader.js');

    var index = tmpl.replace('[]', JSON.stringify(jahdep('src'), null, "  "));

    grunt.file.write('index.js', index);
  });
};