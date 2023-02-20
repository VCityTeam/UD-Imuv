const exec = require('child-process-promise').exec;
const Test = require('@ud-viz/node').Test;

const printExec = function (result) {
  console.log('stdout: \n', result.stdout);
  console.log('stderr: \n', result.stderr);
};

exec('npm run build-debug')
  .then(printExec)
  .then(() => {
    Test.scripts('./bin/Test');
  });
