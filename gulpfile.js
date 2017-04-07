var gulp = require("gulp");
var shell = require('gulp-shell');
var tsb = require('gulp-tsb');
/*var ts = require("gulp-typescript");
const tsProject = ts.createProject("./src/tsconfig.json");
gulp.task("default", function () {
  return tsProject.src()
    .pipe(ts(tsProject))
    .js.pipe(gulp.dest("."));
});*/

// TypeScript build for /src folder, pipes in .d.ts files from typings folder 
var tsConfigSrc = tsb.create('./src/tsconfig.json');
gulp.task("build", function () {
  return gulp.src(['./typings/**/*.ts', './src/*.ts'])
    .pipe(tsConfigSrc())
    .pipe(gulp.dest('./src'));
});
gulp.task("build-tests", function () {
  return gulp.src(['./typings/**/*.ts', './tests/test.ts'])
    .pipe(tsConfigSrc())
    .pipe(gulp.dest('./tests'));
});

gulp.task('run-tests', shell.task('node ./tests/test.js'));

gulp.task("default", ["build"]);
gulp.task("tests", ["build-tests","run-tests"]);

//gulp.task('watch', function () {
//  gulp.watch('src/**/*.ts', ['build']);
//  gulp.watch('tests/**/*.ts', ['buildTests']);
//});
