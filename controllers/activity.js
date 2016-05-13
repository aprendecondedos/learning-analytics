'use strict';

const mongoose = require('mongoose');
const Activity = mongoose.model('Activity');

/**
 * Route middlewares
 */
exports.process = function(req, res, next) {
  console.log('hecho');
  const activity = new Activity();
  activity.activityId = mongoose.Types.ObjectId(req.body.id);
  console.log(activity);
  activity.save(function(err) {
    if (err) {
      console.log(err);
    }
  });
};
