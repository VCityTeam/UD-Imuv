/** @format */

try {
  const gameServer = require('./dist/server.js');
  const config = require('./assets/config/config.json');

  const folder = process.argv[2];
  const port = process.argv[3];

  if (port) config.port = port;
  if (folder) config.folder = folder;

  //instanciate server
  const server = new gameServer.Server(config);

  const bbbURL = process.argv[4];
  const bbbSecret = process.argv[5];

  if (bbbURL && bbbSecret) {
    server.initBBB(bbbURL, bbbSecret);
  }

  //start server
  server.start();
} catch (e) {
  console.error(e);
}
