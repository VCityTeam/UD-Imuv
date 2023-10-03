const path = require('path');

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

const result = {
  entry: process.env.ENTRY,
  output: {
    filename: 'bundle.js',
  },
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

// inject css in bundle
result.module.rules.push({
  test: /\.css$/,
  use: [
    'style-loader', // Tells webpack how to append CSS to the DOM as a style tag.
    'css-loader', // Tells webpack how to read a CSS file.
  ],
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
