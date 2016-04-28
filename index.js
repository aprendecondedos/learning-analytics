/*jslint node: true, indent: 2 */
'use strict';

const restify = require('restify');
const bunyan  = require('bunyan');
const routes  = require('./routes/');

const log = bunyan.createLogger({
  name: 'dedos-analytics',
  level: process.env.LOG_LEVEL || 'info',
  stream: process.stdout,
  serializers: bunyan.stdSerializers
});

const server = restify.createServer({
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
});

server.use(restify.bodyParser({ mapParams: false }));
server.use(restify.queryParser());
server.use(restify.CORS());
server.use(restify.jsonp());
server.use(restify.gzipResponse());
server.pre(restify.pre.sanitizePath());

// Default error handler. Personalize according to your needs.
server.on('uncaughtException', function(req, res, err) {
  console.log('Error!');
  console.log(err);
  res.send(500, { success: false });
});
/*jslint unparam:false*/

//server.on('after', restify.auditLogger({ log: log }));
routes(server);

console.log('Server started.');
server.listen(8888, function() {
  log.info('%s listening at %s', server.name, server.url);
});

