const { exec } = require('child-process-promise');

const build = async (name, mode) => {
  const execCommand = `npx dotenv -e .env -- cross-env NODE_ENV=${mode} NAME=${name} ENTRY=./src/browser/${name}/index.js webpack --config ./webpack.config.js`;
  console.log('-> start build', name);
  await exec(execCommand);
  console.log(name, 'builded');
};

module.exports = build;
