var jahdep = require('./tool/merge.js');

module.exports = function(grunt) {

    'use strict';

    grunt.initConfig({
        concat: {
            dist: {
                src: jahdep(grunt, 'src'),
                dest: 'dist/jspa.js'
            }
        },

        uglify: {
            options: {
                preserveComments: 'some',
                banner: ''
            },

            build: {
                src: 'dist/jspa.js',
                dest: 'dist/jspa.min.js'
            }
        },

        jasmine: {
            test: {
                src: [
                    'node_modules/jahcode/jahcode.js',
                    'dist/jspa.js'
                ],
                options: {
                    specs: 'spec/*.spec.js',
                    helpers: 'spec/*.helper.js'
                }
            }
        },

        template: {
            jahcode: {
                options: {
                    data: function() {
                        return {
                            scripts: jahdep(grunt, 'src')
                        };
                    }
                },
                files: {
                    'dist/sandbox.html': 'tests/sandbox.html'
                }
            }
        },

        connect: {
            server: {
                options: {
                    hostname: '*',
                    port: 80,
                    livereload: true
                }
            }
        },

        watch: {
            options: {
                forever: false,
                livereload: true
            },
            src: {
                files: "src/**/*.js",
                tasks: ['template', 'concat']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.registerTask('default',
        [
            'connect',
            'watch'
        ]);

    grunt.registerTask('dist',
        [
            'concat',
            'uglify'
        ]);
};