/** @format */
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = () => {
  return {
    target: 'node',
    externals: [nodeExternals()],
    entry: path.resolve(__dirname, 'src/server.js'),
    output: {
      path: path.resolve(__dirname, 'dist/'),
      filename: 'server.js',
      library: 'server',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },
  };
};
