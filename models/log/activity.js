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
  projectId: Schema.Types.ObjectId,

  // Listado de usuarios con propiedades como análisis
  users: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    isCorrect: { type: Boolean, default: false },
    isFinished: { type: Boolean, default: false },
    tries: [{
      answerId: { type: Schema.Types.ObjectId, ref: 'Answer' },
      startTime: { type: Date },
      finishTime: { type: Date },
      duration: { type: Number, default: 0 }, // en segundos
      tokens: [{
        token: { type: Schema.Types.ObjectId, ref: 'Token' },
        isValid: { type: Boolean, default: false },
        order: { type: Number, default: 0 }
      }]
    }],
    answers: [{ type: Schema.Types.ObjectId, ref: 'Answer' }]
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
