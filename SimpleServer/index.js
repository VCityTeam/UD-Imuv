/** @format */

try {
  const bundle = require('./dist/server.js');

  //instanciate server
  const server = new bundle.SimpleServer();

  //start server
  //node command should be like 'node index.js ../DemoFull 8000'
  const folder = process.argv[2];
  const port = process.argv[3];
  server.start({ folder: folder, port: port });
  
} catch (e) {
  console.error(e);
}
