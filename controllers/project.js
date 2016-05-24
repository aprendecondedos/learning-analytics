'use strict';

const mongoose = require('mongoose');
const Project = mongoose.model('Project');

/**
 * Route middlewares
 */
exports.process = function(req, res, next) {
  const project = new Project();
  //project.activityId = mongoose.Types.ObjectId(req.body.id);
  //console.log(project);
  project.save(function(err) {
    if (err) {
      console.log(err);
    }
  });
};
