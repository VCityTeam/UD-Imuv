/** @file Running dev routine */
const { spawn, exec } = require('child-process-promise');

const print = function (result) {
  if (result.stdout) console.log('stdout: \n', result.stdout);

  if (result.stderr) console.error('stderr: \n', result.stderr);
};

// TODO build bundle procedurally + opti nodemon 1 watcher par build et js

// const buildGameBundle = exec(
//   'npm exec cross-env ENTRY=./src/browser/game/index.js npm run build-dev'
// );

// const buildEditorBundle = exec(
//   'npm exec cross-env ENTRY=./src/browser/editor/index.js npm run build-dev'
// );

const routine = async () => {
  // build bundles

  let result = await exec(
    'npm exec cross-env NAME=sign ENTRY=./src/browser/sign/index.js npm run build-dev'
  );

  print(result);

  result = await exec(
    'npm exec cross-env NAME=reception ENTRY=./src/browser/reception/index.js npm run build-dev'
  );
  print(result);

  // spawn backend
  const childSpawnBackend = spawn(
    'node',
    ['./bin/backend/index.js', process.env.PORT, '--trace-warnings'],
    {
      shell: true,
    }
  );

  childSpawnBackend.childProcess.stdout.on('data', (data) => {
    console.log(`${data}`);
  });
  childSpawnBackend.childProcess.stderr.on('data', (data) => {
    console.error('\x1b[31m', 'backend process | ', ` ERROR :\n${data}`);
  });
};

routine();
