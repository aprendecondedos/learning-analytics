'use strict';
const restify = require('./restify');

// Initialize Models
mongoose.loadModels();

module.exports.loadModels = function loadModels() {
  mongoose.loadModels();
};

module.exports.init = function init(callback) {
  mongoose.connect(function(db) {
    // Initialize express
    const app = restify.init(db);
    if (callback) callback(app, db, config);

  });
};

module.exports.start = function start(callback) {
  const _this = this;

  _this.init(function(app, db, config) {

    // Start the app by listening on <port> at <host>
    app.listen(config.port, config.host, function() {
      // Create server URL
      var server = (process.env.NODE_ENV === 'secure' ? 'https://' : 'http://') +
        config.host + ':' + config.port;

      // Logging initialization
      console.log('--');
      console.log(chalk.green(config.app.title));
      console.log();
      console.log(chalk.green('Environment:     ' + process.env.NODE_ENV));
      console.log(chalk.green('Server:          ' + server));
      console.log(chalk.green('Database:        ' + config.db.uri));

      console.log('--');

      if (callback) callback(app, db, config);
    });

  });

};