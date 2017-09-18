/* global __dirname, require, module*/

const webpack = require('webpack')
// const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin
const path = require('path')
const env = require('yargs').argv.env // use --env with webpack 2
const entry = require('webpack-glob-entry')

let libraryName = 'Library'

let plugins = [],
  outputFile,
  fullPath

if (env === 'build') {
  // plugins.push(new UglifyJsPlugin({ minimize: true }))
  outputFile = libraryName + '.min.js'
} else {
  outputFile = libraryName + '.js'
}

plugins.push(
  // Add module names to factory functions so they appear in browser profiler.
  new webpack.NamedModulesPlugin()
)
srcPath = __dirname + '/src'

const config = {
  entry: entry(srcPath + '/core/*.js'),
  devtool: 'cheap-source-map',
  output: {
    path: __dirname + '/build',
    pathinfo: true,
    filename: '[name].js',
    // library: ['[name]'],
    // libraryExport: '[name]',
    // libraryTarget: 'window',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/,
        options: {
          cacheDirectory: false
        }
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js']
  },
  devServer: {
    contentBase: path.join(__dirname),
    compress: true,
    port: 9000,
    overlay: {
      warnings: true,
      errors: true
    },
    watchContentBase: true,
    watchOptions: {
      poll: true
    }
  },
  externals: {
    'nw.gui': ''
  },
  plugins: plugins
}

module.exports = config
