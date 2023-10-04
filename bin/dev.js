/** @file Running dev routine */
const { spawn, exec } = require('child-process-promise');

const print = function (result) {
  if (result.stdout) console.log('stdout: \n', result.stdout);

  if (result.stderr) console.error('stderr: \n', result.stderr);
};

const routine = async () => {
  // TODO build bundle procedurally + opti nodemon 1 watcher par build et js or something better i don't know

  // build bundles

  let result = await exec(
    'npm exec cross-env NAME=reception ENTRY=./src/browser/reception/index.js npm run build-dev'
  );
  print(result);

  result = await exec(
    'npm exec cross-env NAME=utils ENTRY=./src/browser/utils.js npm run build-dev'
  );
  print(result);

  result = await exec(
    'npm exec cross-env NAME=game ENTRY=./src/browser/game/index.js npm run build-dev'
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
