'use strict';

const _ = require('lodash');
const mongoose = require('mongoose');
const Activity = mongoose.model('Activity');

/**
 * Route middlewares
 */
exports.process = function(req, res, next) {
  const log = req.log;

  switch (log.event) {
    case 'load':
      onLoadActivity(log.data);
      break;
    case 'answer':
      onAnswerActivity(log.data);
      break;
  }
};

function loadActivity(activityId) {
  let result = Activity.load({ criteria: { activityId: activityId } })
    .then(function(activity, err) {
      if (!activity) {
        activity = new Activity();
        activity.activityId = activityId;
      }

      return activity;
    });

  return result;
}

/**
 * En funcion de los eventos se procesará
 * de diferente forma añadiendolo al modelo principal Activity
 *
 * @param {Object} data
 * @returns {Object} promise
 */

/**
 * Evento al cargar una actividad
 *
 * @param data
 * @param data.event 'load'
 * @param data.activity
 * @param data.user
 */
function onLoadActivity(data) {
  let result = loadActivity(data.activity._id)
  .then(function(activity) {
      if (!data.user) {
        return true;
      }

      // busqueda del usuario dentro del array activity.users
      if (_.findIndex(activity.users, (o) => o.user == data.user._id) === -1) {
        // se añade a la actividad
        activity.users.push({
          user: data.user._id
        });
      }

      return activity.save();
    });

  return result;
}

/**
 * Evento que se lanza cuando el usuario
 * contesta en una actividad
 *
 * @param data
 * @param data.event 'answer'
 * @param data.activity
 * @param data.user
 * @param data.isCorrect
 */
function onAnswerActivity(data) {
  let result = loadActivity(data.activity._id)
  .then(function(activity) {
      let user = _.find(activity.users, (o) => o.user == data.user._id);
      if (data.isFinished) {
        //user.tries.count += 1;
        //user.tries.finishTime = new Date();
        //
        //// duración de la actividad en segundos
        //user.tries.duration = (new Date(user.finishTime) - new Date(user.startTime)) / 1000;
      }
      if (user.tokens) {
        let token = data.tokens[Object.keys(data.tokens)];
        user.tokens.push({
          token: token.id,
          isValid: token.valid,
          order: user.tokens.length + 1
        });
      }

      user.isCorrect = data.isFinished ? data.isCorrect : false;
      user.isFinished = data.isFinished;
      user.answerId = data.answer._id;

      return activity.save();
    });

  return result;
}
