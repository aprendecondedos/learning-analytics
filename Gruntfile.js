'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    env: {
      test: {
        NODE_ENV: 'test'
      },
      dev: {
        NODE_ENV: 'development'
      },
      prod: {
        NODE_ENV: 'production'
      }
    },
    run: {
      dev: {
        args: ['server.js', '--debug', '--harmony']
      }
    },
    jasmineNodejs: {
      options: {
        specNameSuffix: 'spec.js'
      },
      all: {
        specs: [
          'test/*.spec.js'
        ]
      }
    },
    jscs: {
      src: [
        'Gruntfile.js',
        'index.js',
        'routes/**/*.js',
        'common/**/*.js',
        'tests/**/*.js'
      ],
      options: {
        config: '.jscsrc',
        esnext: true, // If you use ES6 http://jscs.info/overview.html#esnext
        verbose: true, // If you need output with rule names http://jscs.info/overview.html#verbose
        requireCurlyBraces: ['if']
      }
    },
    execute: {
      target: {
        src: ['index.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-run');

  // Load NPM tasks
  require('load-grunt-tasks')(grunt);

  // Default task(s).
  grunt.registerTask('default', [
    'env:dev',
    'jscs',
    'run:dev'
  ]);

};

