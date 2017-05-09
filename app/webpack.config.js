const webpack                    = require('webpack'),
      HtmlWebpackPlugin          = require('html-webpack-plugin'),
      ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')

module.exports = env => {
  isProd = !env || !env.branch || env.branch === 'master'

  return {
    entry: './src/js/app',
    output: {
      path: __dirname + '/dist',
      filename: 'js/[name].[chunkhash].js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        minify: {
          removeComments: isProd,
          collapseWhitespace: isProd,
        },
        inject: 'head',
      }),
      new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: 'defer'
      }),
      isProd
        ? new webpack.DefinePlugin({
            'process.env': {
              NODE_ENV: '"production"'
            }
          })
        : null,
      isProd
        ? new webpack.optimize.UglifyJsPlugin()
        : null,
    ].filter(Boolean),
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            scss: 'vue-style-loader!css-loader!sass-loader',
            sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
          }
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]'
          }
        },
      ]
    },
    devtool: 'source-map',
  }
}
