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
    isFinished: { type: Boolean, default: false },
    finishTime: { type: Date },
    tries: { type: Number, default: 0 },
    answerId: { type: Schema.Types.ObjectId, ref: 'Answer' }
  }]
});

/**
 * Hooks
 */
activitySchema.pre('save', function(next, req) {
  next();
});

/**
 * Statics
 */
activitySchema.statics = {
  /**
   * Buscar proyecto por id
   *
   * @param {ObjectId} options
   */
  load: function(options, cb) {
    const criteria = options.criteria || { _id: options };
    return this.findOne(criteria)
      .exec(cb);
  }
};

mongoose.model('Activity', activitySchema);

//Log.discriminator('Activity', activitySchema);
