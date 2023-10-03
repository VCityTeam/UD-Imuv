const express = require('express');
const { stringReplace } = require('string-replace-middleware');
const reload = require('reload');
const path = require('path');

const app = express();

// run an express server

if (process.argv[2] && isNaN(process.argv[2])) {
  throw new Error('INVALID PORT');
}
const port = process.argv[2];

console.log(process.env.NODE_ENV);
const NODE_ENV = process.env.NODE_ENV || 'development';
const runMode = NODE_ENV === 'production' ? 'release' : 'debug';

const options = {
  contentTypeFilterRegexp: /text\/html/,
};

app.use(
  stringReplace(
    {
      RUN_MODE: runMode,
    },
    options
  )
);

app.use(express.static('./packages/browser'));

const httpServer = app.listen(port, (err) => {
  if (err) {
    console.error('Server does not start');
    return;
  }
  console.log('Http server listening on port', port);
});

reload(app, { port: 8082 });
try {
  // start applicaction server
  const { UDIMUVServer } = require('@ud-imuv/node');

  const myAppNameServer = new UDIMUVServer();
  myAppNameServer.start(
    httpServer,
    path.resolve('./packages/browser/assets/gameObject3D')
  );
} catch (e) {
  console.error(e);
}
