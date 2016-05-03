'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var logSchema = new Schema({
  data: String
});

mongoose.model('Log', logSchema);

