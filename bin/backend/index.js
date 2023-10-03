const express = require('express');
const { stringReplace } = require('string-replace-middleware');
const runParse = require('./parse');
const reload = require('reload');

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

// TODO see how to modify html title + bundle import procedurally
app.use(
  stringReplace(
    {
      RUN_MODE: NODE_ENV,
    },
    options
  )
);

app.use(express.static('./public'));

app.listen(port, (err) => {
  if (err) {
    console.error('Server does not start');
    return;
  }
  console.log('Http server listening on port', port);
});

runParse(app);

reload(app, { port: 8082 }); // TODO: pass reload port as the http server port
