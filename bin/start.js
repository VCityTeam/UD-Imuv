const { exec } = require('child-process-promise');
const spawn = require('child_process').spawn;

const start = async () => {
  // utils bundle
  await exec(
    'npm exec cross-env NODE_ENV=production NAME=utils ENTRY=./src/browser/utils/index.js npm run build'
  );
  console.log('utils builded');
  // game bundle
  await exec(
    'npm exec cross-env NODE_ENV=production NAME=game ENTRY=./src/browser/game/index.js npm run build'
  );
  console.log('game builded');
  // editor bundle
  await exec(
    'npm exec cross-env NODE_ENV=production NAME=editor ENTRY=./src/browser/editor/index.js npm run build'
  );
  console.log('editor builded');

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
