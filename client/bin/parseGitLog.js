const gitlog = require('gitlog').default;

const options = {
  repo: __dirname,
  number: 1,
  fields: ['hash', 'abbrevHash', 'subject', 'authorName', 'authorDateRel'],
  execOptions: { maxBuffer: 1000 * 1024 },
};

// Synchronous
const commits = gitlog(options);
console.log(commits);
