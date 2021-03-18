/** @format */

try {
  const gameServer = require('./dist/server.js');
  const config = require('./assets/config/config.json');
  const worldsJSON = require('./assets/worlds/worlds.json');

  //instanciate server
  const server = new gameServer.Server(config);

  //create worlds
  server.initWorlds(worldsJSON);

  //start server
  server.start();

} catch (e) {
  console.error(e);
}
