const webpack = require('webpack');
require('dotenv').config({ path: '../../.env' });

const mode = process.env.NODE_ENV;

//Inject environnement variables (they have to be declare in your .env !!!)
const keyEnvVariables = [
  'JITSI_PUBLIC_URL',
  'PARSE_SERVER_URL',
  'PARSE_APP_ID',
  'PARSE_MASTER_KEY',
  'WBO_PUBLIC_URL',
];
const plugins = [];
const params = {};
keyEnvVariables.forEach(function (key) {
  console.log(key, ' = ', JSON.stringify(process.env[key]));
  params[key] = JSON.stringify(process.env[key]);
});
plugins.push(new webpack.DefinePlugin(params));

module.exports = {
  entry: ['./src/index.js'],
  output: {
    filename: 'bundle.js',
    library: 'udvizShared',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'this',
  },
  plugins: plugins,
  module: {
    rules: [],
  },
  resolve: {
    modules: [
      'node_modules', // The default
      'src',
    ],
  },
};
