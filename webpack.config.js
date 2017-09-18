const path = require('path')

module.exports = {
  entry: './js/core/rpg_core.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'js/core')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
            cacheDirectory: true
          }
        }
      }
    ]
  },
  externals: {
    'nw.gui': 'nw.gui', // just remove nw.gui?
    globals: `{
      Bitmap: 'Bitmap'
    }`
  },
  stats: {
    color: true
  },
  devtool: 'cheap-module-source-map',
  devServer: {
    contentBase: './'
  },
  performance: {
    hints: false
  }
}
