/** @format */

try {
  const bundle = require('./dist/server.js');
  const config = require('./assets/config/config.json');

  //instanciate server
  const server = new bundle.SimpleServer();

  //start server
  server.start(config);

} catch (e) {
  console.error(e);
}
