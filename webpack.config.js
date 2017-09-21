/* global __dirname, require, module*/

const webpack = require('webpack')
const path = require('path')
const entry = require('webpack-glob-entry')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')

let srcPath = __dirname + '/src'

const config = {
  entry: entry(srcPath + '/**/*.js'),
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
          presets: [
            [
              'env',
              {
                targets: {
                  browser: 'current'
                },
                modules: false
              }
            ]
          ],
          cacheDirectory: true,
          plugins: [
            'babel-plugin-add-module-exports',
            'transform-class-properties',
            'transform-object-rest-spread'
          ]
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
  plugins: [new webpack.NamedModulesPlugin(), new CaseSensitivePathsPlugin()]
}

module.exports = config
