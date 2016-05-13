'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var Log = mongoose.model('Log');
/**
 * Logging Mongo Schema
 * event: {create, update, delete}
 */
var activitySchema = new Schema({
  activityId: Schema.Types.ObjectId,

  // Listado de usuarios que han terminado la actividad
  users: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    isCorrect: { type: Boolean, default: false },
    finishTime: { type: Boolean, default: false },
    tries: { type: Number, default: 0 }
  }]
});

/**
 * Hooks
 */
activitySchema.pre('save', function(next, req) {
  console.log(req);
  next();
});

mongoose.model('Activity', activitySchema);

//Log.discriminator('Activity', activitySchema);
