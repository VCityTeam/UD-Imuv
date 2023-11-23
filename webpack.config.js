const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

if (!process.env.ENTRY) {
  throw new Error(
    'You have to set as an environment variable ENTRY with the entry point to bundled (see cross-env)'
  );
}

if (!process.env.NAME) {
  throw new Error(
    'You have to set as an environment variable NAME with the entry point to bundled (see cross-env)'
  );
}

// Inject environnement variables (they have to be declare in your .env !!!)
const keyEnvVariables = ['JITSI_PUBLIC_URL', 'WBO_PUBLIC_URL'];
const plugins = [];
const params = {};
keyEnvVariables.forEach((key) => {
  console.log(key, ' = ', JSON.stringify(process.env[key]));
  params[key] = JSON.stringify(process.env[key]);
});
plugins.push(new webpack.DefinePlugin(params));
// possible de write in sources DEBUG flag that is going to be replace by a boolean during webpack
plugins.push(
  new webpack.DefinePlugin({
    DEBUG: process.env.NODE_ENV == 'development',
  })
);

if (process.env.ANALYZE) {
  plugins.push(new BundleAnalyzerPlugin());
}

const result = {
  entry: process.env.ENTRY,
  output: {
    filename: 'bundle.js',
    library: process.env.NAME,
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  module: {
    rules: [],
  },
  resolve: {
    modules: ['./node_modules'],
    fallback: {
      buffer: false,
    },
  },
  plugins: [
    ...plugins,
    new webpack.ProvidePlugin({
      Buffer: [require.resolve('buffer/'), 'Buffer'],
    }),
  ],
};

// inject css in bundle
result.module.rules.push({
  test: /\.css$/,
  use: [
    'style-loader', // Tells webpack how to append CSS to the DOM as a style tag.
    'css-loader', // Tells webpack how to read a CSS file.
  ],
});

result.module.rules.push({
  test: /\.md$/,
  use: ['json-loader', 'front-matter-loader'],
});

// production or development
if (process.env.NODE_ENV == 'production') {
  result.output.path = path.resolve(
    process.cwd(),
    './public/dist/' + process.env.NAME + '/production'
  );
  result.mode = 'production';
} else {
  result.mode = 'development';
  result.devtool = 'source-map';
  result.output.path = path.resolve(
    process.cwd(),
    './public/dist/' + process.env.NAME + '/development'
  );
}

module.exports = result;
