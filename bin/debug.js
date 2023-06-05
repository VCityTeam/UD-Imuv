/** @file Running the build-debug script */
const exec = require('child-process-promise').exec;
const path = require('path');
const { UDIMUVServer } = require('@ud-imuv/node');

/**
 * It prints the stdout and stderr of a result object
 *
 * @param {{stdout:string,stderr:string}} result - The result of the command execution.
 */
const printExec = function (result) {
  console.log('stdout: \n', result.stdout);
  console.log('stderr: \n', result.stderr);
};

// run a build debug bundle browser
// exec('npm run build-debug --prefix ./packages/browser').then(printExec);

// run a build debug bundle node

const app = new UDIMUVServer();
app.start({
  folder: './packages/browser',
  port: 8000,
  gameObjectsFolderPath: path.resolve(
    process.cwd(),
    './packages/browser/assets/gameObject3D'
  ),
  threadProcessPath: path.resolve(
    process.cwd(),
    './packages/node/dist/thread/debug/bundle.js'
  ),
});
