/** @format */

const exec = require('child-process-promise').exec;
const { spawn } = require('child_process');

const printExec = function (result) {
  console.log('stdout: \n', result.stdout);
  console.log('stderr: \n', result.stderr);
};

console.log('Build IMUV server\n');
exec('npm run build-debug')
  .then(printExec)
  .then(function () {
    console.log('Start IMUV server\n');
    const child = spawn('node', ['--trace-warnings', './index.js']);
    child.stdout.on('data', (data) => {
      console.log(`child stdout:\n${data}`);
    });
    child.stderr.on('data', (data) => {
      console.error(`child stderr:\n${data}`);
    });
  });
