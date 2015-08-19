'use strict';

var gulp = require('gulp');

gulp.task('connect', function(){
  var connect = require('connect');
  var serveStatic = require('serve-static');
  var serveIndex = require('serve-index');
  var app = connect()
    .use(require('connect-livereload')({port: 35729})) //for some reason changing the port does not work
    .use(serveStatic('app'))
    .use(serveStatic('.'))
    .use(serveIndex('app'));

  require('http').createServer(app)
    .listen(9001)
    .on('listening', function(){
      console.log('Started connect web server on http://localhost:9001');
    });
});

gulp.task('serve', ['connect'], function(){
  var livereload = require('gulp-livereload');

  livereload.listen();

  require('opn')('http://localhost:9001');

  // watch for changes
  gulp.watch([
    'app/*.html',
    'app/scripts/**/*.js',
  ]).on('change', livereload.changed);
});


