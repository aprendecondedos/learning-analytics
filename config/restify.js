'use strict';

/**
 * Module dependencies.
 */
const bunyan = require('bunyan');
const config = require('configure');
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

      // Send as plain text
      if (sendPlainText) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }

      // Send as JSON
      if (!sendPlainText) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }

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
  return {
    name: 'dedos-analytics',
    log: log,
    formatters: {
      'application/json': function(req, res, body, cb) {
        res.setHeader('Cache-Control', 'must-revalidate');

        // Does the client *explicitly* accepts application/json?
        var sendPlainText = (req.header('Accept').split(/, */).indexOf('application/json') === -1);

        // Send as plain text
        if (sendPlainText) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }

        // Send as JSON
        if (!sendPlainText) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }

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
    }
  };
};

/**
 * Initialize the Express application
 */
module.exports.init = function(db) {
  // Initialize express app
  const app = restify.createServer();

  // Initialize Restify configuration
  this.initRestify(app);

  // Initialize formmatters headers
  this.initFormatterHeaders(app);

  // Initialize Restify local variables
  this.initRestifyVariables(app);

  // Initialize Modules configuration
  this.initModulesConfiguration(app);

  return app;
};