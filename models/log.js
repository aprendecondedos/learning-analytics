'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Logging Mongo Schema
 * event: {create, update, delete}
 */
var logSchema = new Schema({
  //type: {
  //  type: String,
  //  required: true
  //},
  //event: {
  //  type: String,
  //  required: true
  //},
  //idEvent: {
  //  type: Number,
  //  required: true
  //},
  //action: {
  //  type: String
  //},
  //user: {
  //  type: Number
  //},
  scope: {
    type: String
  },
  event: {
    type: String
  },
  data: Schema.Types.Mixed,
  ipAddress: {
    type: String,
    validate: {
      validator: function(v) {
        return /^(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(.(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})){3}$/.test(v);
      },

      message: '{VALUE} is not a valid IP'
    }
  },
  time: { type: Date, default: Date.now }
});

mongoose.model('Log', logSchema);

