/** @file Running dev routine */
const { spawn, exec } = require('child-process-promise');

const print = function (result) {
  if (result.stdout) console.log('stdout: \n', result.stdout);
  if (result.stderr) console.error('stderr: \n', result.stderr);
};

const createCommitJSON = () => {
  const gitlog = require('gitlog').default;
  const fs = require('fs');

  const options = {
    repo: __dirname,
    number: 1,
    fields: ['hash', 'abbrevHash'],
    execOptions: { maxBuffer: 1000 * 1024 },
  };

  // Synchronous
  const commits = gitlog(options);

  const commitUrl =
    'https://github.com/VCityTeam/UD-Imuv/tree/' + commits[0].hash;

  const commitJSON = {
    commitHash: commits[0].hash,
    commitAbbrevHash: commits[0].abbrevHash,
    commitUrl: commitUrl,
  };

  const save = function () {
    fs.writeFile(
      './public/assets/config/commit_info.json',
      JSON.stringify(commitJSON),
      {
        encoding: 'utf8',
        flag: 'w',
        mode: 0o666,
      },
      function (err) {
        if (err) console.error(err);

        console.log('save conf commit', commitJSON);
      }
    );
  };

  save();
};

const routine = async () => {
  // build utils bundle
  let result = await exec(
    'npm exec cross-env NAME=utils ENTRY=./src/browser/utils/index.js npm run build-dev'
  );
  print(result);

  // build game bundle
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

createCommitJSON();

routine();
