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
const User = webConnection.model('User', Schema);

/**
 * Route middlewares
 */
exports.projectById = function(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.send(JSON.stringify(new restify.NotFoundError('Project is invalid')));
  }

  //
  Project.findOne({ _id: id }, function(err, project) {
    if (err) {
      return next(err);
    } else if (!project) {
      res.send(JSON.stringify(new restify.NotFoundError('No project with that identifier has been found')));
    }

    //req.project = project;
    req.project = project.toObject();
    next();
  });

  //
  //let totalUsers = 0;
  //let totalActivities = 0;
  //let totalActivitiesDone = 0;
  //let usersFinished = 0;
  //Project.findOne({ _id: id })
  //.then(function(projectDoc) {
  //    let project = projectDoc.toObject();
  //    totalUsers = project.players.length;
  //    totalActivities = project.activities.length;
  //    let criteria = { activityId: { $in: project.activities } };
  //    return Activity.find(criteria);
  //  })
  //.then(function(activities) {
  //    totalActivitiesDone = activities.length;
  //    let duration = 0;
  //    let correct = 0;
  //    let failed = 0;
  //    let finishedArr = [];
  //    let result = {};
  //    activities.forEach(function(activity, index) {
  //      let activityResume = getActivityResume(activity);
  //      duration += activityResume.avgDuration;
  //      correct += activityResume.correct;
  //      failed += activityResume.failed;
  //      finishedArr.push(activityResume.finished);
  //      if (index === 5 - 1) {
  //        let finishedArrByAsc = finishedArr.sort((a, b) => b - a);
  //        usersFinished = finishedArrByAsc[finishedArrByAsc.length - 1];
  //      }
  //    });
  //
  //    // resultados totales de las actividades
  //    let notAnswered = (totalUsers * totalActivitiesDone) - (correct + failed);
  //    let total = notAnswered + (correct + failed);
  //    duration /= totalActivitiesDone;
  //
  //    return { duration, correct, failed, notAnswered, total };
  //  })
  //.then(function(activities) {
  //    let finished = usersFinished;
  //    let notFinished = totalUsers - finished;
  //    let total = totalUsers;
  //    let users = {};
  //    users = { finished, notFinished, total };
  //    return { users, activities };
  //  })
  //.then(function(result) {
  //    res.send(result);
  //  })
  //.catch(function(err) {
  //    console.log(err);
  //    next(new restify.NotFoundError('No project with that identifier has been found'));
  //  });
};

exports.read = function(req, res) {
  const project = req.project;
  let usersFinished = 0;

  let totalUsers = project.players.length;
  let totalActivities = project.activities.length;
  let activityFindCriteria = { activityId: { $in: project.activities } };
  Activity.find(activityFindCriteria)
    .then(function(activities) {
      let totalActivitiesDone = activities.length || 0;
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

      // resultados totales del proyecto
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
      next(new restify.NotFoundError('No activities with that identifier has been found'));
    });
};

