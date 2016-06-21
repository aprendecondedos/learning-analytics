'use strict';

const _ = require('lodash');
const restify = require('restify');
const mongoose = require('mongoose');
const Activity = mongoose.model('Activity');

/**
 * Route middlewares
 */
exports.load = function(req, res) {

};

exports.read = function(req, res) {
  const activity = req.activity ? req.activity.toJSON() : {};
  res.json(activity);
};

const usersController = {
  read: function(req, res) {
    const userId = req.params.userId;
    const activity = req.activity;
    const user = _.find(activity.users, (o) => o.user == userId);
    res.json(user);
  }
};

exports.users = usersController;

//{
//  "avgDuration": 2.974,
//  "correct": 2,
//  "failed": 0,
//  "answers": 2,
//  "users": 2
//}
/**
 * Estadisticas relacionadas con las respuestas
 * @param req
 * @param res
 * @returns {Number} avgDuration - duración media en segundos
 * @returns {Number} correct - total de respuestas correctas
 * @returns {Number} failed - total de respuestas incorrectas
 * @returns {Number} finished - total de usuarios que han terminado
 * @returns {Number} answers - total de respuestas
 * @returns {Number} users - total de usuarios que han respondido
 */
exports.answers = function(req, res) {
  const activity = req.activity;
  let duration = 0;
  let correct = 0;
  let failed = 0;
  let finished = 0;
  let users = activity.users.length || 0;
  let tokens = [];
  _.map(activity.users, (user) => {
    //duration += _.reduce(user.tries, (result, tries) => {
    //  return result + tries.duration;
    //}, 0);
    duration += user.tries[user.tries.length - 1].duration;

    if (user.isFinished) {
      finished += 1;
      correct += Number(user.isCorrect); // 0, 1
      failed += Number(!user.isCorrect); // 0, 1
    }

    // se obtiene los tokens y las veces que aparezca
    _.map(user.tries, (tries) => {
      _.map(tries.tokens, (token) => {
        let tokenIndex = _.findIndex(tokens, { token: token.token });
        if (tokenIndex !== -1) {
          tokens[tokenIndex].count += 1;
        } else {
          tokens.push({
            token: token.token,
            count: 1
          });
        }
      });
    });

  });

  const result = {
    avgDuration: (duration / parseInt(activity.users.length)),
    correct,
    failed,
    finished,
    answers: correct + failed,
    users,
    tokens
  };
  res.json(result);
};

exports.activityById = function(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new restify.NotFoundError('Activity is invalid'));
  }

  Activity.findOne({ activityId: id }).exec(function(err, activity) {
    if (err) {
      return next(err);
    } else if (!activity) {
      return next(new restify.NotFoundError('No activity with that identifier has been found'));
    }

    req.activity = activity;
    next();
  });
};

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
      if (_.findIndex(activity.users, (o) => o.user == data.user.id) === -1) {
        // se añade a la actividad
        activity.users.push({
          user: data.user.id
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
      let user = _.find(activity.users, (o) => o.user == data.user.id);

      // Se inicializa el array tries en el primer intento o para los siguientes
      if (!user.tries.length || user.tries[user.tries.length - 1].finishTime) {
        user.tries.push({});
      }

      let tries = user.tries[user.tries.length - 1];
      if (!tries.tokens.length) {
        tries.startTime = new Date();
        tries.answerId = data.answer._id;
      }

      let token = data.tokens[Object.keys(data.tokens)];
      tries.tokens.push({
        token: token.id,
        isValid: token.valid,
        order: tries.tokens.length + 1
      });
      if (data.isFinished) {
        // se termina el intento y se calcula la duración que haya tenido en realizar la actividad
        tries.finishTime = new Date();
        tries.duration = (new Date(tries.finishTime) - new Date(tries.startTime)) / 1000;
      }

      user.isCorrect = data.isFinished ? data.isCorrect : false;
      user.isFinished = data.isFinished;

      return activity.save();
    });

  return result;
}
