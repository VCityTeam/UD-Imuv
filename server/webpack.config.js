/** @format */
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
require('dotenv').config({ path: '../.env' });

const mode = process.env.NODE_ENV;

console.log(
  'JITSI_PUBLIC_URL = ',
  JSON.stringify(process.env.JITSI_PUBLIC_URL)
);

module.exports = () => {
  return {
    target: 'node',
    mode: mode,
    externals: [nodeExternals()],
    entry: path.resolve(__dirname, 'src/server.js'),
    output: {
      path: path.resolve(__dirname, 'dist/'),
      filename: 'server.js',
      library: 'server',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        JITSI_PUBLIC_URL: JSON.stringify(process.env.JITSI_PUBLIC_URL),
      }),
      new webpack.DefinePlugin({
        WBO_PUBLIC_URL: JSON.stringify(process.env.WBO_PUBLIC_URL),
      }),
    ],
  };
};
