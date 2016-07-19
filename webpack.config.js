/* global require, module, __dirname */

const path = require('path')
const NODE_MODULES = path.join(__dirname, 'node_modules/')

module.exports = {
  entry: './index.js',
  output: {
    filename: 'index.bundle.js',
  },
  resolve: {
    root: [NODE_MODULES],
    alias: {
        jquery: 'jquery/src/jquery',
    },
  },
  module: {
    loaders: [
      {
        test: require.resolve('scroll-scope'),
        loader: 'imports?define=>false,module=>undefined',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },
}

