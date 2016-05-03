'use strict';
const fs = require('fs');
const mongoose = require('mongoose');
const Log = mongoose.model('Log');

module.exports = function(server) {
  server.get('/api/log/:name', function(req, res, next) {
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

  server.post('/api/log/', function(req, res, next) {
    console.log(req.body);
    res.json(req.body);
    return next();
  });
};
