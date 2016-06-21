'use strict';

const _ = require('lodash');
const restify = require('restify');
const mongoose = require('mongoose');
const activityCtrl = require('./activity');
const Activity = mongoose.model('Activity');
const ProjectAPI = mongoose.model('Project');

const webConnection = mongoose.createConnection('mongodb://193.147.62.217:5858/dedos', {
  server: { poolSize: 5 }
});
const Schema = new mongoose.Schema({});
const Project = webConnection.model('Project', Schema);

/**
 * Route middlewares
 */
exports.projectById = function(req, res, next, id) {
  // READ
  //ProjectModelWeb.find({ _id: id }, function(err, project) {
  //  console.log(project);
  //});
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new restify.NotFoundError('Project is invalid'));
  }

  let totalUsers = 0;
  let totalActivities = 0;
  let totalActivitiesDone = 0;
  let usersFinished = 0;
  Project.findOne({ _id: id })
  .then(function(projectDoc) {
      let project = projectDoc.toObject();
      totalUsers = project.players.length;
      totalActivities = project.activities.length;
      let criteria = { activityId: { $in: project.activities } };
      return Activity.find(criteria);
    })
  .then(function(activities) {
      totalActivitiesDone = activities.length;
      let duration = 0;
      let correct = 0;
      let failed = 0;
      let finishedArr = [];
      let result = {};
      activities.forEach(function(activity, index) {
        let activityResume = getActivityResume(activity);
        duration += activityResume.avgDuration;
        correct += activityResume.correct;
        failed += activityResume.failed;
        finishedArr.push(activityResume.finished);
        if (index === 5 - 1) {
          let finishedArrByAsc = finishedArr.sort((a, b) => b - a);
          usersFinished = finishedArrByAsc[finishedArrByAsc.length - 1];
        }
      });

      // resultados totales de las actividades
      let notAnswered = (totalUsers * totalActivitiesDone) - (correct + failed);
      let total = notAnswered + (correct + failed);
      duration /= totalActivitiesDone;

      return { duration, correct, failed, notAnswered, total };
    })
  .then(function(activities) {
      let finished = usersFinished;
      let notFinished = totalUsers - finished;
      let total = totalUsers;
      let users = {};
      users = { finished, notFinished, total };
      return { users, activities };
    })
  .then(function(result) {
      res.send(result);
    })
  .catch(function(err) {
      console.log(err);
      next(new restify.NotFoundError('No project with that identifier has been found'));
    });

  ////

  //ProjectAPI.findOne({ projectId: id }).exec(function(err, project) {
  //  if (err) {
  //    return next(err);
  //  } else if (!project) {
  //    return next(new restify.NotFoundError('No project with that identifier has been found'));
  //  }
  //
  //  req.project = project;
  //  next();
  //});
};

exports.read = function(req, res) {
  const project = req.project ? req.project.toJSON() : {};
  res.json(project);
};

const usersController = {
  readAll: function(req, res) {
    const userId = req.params.userId;
    const project = req.project;
    const user = _.find(project.users, (o) => o.user == userId);
    res.json(user);
  },

  readByUserId: function(req, res, next, id) {

  }
};

exports.users = usersController;

/**
 * Obtiene un resumen estadistico por actividad
 *
 * @param activity Objeto del modelo Activity
 * @returns {*}
 */
function getActivityResume(activity) {
  if (!activity) {
    return false;
  }

  let duration = 0;
  let correct = 0;
  let failed = 0;
  let finished = 0;
  let users = activity.users.length || 0;
  let tokens = [];
  _.map(activity.users, (user) => {
    if (user.tries[user.tries.length - 1]) {
      duration += user.tries[user.tries.length - 1].duration;
    }

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

  return {
    avgDuration: (duration / parseInt(activity.users.length)),
    correct,
    failed,
    finished,
    answers: correct + failed,
    users,
    tokens
  };
}

exports.process = function(req, res, next) {
  const log = req.log;

  switch (log.event) {
    case 'load':
      onLoadproject(log.data);
      break;
    case 'answer':
      onAnswerproject(log.data);
      break;
  }
};

function loadproject(projectId) {
  let result = project.load({ criteria: { projectId: projectId } })
    .then(function(project, err) {
      if (!project) {
        project = new project();
        project.projectId = projectId;
      }

      return project;
    });

  return result;
}

/**
 * En funcion de los eventos se procesará
 * de diferente forma añadiendolo al modelo principal project
 *
 * @param {Object} data
 * @returns {Object} promise
 */

/**
 * Evento al cargar una actividad
 *
 * @param data
 * @param data.event 'load'
 * @param data.project
 * @param data.user
 */
function onLoadproject(data) {
  let result = loadproject(data.project._id)
    .then(function(project) {
      if (!data.user) {
        return true;
      }

      // busqueda del usuario dentro del array project.users
      if (_.findIndex(project.users, (o) => o.user == data.user._id) === -1) {
        // se añade a la actividad
        project.users.push({
          user: data.user._id
        });
      }

      return project.save();
    });

  return result;
}

/**
 * Evento que se lanza cuando el usuario
 * contesta en una actividad
 *
 * @param data
 * @param data.event 'answer'
 * @param data.project
 * @param data.user
 * @param data.isCorrect
 */
function onAnswerproject(data) {
  let result = loadproject(data.project._id)
    .then(function(project) {
      let user = _.find(project.users, (o) => o.user == data.user._id);

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

      return project.save();
    });

  return result;
}
