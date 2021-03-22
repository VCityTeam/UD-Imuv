/** @format */
const express = require('express');

export class SimpleServer {
  constructor() {}

  start(config) {
    const app = express();
    //serve
    app.use(express.static(config.folder)); //what folder is served

    //http server
    app.listen(config.port, function (err) {
      if (err) console.log('Error in server setup');
      console.log('Server listening on Port', config.port, ' folder ' + config.folder);
    });
  }
}
