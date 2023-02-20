/** @file Running the build-debug script */

const { ExpressAppWrapper, Game } = require('@ud-viz/node');
const exec = require('child-process-promise').exec;

/**
 * It prints the stdout and stderr of a result object
 *
 * @param {{stdout:string,stderr:string}} result - The result of the command execution.
 */
const printExec = function (result) {
  console.log('stdout: \n', result.stdout);
  console.log('stderr: \n', result.stderr);
};

// run an express app wrapper with a gamesocket service
const expressAppWrapper = new ExpressAppWrapper();
expressAppWrapper
  .start({
    folder: './packages/browser',
    port: 8000,
    withDefaultGameSocketService: false,
  })
  .then(() => {
    // this code below should write somewhere else
    const gameSocketService = new Game.SocketService(
      expressAppWrapper.httpServer
    );
  });

// run a build debug browser bundle
exec('npm run build-debug --prefix ./packages/browser').then(printExec);
