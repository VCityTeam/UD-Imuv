const express = require('express');
const { stringReplace } = require('string-replace-middleware');
const reload = require('reload');
const { UDIMUVServer } = require('@ud-imuv/node');
const Constant = require('./Constant');

const app = express();

// run an express server
const port = process.argv[2] || Constant.DEFAULT_PORT;

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

reload(app, { port: Constant.RELOAD_PORT }).then(() => {
  app.listen(port);
  console.log('HTTP SERVER IS RUNNING OF PORT', port);
});

// try {
//   // start applicaction server

//   const myAppNameServer = new UDIMUVServer();
//   myAppNameServer.start();
// } catch (e) {
//   console.error(e);
// }
