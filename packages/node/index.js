/** @format */

try {
  const gameServer = require('./dist/server.js');
  const config = require('./assets/config/config.json');

  console.log('server version ', require('./package.json').version);

  const app = new gameServer.Application(config);
  app.start();
} catch (e) {
  console.error(e);
}