const timingController = {
  /**
   * Tiempo total del proyecto y por cada actividad
   *
   * @param req
   * @param res
   */
  read: function(req, res) {
    const project = req.project;
    let activityFindCriteria = { activityId: { $in: project.activities } };
    Activity.find(activityFindCriteria)
      .then(function(activities) {
        let projectDuration = 0;
        let activitiesDuration = [];
        activities.forEach(function(activity) {
          let activityResume = getActivityResume(activity);
          activitiesDuration.push({ activityId: activity.activityId, duration: activityResume.avgDuration });
          projectDuration += activityResume.avgDuration;
        });

        // Duración media total del proyecto
        projectDuration /= activities.length;
        return { duration: projectDuration, activities: activitiesDuration };
      })
      .then(function(result) {
        res.send(result);
      })
      .catch(function(err) {
        console.log(err);
        res.send(JSON.stringify((new restify.NotFoundError('No activities with that identifier has been found'))));
      });
  },

  /**
   * Tiempo por usuarios
   *
   * @param req
   * @param res
   */
  readByUsers: function(req, res) {
    const project = req.project;
    const users = req.project.players;
    let activityFindCriteria = { activityId: { $in: project.activities } };
    Activity.find(activityFindCriteria)
      .then(function(activities) {
        // Inicialización del array con objeto de cada usuario
        // { userId: String, total: Number }
        let usersData = _.map(users, (user) => {
          return { userId: user.user, total: 0 };
        });

        activities.forEach(function(activity) {
          _.map(activity.users, (user) => {
            if (user.tries[user.tries.length - 1]) {
              let userData = _.find(usersData, { userId: user.user });
              userData.total += user.tries[user.tries.length - 1].duration;
            }
          });
        });

        return usersData;
      })
      .then(function(result) {
        res.send(result);
      })
      .catch(function(err) {
        console.log(err);
        res.send(JSON.stringify((new restify.NotFoundError('No activities with that identifier has been found'))));
      });
  },
  /**
   * Tiempo por usuario ordenado por actividad
   *
   * @param req
   * @param res
   */
  readByUserId: function(req, res) {
    const project = req.project;
    let userId = req.params.userId;
    let activityFindCriteria = { 'users.user': userId, activityId: { $in: project.activities } };
    Activity.find(activityFindCriteria)
      .then(function(activities) {
        let activitiesData = [];
        activities.forEach(function(activity) {
          let user = _.find(activity.users, (val) => val.user == userId);
          activitiesData.push({
            activityId: activity.activityId,
            duration: user.tries[user.tries.length - 1].duration,
            startDate: user.startTime,
            finishDate: user.finishTime
          });
        });

        return activitiesData;
      })
      .then(function(activities) {
        let result = {
          userId: userId,
          activities
        };

        res.send(result);
      });
  }
};

exports.timing = timingController;

const usersController = {
  readAll: function(req, res) {
    const project = req.project;
    let activityFindCriteria = { activityId: { $in: project.activities } };
    //Activity.find(activityFindCriteria)
    //  .then(function(activities) {
    //
    //  });
    var result = {
      users: [
        {
          userId: '23131nasjdnaB',
          correct: 12,
          failed: 0,
          notAnswered: 3,
          status: 'finished' // finished, pending, notstarted
        }
      ]
    };
    res.json(result);
  },

  readByUserId: function(req, res, next, id) {
    const userId = req.params.userId;
    const project = req.project;
    console.log(project);
    const user = _.find(project.players, (o) => o.user == userId);
  }
};

exports.users = usersController;

/**
 * Resultados sobre proyectos
 *
 * @type {{readAll: Function, readByUsers: Function}}
 */
const resultsController = {
  readAll: function(req, res) {
    const project = req.project;
    let activityFindCriteria = { activityId: { $in: project.activities } };
    //Activity.find(activityFindCriteria)
    //  .then(function(activities) {
    //
    //  });
    var result = {};
    res.json(result);
  },

  readByUsers: function(req, res, next, id) {
    const userId = req.params.userId;
    const project = req.project;
    let results = [];

    // populate de usuarios del proyecto
    project.players.map(function(user) {
      results.push({
        userId: user.user,
        status: 'unstarted',
        correct: 0,
        failed: 0,
        notAnswered: project.activities.length
      });
    });

    let activityFindCriteria = { activityId: { $in: project.activities } };
    Activity.find(activityFindCriteria)
      .then(function(activities) {
        activities.forEach(function(activity, index) {
          //let activityResume = getActivityResume(activity);
          activity.users.map(function(user) {
            let userResultIndex = _.findIndex(results, (o) => o.userId == user.user.toString());
            if (userResultIndex !== -1) {
              let userResult = results[userResultIndex];
              userResult.correct = userResult.correct || 0;
              userResult.failed = userResult.failed || 0;
              if (user.isFinished) {
                userResult.correct += Number(user.isCorrect); // 0, 1
                userResult.failed += Number(!user.isCorrect); // 0, 1
              }

              userResult.notAnswered = (activities.length) - (userResult.correct + userResult.failed);
              userResult.tries = user.tries.length;
              userResult.status = user.isFinished ? 'finished' : 'pending';
            }
          });
        });

        return results;
      })
      .then(function(results) {
        res.json(results);
      });

    //var result = [
    //  {
    //    userId: '23131nasjdnaB',
    //    correct: 12,
    //    failed: 0,
    //    notAnswered: 3,
    //    status: 'finished' // finished, pending, notstarted
    //  }
    //];
    //res.json(result);
  }
};

exports.results = resultsController;

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
