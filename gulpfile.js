var  browserSync = require('browser-sync'),
     gulp = require('gulp'),
     config = require('./lib/server/config.js'),
     coServ = require('./coServ');

// deal with the www path
var  reload = browserSync.reload,
     wwwPath = config.getWWW();

gulp.task('default', function() {
    browserSync({
        proxy: '127.0.0.1:8080'
    });

    gulp.watch(['./**/*.html', './**/*.css', './**/*.js', './**/*.inc', './**/*.lang'],
        {cwd: wwwPath}, reload);

    gulp.watch(['./themes/*/blocks/modules/**/*.js'], {cwd: wwwPath}, function(e) {
        coServ.restart();
    });
});
