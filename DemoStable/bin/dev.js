/** @format */

const path = require('path');
const exec = require('child-process-promise').exec;
const { spawn } = require('child_process');

const printExec = function (result) {
  console.log('stdout: \n', result.stdout);
  console.log('stderr: \n', result.stderr);
};

exec('npm run build')
  .then(printExec)
  .then(function () {
    var child = spawn('python3', ['-m', 'http.server']);
    child.stdout.on('data', (data) => {
      console.log(`child stdout:\n${data}`);
    });
    child.stderr.on('data', (data) => {
      console.error(`child stderr:\n${data}`);
    });
    console.log('Your demo is served at localhost:8000');
  });
