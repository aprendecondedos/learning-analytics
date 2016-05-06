'use strict';
const glob = require('glob');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const assets = {
  models: 'models/**/*.js',
  configs: 'config/*.js',
  routes: 'routes/*.js'
};

/**
 * Get files by glob patterns
 */
var getGlobbedPaths = function(globPatterns, excludes) {
  // URL paths regex
  var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

  // The output array
  var output = [];

  // If glob pattern is array then we use each pattern in a recursive way, otherwise we use glob
  if (_.isArray(globPatterns)) {
    globPatterns.forEach(function(globPattern) {
      output = _.union(output, getGlobbedPaths(globPattern, excludes));
    });
  } else if (_.isString(globPatterns)) {
    if (urlRegex.test(globPatterns)) {
      output.push(globPatterns);
    } else {
      var files = glob.sync(globPatterns);
      if (excludes) {
        files = files.map(function(file) {
          if (_.isArray(excludes)) {
            for (var i in excludes) {
              if (excludes.hasOwnProperty(i)) {
                file = file.replace(excludes[i], '');
              }
            }
          } else {
            file = file.replace(excludes, '');
          }

          return file;
        });
      }

      output = _.union(output, files);
    }
  }

  return output;
};

/**
 * Set configuration object
 */
module.exports = function() {
  //var config = require('./default.js');

  // Get the default config
  var defaultConfig = require(path.join(process.cwd(), 'config/env/default'));

  // Get the current config
  var environmentConfig = require(path.join(process.cwd(), 'config/env/env.' + (process.env.NODE_ENV) + '.js'));

  // Merge config files
  var config = _.merge(defaultConfig, environmentConfig);
  config = _.merge(config,
    (fs.existsSync(path.join(process.cwd(), 'config/env/local-' + process.env.NODE_ENV + '.js'))
      && require(path.join(process.cwd(), 'config/env/local-' + process.env.NODE_ENV + '.js')))
    || {});

  // Appending files
  config.files = {
    server: {},
    client: {}
  };

  // Setting Globbed model files
  config.files.server.models = getGlobbedPaths(assets.models);

  // Setting Globbed route files
  config.files.server.routes = getGlobbedPaths(assets.routes);

  // Setting Globbed config files
  config.files.server.configs = getGlobbedPaths(assets.config);

  return config;
};
