const gitlog = require('gitlog').default;

const options = {
  repo: __dirname,
  number: 1,
  fields: ['hash'],
  execOptions: { maxBuffer: 1000 * 1024 },
};

// Synchronous
const commits = gitlog(options);
console.log('https://github.com/VCityTeam/UD-Imuv/commit/' + commits[0].hash);
