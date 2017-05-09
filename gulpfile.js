const gulp             = require('gulp'),
      runSequence      = require('run-sequence'),

      clean            = require('gulp-clean'),
      syncy            = require('syncy'),

      gwebpack         = require('gulp-webpack'),
      webpack          = require('webpack'),

      argv             = require('yargs').argv

const distDir          = 'public', 
      srcFilesToMove   = [
        'src/**/*',
        '!src/js/**/*',
      ],
      filesNotToSync   = [
        'js/**/*'
      ],

      isProd           = !argv.branch || argv.branch === 'master'

// Note that the distribution directory itself is not removed,
// as that interrupts its usage as a Docker volume.
gulp.task('clean', () =>
  gulp.src([distDir + '/*'], { read: false })
    .pipe(clean()))

gulp.task('move:watch', () =>
  gulp.watch(srcFilesToMove, { read: false }, ['move']))
gulp.task('move', () =>
  syncy(srcFilesToMove, distDir, { base: 'src/', ignoreInDest: filesNotToSync }))

gulp.task('vue:watch', () =>
  gulp.watch(['src/js/**/*'], { read: false }, ['vue']))
gulp.task('vue', () =>
  gulp.src(['src/js'])
    .pipe(gwebpack({
      entry: './src/js/app',
      output: { filename: 'js/[name].js' },
      plugins: [
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
    }, webpack))
    .pipe(gulp.dest(distDir)))

gulp.task('build:without-clean', ['move', 'vue'])
gulp.task('build', () =>
  runSequence('clean', ['build:without-clean']))

gulp.task('watch', ['move:watch', 'vue:watch'])

gulp.task('default', () =>
  runSequence('clean', ['build:without-clean', 'watch']))
