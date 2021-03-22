/** @format */
const express = require('express');

export class SimpleServer {
  constructor() {}

  start(config) {
    const app = express();
    //serve
    app.use(express.static(config.folder)); //what folder is served

    //http server
    const port = config.port;
    app.listen(port, function (err) {
      if (err) console.log('Error in server setup');
      console.log('Server listening on Port', port, ' folder ' + config.folder);
    });
  }
}
