'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Logging Mongo Schema
 * event: {create, update, delete}
 */
var projectSchema = new Schema({
  projectId: Schema.Types.ObjectId,
  updatedDate: { type: Date, default: Date.now },

  // Listado de usuarios que han terminado la actividad
  users: [{
    user: { type: String, default: '' },
    finished: { type: Boolean, default: false }
  }]
});

mongoose.model('Project', projectSchema);
