/** @format */
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = () => {
  return {
    target: 'node',
    mode: 'development',
    externals: [nodeExternals()],
    entry: path.resolve(__dirname, 'src/server.js'),
    output: {
      path: path.resolve(__dirname, 'dist/'),
      filename: 'server.js',
      library: 'server',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },
    resolve: { mainFields: ['module', 'jsnext:main', 'browser', 'main'] },
    module: {
      rules: [
        {
          test: require('path').resolve(__dirname, 'node_modules'),
          resolve: { mainFields: ['module', 'jsnext:main', 'browser', 'main'] },
        },
      ],
    },
  };
};
