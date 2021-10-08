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

  // const bbbURL = process.argv[4];
  const bbbURL = 'https://manager.bigbluemeeting.com/bigbluebutton/';
  // const bbbSecret = process.argv[5];
  const bbbSecret = 'ZMNZNVnyi0IqPPJiXI9H4JuznNCEGPfbKCoYIkDOKp';

  if (bbbURL && bbbSecret) {
    server.initBBB(bbbURL, bbbSecret);
  }

  //start server
  server.start();
} catch (e) {
  console.error(e);
}
