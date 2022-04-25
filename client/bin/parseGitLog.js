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
  fs.mkdir('./assets/commit', (err) => {
    if (err) {
      if (err.code == 'EEXIST') return;
      return console.error(err.code);
    }
    console.log('Directory created successfully!');
  });
  fs.writeFile(
    './assets/commit/commit_info.json',
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
