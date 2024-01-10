/** @file Running dev routine */
const { exec } = require('child-process-promise');

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
  // build bundle according env variables
  const result = await exec('npx webpack --config ./webpack.config.js');
  result.childProcess.stdout.on('data', (data) => {
    console.log(data);
  });
};

createCommitJSON();

routine();
