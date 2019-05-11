var gulp = require("gulp");
var exec = require('child_process').exec;
var ts = require("gulp-typescript");

const tsProject = ts.createProject("./src/tsconfig.json");
gulp.task("build", function() {
  return tsProject
    .src(["./src/*.ts", "./typings/index.d.ts"])
    .pipe(ts(tsProject))
    .js.pipe(gulp.dest("./src"));
});
gulp.task("build-tests", function() {
  return tsProject
    .src(["./tests/test.ts", "./typings/index.d.ts"])
    .pipe(ts(tsProject))
    .js.pipe(gulp.dest("./tests"));
});

gulp.task("run-tests", function(cb) {
  exec('node ./tests/test', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task("default", ["build"]);
gulp.task("tests", ["build-tests", "run-tests"]);

//gulp.task('watch', function () {
//  gulp.watch('src/**/*.ts', ['build']);
//  gulp.watch('tests/**/*.ts', ['buildTests']);
//});
