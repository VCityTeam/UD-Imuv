/** @format */

try {
  const fs = require('fs');
  const gameServer = require('./dist/server.js');
  const config = require('./assets/config/config.json');

  if (fs.existsSync('./env.json')) {
    config.ENV = require('./env.json');
  }

  console.log('environement', config.ENV);

  console.log('server version ', require('./package.json').version);

  const app = new gameServer.Application(config);
  app.start();
} catch (e) {
  console.error(e);
}
