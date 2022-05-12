/** @format */

try {
  const fs = require('fs');
  const gameServer = require('./dist/server.js');
  const config = require('./assets/config/config.json');

  require('dotenv').config();

  config.ENV = process.env;

  console.log('server version ', require('./package.json').version);

  const app = new gameServer.Application(config);
  app.start();
} catch (e) {
  console.error(e);
}
