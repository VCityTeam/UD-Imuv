const spawn = require('child_process').spawn;

const start = async () => {
  // run backend
  const child = spawn(
    'dotenv -e .env -- cross-env NODE_ENV=production node',
    ['./bin/backend/index.js'],
    {
      shell: true,
    }
  );
  child.stdout.on('data', (data) => {
    console.log(`${data}`);
  });
  child.stderr.on('data', (data) => {
    console.error('\x1b[31m', ` ERROR :\n${data}`);
  });

  if (process.send) process.send('ready');
};

start();
