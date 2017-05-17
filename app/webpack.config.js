const webpack                    = require('webpack'),
      HtmlWebpackPlugin          = require('html-webpack-plugin'),
      ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')

module.exports = env => {
  const isProd = !env || !env.branch || env.branch === 'master',
        vars = {}
  
  vars.GOOGLE_MAPS_API_KEY = '"' + process.env.GOOGLE_MAPS_API_KEY + '"'
  if(isProd) {
    vars.NODE_ENV = '"production"'
  }

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
      new webpack.DefinePlugin({
        'process.env': vars
      }),
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
            cssSourceMap: !isProd,
          }
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.scss$/,
          use: [
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
              options: {
                minimize: isProd,
                sourceMaps: !isProd,
              },
            },
            { loader: 'sass-loader' },
          ]
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
