'use strict';
const fs = require('fs');
const mongoose = require('mongoose');
const activity = require('../controllers/activity');
const project = require('../controllers/project');
const Log = mongoose.model('Log');

//const Activity = mongoose.model('Activity');

module.exports = function(app) {
  app.get('/api/log/:name', function(req, res, next) {
    console.log(req.params);

    //const log = new Log();
    //log.data = req.params.name;
    //log.save(function(err) {
    //  console.log(err);
    //});
    //res.send(200, req.params);
    res.json(req.params);
    return next();
  });

  app.post('/api/log/', function(req, res, next) {
    console.log(req.body);

    //console.log(req.connection);

    //res.json(req.body);
    return next();
  }, api.log);

  // API Learning Analytics
  app.post('/api/activity', api.log, activity.process);
  app.post('/api/project', api.log, project.process);

  //app.post('/api/project', api.log, project.process);
  app.param('projectId', project.projectById);
  app.get('/api/project/:projectId', project.read);
  app.get('/api/project/:projectId/timing', project.timing.read);
  app.get('/api/project/:projectId/timing/users', project.timing.readByUsers);
  app.get('/api/project/:projectId/timing/user/:userId', project.timing.readByUserId);
  app.get('/api/project/:projectId/users', project.users.readAll);
  app.get('/api/project/:projectId/users/:userId', project.users.readByUserId);

  //app.get('/api/project/:projectId/actvities', project.activities.read);

  //app.get('/api/activity', activity.list);
  app.param('activityId', activity.activityById);
  app.get('/api/activity/:activityId', activity.read);
  app.get('/api/activity/:activityId/users/:userId', activity.users.read);
  app.get('/api/activity/:activityId/answers', activity.answers);

  //app.get('/api/activity/:activityId', api.log, activity.getData);
};

var api = {};
api.log = function(req, res, next) {
  if (req.method !== 'POST') {
    next();
  }

  var ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  // se envia una respuesta inmediata al cliente
  res.send(200);

  // más adelante se procesa los datos
  //console.log(req.body);

  // a partir de la respuesta se hace todo el proceso
  // @TODO
  const log = new Log();
  log.scope = req.body.scope;
  log.event = req.body.event;
  delete req.body.scope;
  delete req.body.event;

  log.data = req.body || req.params;
  log.ipAddress = ip;
  log.save(function(err) {
    if (err) {
      console.log(err);
    }
  });

  // se le pasa el objeto log al middleware
  req.log = log;

  console.log('SCOPE: ' + log.scope + ', EVENT: ' + log.event);
  next();
};
