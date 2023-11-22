const cp = require('node:child_process');
const path = require('path');

const startFork = cp.fork(path.resolve(__dirname, '../bin/start.js'));
startFork.on('message', async (message) => {
  if (message == 'ready') {
    console.log('Back-end is ready');
    setTimeout(() => {
      startFork.kill();
    }, 10000);
  }
});
