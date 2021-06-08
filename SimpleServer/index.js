/** @format */

try {
  const Server = require('./dist/server.js');

  //instanciate server
  const server = new Server();

  //start server
  //node command should be like 'node index.js ../DemoFull 8000'
  const folder = process.argv[2];
  const port = process.argv[3];
  server.start({ folder: folder, port: port });
} catch (e) {
  console.error(e);
}
