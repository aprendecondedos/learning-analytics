'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var Log = mongoose.model('Log');
/**
 * Logging Mongo Schema
 * event: {create, update, delete}
 */
var projectSchema = new Schema({
  projectId: String,

  // Listado de usuarios que han terminado la actividad
  users: [{
    user: { type: String, default: '' },
    finished: { type: Boolean, default: false }
  }]
});

Log.discriminator('Project', projectSchema);
