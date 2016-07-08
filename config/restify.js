'use strict';

/**
 * Module dependencies.
 */
const bunyan = require('bunyan');
const config = require('./config')();
const restify = require('restify');
const path = require('path');

/**
 * Invoke modules server configuration
 */
module.exports.initModulesConfiguration = function(app, db) {
  config.files.server.configs.forEach(function(configPath) {
    require(path.resolve(configPath))(app, db);
  });
};

/**
 * Configure Restify headers configuration
 */
module.exports.initRestify = function(app) {
  app.use(restify.bodyParser({ mapParams: false }));
  app.use(restify.queryParser());
  app.use(restify.CORS());
  app.opts(/.*/, function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method'));
    res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
    res.send(200);
    return next();
  });

  app.use(restify.jsonp());
  app.use(restify.gzipResponse());
  app.pre(restify.pre.sanitizePath());
};

/**
 * Configure Restify headers configuration
 */
module.exports.initLogger = function(app) {
  app.log = bunyan.createLogger({
    name: 'dedos-analytics',
    level: process.env.LOG_LEVEL || 'info',
    stream: process.stdout,
    serializers: bunyan.stdSerializers
  });
};

/**
 * Configure Restify headers configuration
 */
module.exports.initFormatterHeaders = function(app) {
  app.formatters = {
    'application/json': function(req, res, body, cb) {
      res.setHeader('Cache-Control', 'must-revalidate');

      // Does the client *explicitly* accepts application/json?
      var sendPlainText = (req.header('Accept').split(/, */).indexOf('application/json') === -1);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      if (body instanceof Error) {
        res.statusCode = body.statusCode || 500;
        body = body.message;
      } else if (typeof (body) === 'object') {
        body = body.task || JSON.stringify(body);
      } else {
        body = body.toString();
      }

      res.setHeader('Content-Length', Buffer.byteLength(body));
      return cb(null, body);
    }
  };
};

/**
 * Configure Restify variables
 */
module.exports.initRestifyVariables = function(app) {
  app.name = 'dedos-analytics';
  this.initLogger(app);
  this.initFormatterHeaders(app);
};

/**
 * Configure the modules server routes
 */
module.exports.initModulesServerRoutes = function(app) {
  // Globbing routing files
  config.files.server.routes.forEach(function(routePath) {
    require(path.resolve(routePath))(app);
  });
};

/**
 * Initialize the Express application
 */
module.exports.init = function(db) {
  // Initialize express app
  const app = restify.createServer();

  // Initialize Restify configuration
  this.initRestify(app);

  // Initialize Restify local variables
  this.initRestifyVariables(app);

  // Initialize modules server routes
  this.initModulesServerRoutes(app);

  // Initialize Modules configuration
  this.initModulesConfiguration(app);

  return app;
};
