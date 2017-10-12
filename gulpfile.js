"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var bulkSass = require('gulp-sass-bulk-import');
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var mqpacker = require("css-mqpacker");
var minify = require("gulp-csso");
var sourcemaps = require("gulp-sourcemaps");
var rename = require("gulp-rename");
var del = require("del");
var copy = require("gulp-copy");
var imagemin = require("gulp-imagemin");
var objectFit = require("postcss-object-fit-images")
var svgstore = require("gulp-svgstore");
var svgmin = require("gulp-svgmin");
var run = require("run-sequence");
var server = require("browser-sync").create();

gulp.task("clean", function() {
  return del("build");
});

gulp.task("copy", function() {
  return gulp.src([
    "src/fonts/**/*.{woff,woff2}",
    "src/img/**",
    "src/js/**",
    "src/*.html"
  ])
  .pipe(copy("build", {prefix: 1}));
});

gulp.task("html:copy", function() {
  return gulp.src("src/*.html")
    .pipe(gulp.dest("build"));
});

gulp.task("html:update", ["html:copy"], function(done) {
  server.reload();
  done();
});

gulp.task("style", function() {
  gulp.src("src/sass/style.scss")
    .pipe(plumber())
    .pipe(bulkSass())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(postcss([
      autoprefixer({browsers: [
        "last 2 versions"
      ]}),
      mqpacker({
        sort: true
      }),
      objectFit()
    ]))
    .pipe(gulp.dest("build/css"))
    .pipe(minify())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

gulp.task("images", function() {
  return gulp.src("build/img/**/*.{png,jpg,gif}")
  .pipe(imagemin([
    imagemin.optipng({optimizationLevel: 3}),
    imagemin.jpegtran({progressive: true})
  ]))
  .pipe(gulp.dest("build/img"));
});

gulp.task("serve", ["style"], function() {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("src/sass/**/*.{scss,sass}", ["style"]);
  gulp.watch("src/*.html", ["html:update"]);
});

gulp.task("svg-sprite", function() {
  return gulp.src("build/img/icons/*.svg")
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("svg-sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

gulp.task("build", function(fn) {
  run(
    "clean",
    "copy",
    "style",
    "images",
    "svg-sprite",
    fn
  );
});