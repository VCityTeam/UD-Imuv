/** @format */

const exec = require('child-process-promise').exec;
const { spawn } = require('child_process');

const printExec = function (result) {
  console.log('stdout: \n', result.stdout);
  console.log('stderr: \n', result.stderr);
};

console.log('Deploy IMUV\n');
exec('npm run build') // build server
  .then(printExec)
  .then(function () {
    console.log('server builded');
    exec('cd ../client && npm run build') // build client
      .then(printExec)
      .then(function () {
        console.log('client builded');
        console.log('start IMUV server');

        // launch server
        const child = spawn('node', ['./index.js']);
        child.stdout.on('data', (data) => {
          console.log(`child stdout:\n${data}`);
        });
        child.stderr.on('data', (data) => {
          console.error(`child stderr:\n${data}`);
        });
      });
  });
