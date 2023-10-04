const express = require('express');
const { stringReplace } = require('string-replace-middleware');
const { useParseEndPoint } = require('./parse');
const reload = require('reload');
const { json } = require('body-parser');
const { runGameWebsocketService } = require('./gameWebSocketService');

// launch an express app
const app = express();

if (process.argv[2] && isNaN(process.argv[2])) {
  throw new Error('INVALID PORT');
}
const port = process.argv[2];

const NODE_ENV = process.env.NODE_ENV || 'development';
console.log('backend running in mode ', NODE_ENV);

const options = {
  contentTypeFilterRegexp: /text\/html/,
};

// TODO: the limit should be in config
app.use(json({ limit: '100mb' }));

// TODO: see how to modify html title + bundle import procedurally
app.use(
  stringReplace(
    {
      RUN_MODE: NODE_ENV,
    },
    options
  )
);

// public folder is expose
app.use(express.static('./public'));

// create an http server
const httpServer = app.listen(port, (err) => {
  if (err) {
    console.error('Server does not start');
    return;
  }
  console.log('Http server listening on port', port);
});

useParseEndPoint(app);

runGameWebsocketService(httpServer, './public/assets/gameObject3D');

reload(app, { port: 8082 }); // TODO: pass reload port as the http server port
