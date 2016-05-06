'use strict';
/**
 * Module dependencies.
 */
const config = require('./config')();
const pm2 = require('pm2');

//pm2.connect(function() {
//  pm2.start({
//    script: 'server.js',
//    name: config.keymetrics.name,
//    exec_mode: 'cluster',
//    instances: config.keymetrics.instances,
//    max_memory_restart: config.keymetrics.maxMemory + 'M',
//    env: {
//      NODE_ENV: process.env.NODE_ENV
//    },
//    post_update: ['npm install']       // Commands to execute once we do a pull from Keymetrics
//  }, function() {
//    pm2.interact(config.keymetrics.privateKey, config.keymetrics.publicKey, config.keymetrics.name, function() {
//      console.log('iniciando');
//      // Display logs in standard output
//      pm2.launchBus(function(err, bus) {
//        console.log('[PM2] Log streaming started');
//
//        bus.on('log:out', function(packet) {
//          console.log('[App:%s] %s', packet.process.name, packet.data);
//        });
//
//        bus.on('log:err', function(packet) {
//          console.error('[App:%s][Err] %s', packet.process.name, packet.data);
//        });
//      });
//    });
//  });
//});
