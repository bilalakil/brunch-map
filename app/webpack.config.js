const webpack            = require('webpack'),
      HtmlWebpackPlugin  = require('html-webpack-plugin'),
      VueLoaderPlugin    = require('vue-loader/lib/plugin')

module.exports = env => {
  const isMain = !env || !env.branch || env.branch === 'main',
        vars = {}
  
  vars.GOOGLE_MAPS_API_KEY = '"' + process.env.GOOGLE_MAPS_API_KEY + '"'
  if(isMain) {
    vars.NODE_ENV = '"production"'
  }

  return {
    mode: isMain ? 'production' : 'development',
    entry: './src/js/app',
    output: {
      path: __dirname + '/dist',
      filename: 'js/[name].[chunkhash].js',
    },
    optimization: {
      minimize: isMain
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        minify: {
          removeComments: isMain,
          collapseWhitespace: isMain,
        },
        inject: 'head',
        scriptLoading: 'defer',
      }),
      new webpack.DefinePlugin({
        'process.env': vars
      }),
      new VueLoaderPlugin()
    ].filter(Boolean),
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            scss: 'vue-style-loader!css-loader!sass-loader',
            sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
            cssSourceMap: !isMain,
          }
        },
        {
          test: /\.m?js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            { loader: 'vue-style-loader' },
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
              options: {
                sourceMap: !isMain
              },
            },
          ]
        },
        {
          test: /\.scss$/,
          use: [
            { loader: 'vue-style-loader' },
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
              options: {
                sourceMap: !isMain
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
