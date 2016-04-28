/*jslint node: true, stupid: true */
'use strict';
var fs = require('fs');

module.exports = function(server) {
  server.get('/api/log/:name', function(req, res, next) {
    console.log('testing');
    console.log(req.params);

    //res.send(200, req.params);
    res.json(req.params);
    return next();
  });

  //fs.readdirSync('./routes').forEach(function (file) {
  //  if (file.substr(-3, 3) === '.js' && file !== 'index.js') {
  //    require('./' + file.replace('.js', ''))(server);
  //  }
  //});
};
