'use strict';
const fs = require('fs');
const mongoose = require('mongoose');
const activity = require('../controllers/activity');
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
  app.post('/api/activity', api.log, activity.process);

  //app.param('activityId', activity.load);
  //app.get('/api/activity/:activityId', api.log, activity.getData);
};

var api = {};
api.log = function(req, res, next) {
  var ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  // se envia una respuesta inmediata al cliente
  res.send(200);
  console.log(req.body);

  // a partir de la respuesta se hace todo el proceso
  // @TODO
  const log = new Log();
  log.data = req.body || req.params;
  log.ip = ip;
  log.save(function(err) {
    if (err) {
      console.log(err);
    }
  });

  console.log('pasando por middleware');
  next();
};
