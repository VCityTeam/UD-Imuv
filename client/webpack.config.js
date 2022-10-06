/** @format */
const path = require('path');
const mode = process.env.NODE_ENV;
const debugBuild = mode === 'development';
const webpack = require('webpack');
require('dotenv').config({ path: '../.env' });

let outputPath;
let devTool;
if (debugBuild) {
  devTool = 'source-map';
  outputPath = path.resolve(__dirname, 'dist/debug');
} else {
  outputPath = path.resolve(__dirname, 'dist/release');
}

//Inject environnement variables (they have to be declare in your .env !!!)
const keyEnvVariables = ['JITSI_PUBLIC_URL', 'WBO_PUBLIC_URL'];
const plugins = [];
const params = {};
keyEnvVariables.forEach(function (key) {
  console.log(key, ' = ', JSON.stringify(process.env[key]));
  params[key] = JSON.stringify(process.env[key]);
});
plugins.push(new webpack.DefinePlugin(params));

module.exports = (env) => {
  const rules = [
    {
      // We also want to (web)pack the style files:
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    },
    {
      test: /\.json$/,
      include: [path.resolve(__dirname, 'src')],
      loader: 'raw-loader',
    },
    {
      test: /\.html$/,
      use: [
        {
          loader: 'html-loader',
          options: { minimize: !debugBuild },
        },
      ],
    },
    { test: /\.md$/, use: ['json-loader', 'front-matter-loader'] },
  ];

  return {
    mode,
    entry: path.resolve(__dirname, './src/bootstrap.js'),
    devtool: devTool,
    output: {
      path: outputPath,
      filename: 'app_name.js',
      library: 'app_name',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },
    module: {
      rules: rules,
    },
    plugins: plugins,
  };
};
