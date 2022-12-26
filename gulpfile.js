//（仕様） 動的サイト、静的サイトともに対応。ルートディレクトリにすべて出力する。ブラウザリロードのサーバーは都度切り替える必要あり。
// 初動は画像圧縮、scssコンパイル、ブラウザ起動ローカルサーバー接続

const gulp = require("gulp"); //gulp本体呼び出し

//scss
const sass = require("gulp-dart-sass"); //Dart Sass はSass公式が推奨 @use構文などが使える
const plumber = require("gulp-plumber"); // エラーが発生しても強制終了させない
const notify = require("gulp-notify"); // エラー発生時のアラート出力
const browserSync = require("browser-sync"); //ブラウザリロード
const autoprefixer = require("gulp-autoprefixer"); //ベンダープレフィックス自動付与
// const postcss = require("gulp-postcss");css-mqpackerを使うために必要
// const mqpacker = require('css-mqpacker');//メディアクエリをまとめる（意図しないスタイルの上書きを防ぐため、デフォルトでは無効化しています）

const webpack = require("webpack");
const webpackStream = require("webpack-stream");
const webpackConfig = require("./webpack.config");

// EJS
const ejs = require("gulp-ejs"); //ejs本体
const htmlbeautify = require("gulp-html-beautify"); //htmlコンパイル時の整形モジュール
const rename = require("gulp-rename"); //拡張子変更モジュール
const fs = require("fs"); //ejsでjsonを利用するモジュール

//画像圧縮
const imagemin = require("gulp-imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const imageminSvgo = require("imagemin-svgo");
const { src } = require("gulp");

/**
 * 出力先をclean（ファイル削除
 */
const clean = () => {
  return del([distBase + "/**"], {
    force: true,
  });
};

//ベンダープレフィックスを付与する条件
const TARGET_BROWSERS = [
  "last 2 versions", //各ブラウザの2世代前までのバージョンを担保
  "ie >= 11", //IE11を担保
];

// 入出力するフォルダを指定
const rootBase = "./dist"; // ルートディレクトリ（のちに記載するgulp.watchの監視対象）
const srcBase = "./src"; // コンパイル元データの保存場所
const distBase = "."; // ルートディレクトリに出力（コンパイルの出力先）

const srcPath = {
  scss: srcBase + "/scss/**/*.scss",
  img: srcBase + "/images/**/*",
  ejs: srcBase + "/ejs/**/*.ejs",
  js: srcBase + "/js/**/*.js", //
  html: rootBase + "**/*.html",
  php: rootBase + "**/*.php",
  glsl: srcBase + "/js/shader/**/*.glsl",
};

const distPath = {
  css: distBase + "/css",
  img: distBase + "/images/",
  ejs: distBase + "/",
  html: distBase + "/",
  php: distBase + "/",
  js: distBase + "/js/",
};

/**
 * sass
 */
const cssSass = () => {
  return (
    gulp
      .src(srcPath.scss, {
        sourcemaps: true,
      })
      .pipe(
        //エラーが出ても処理を止めない
        plumber({
          errorHandler: notify.onError("Error:<%= error.message %>"),
        })
      )
      .pipe(sass({ outputStyle: "expanded" })) //指定できるキー expanded compressed
      .pipe(autoprefixer(TARGET_BROWSERS)) // ベンダープレフィックス自動付与
      // .pipe(postcss([mqpacker()])) // メディアクエリをまとめる
      .pipe(gulp.dest(distPath.css, { sourcemaps: "./" })) //コンパイル先
      .pipe(browserSync.stream()) //ブラウザをリロードせずに更新
      .pipe(
        notify({
          message: "Sassをコンパイルしました！",
          onLast: true,
        })
      )
  );
};

/**
 * EJS
 */
const ejscompile = () => {
  const json_path = srcBase + "/ejs/_data/site.json";
  const json = JSON.parse(fs.readFileSync(json_path));

  return gulp
    .src([srcPath.ejs, "!" + srcBase + "/ejs/**/_*.ejs"]) //ejsはコンパイル、_*.ejsは除外
    .pipe(
      plumber({
        errorHandler: notify.onError("Error:<%= error.message %>"),
      })
    ) //エラーが出ても止めない
    .pipe(
      ejs({
        json: json,
      })
    )
    .pipe(
      htmlbeautify({
        indent_size: 2,
        indent_char: " ",
        max_preserve_newlines: 0,
        preserve_newlines: false,
        indent_inner_html: false,
        extra_liners: [],
      })
    )
    .pipe(rename({ extname: ".html" })) //拡張子をhtmlに変更
    .pipe(gulp.dest(distPath.ejs)) //コンパイル先を指定
    .pipe(browserSync.stream()) //ブラウザをリロードせずに更新
    .pipe(
      notify({
        message: "ejsをhtmlにコンパイルしました！",
        onLast: true,
      })
    );
};

// webpack
const bundleJs = () => {
  // webpackStreamの第2引数にwebpackを渡す
  return webpackStream(webpackConfig, webpack).pipe(gulp.dest("./js"));
};

/**
 * 画像圧縮
 */
const imgImagemin = () => {
  return gulp
    .src(srcPath.img)
    .pipe(
      imagemin(
        [
          imageminMozjpeg({
            quality: 80,
          }),
          imageminPngquant(),
          imageminSvgo({
            plugins: [
              {
                removeViewbox: false,
              },
            ],
          }),
        ],
        {
          verbose: true,
        }
      )
    )
    .pipe(gulp.dest(distPath.img));
};

/**
 * ローカルサーバー立ち上げ
 */
const browserSyncFunc = () => {
  browserSync.init(browserSyncOption);
};

const browserSyncOption = {
  // 静的サイト構築時
  server: distBase,
  // 動的サイト※接続先はプロジェクトに合わせて書き換える
  // proxy: "http://localhost/",
  open: "true", // ブラウザシンク起動するか'true''false'
  watchOptions: {
    debounceDelay: 1000,
  },
  reloadOnRestart: true,
};

/**
 * リロード
 */
const browserSyncReload = (done) => {
  browserSync.reload();
  done();
};

/**
 *
 * ファイル監視 ファイルの変更を検知したら、browserSyncReloadでreloadメソッドを呼び出す
 * series 順番に実行
 * watch('監視するファイル',処理)
 */
const watchFiles = () => {
  gulp.watch(srcPath.scss, gulp.series(cssSass));
  gulp.watch(srcPath.ejs, gulp.series(ejscompile));
  gulp.watch(srcPath.js, gulp.series(bundleJs, browserSyncReload));
  gulp.watch(srcPath.glsl, gulp.series(bundleJs, browserSyncReload));
  gulp.watch(distPath.html, gulp.series(browserSyncReload)); // distpathにあるものを編集するため、distPathを監視
  gulp.watch(distPath.php, gulp.series(browserSyncReload)); // distpathにあるものを編集するため、distPathを監視
  gulp.watch(srcPath.img, gulp.series(imgImagemin, browserSyncReload));
};

/**
 * seriesは「順番」に実行
 * parallelは並列で実行
 */
exports.default = gulp.series(
  gulp.parallel(imgImagemin, cssSass, ejscompile, bundleJs),
  gulp.parallel(watchFiles, browserSyncFunc)
);
