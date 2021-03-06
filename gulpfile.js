var babel = require('gulp-babel');
var ghPages = require('gulp-gh-pages');
var gulp = require('gulp');
var gutil = require('gulp-util');
var inject = require('gulp-inject-string');
var nodemon = require('gulp-nodemon');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var rimraf = require('rimraf');
var replace = require('gulp-replace');
var rollup = require('rollup');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');

var production = process.env.NODE_ENV == 'production';
const jsBuild = gulp.series(jsDemo, jsVtooltip);
const build = gulp.parallel(cssDemo, cssBootstrap, jsBuild)

exports.default = gulp.series(build, serve)
exports.gh_pages = gulp.series(build, gh_page)

async function jsDemo() {
	const bundle = await rollup.rollup({
		input: './demo/app.js',
		experimentalCodeSplitting: false,
		plugins: [
			require('rollup-plugin-replace')({
				'process.env.NODE_ENV': production ? '"production"' : '"dev"',
				// Monkey patch to replace Ace's weird package loader with the standard one
				'var brace = window.ace.acequire("ace/ace")': 'var brace\n;$(()=> brace = window.ace.require("ace/ace"));',
			}),
			require('rollup-plugin-alias')({
				vue: 'node_modules/vue/dist/vue.esm.js',
			}),
			require('rollup-plugin-commonjs')({
				include: ['node_modules/**/*', 'demo/**/*', 'dist/**/*'],
				namedExports: {
					'dist/polyglot.js': ['polyglot'],
				},
			}),
			require('rollup-plugin-vue')(),
			require('rollup-plugin-includepaths')({
				paths: ['dist', 'demo'],
			}),
			require('rollup-plugin-node-resolve')({
				jsnext: true,
				browser: true,
			}),
			require('rollup-plugin-node-globals')({
				baseDir: false,
				buffer: false,
				dirname: false,
				filename: false,
				global: false,
				process: true,
			}),
			require('rollup-plugin-inject')({
				include: '**/*.js',
				exclude: 'node_modules/**',
				jQuery: 'jquery',
				$: 'jquery',
			}),
			production && require('rollup-plugin-uglify').uglify(),
			require('rollup-plugin-sizes')(),
		],
	});
	return await bundle.write({
		format: 'cjs',
		file: './dist/demoApp.js',
		name: 'demoApp',
		sourcemap: true,
	});
};

function jsVtooltip() {
	return gulp.src('./demo/v-tooltip.min.js')
		.pipe(gulp.dest('./dist'))
}

function cssDemo() {
	return gulp.src('./demo/app.css')
		.pipe(rename('demoApp.css'))
		.pipe(gulp.dest('./dist'))
}

function cssBootstrap() {
	return gulp.src('./demo/minton.min.css')
		.pipe(gulp.dest('./dist'))
}

function serve() {
	var monitor = nodemon({
		script: './demo/server.js',
		ext: 'js css',
		ignore: ['**/.css', '**/*.js', '**/*.vue'],
	})
		.on('start', function() {
			console.log('Server started');
		})
		.on('restart', function() {
			console.log('Server restarted');
		});

	return watch(['src/**/*.js', 'demo/**/*.js', 'demo/**/*.vue'], function() {
		console.log('Rebuild client-side JS files...');
		jsBuild();
	});
}

function gh_page() {
	rimraf.sync('./gh-pages');

	return gulp.src([
		'./LICENSE',
		'./demo/_config.yml',
		'./demo/app.css',
		'./demo/app.js',
		'./demo/index.html',
		'./dist/**/*',
		'./syntax/ace/mode-polyglot.js',
		'./node_modules/vue/dist/vue.js',
		// './node_modules/bootstrap/dist/css/bootstrap.css',
		'./demo/minton.min.css',
		'./node_modules/bootstrap/dist/js/bootstrap.js',
		'./node_modules/lodash/lodash.js',
		'./node_modules/jquery/dist/jquery.js',
		'./node_modules/font-awesome/**/*',
		'./node_modules/popper.js/dist/umd/popper.js',
		'./node_modules/v-tooltip/dist/v-tooltip.min.js',
	], {base: __dirname})
		.pipe(rename(function(path) {
			if (path.dirname == 'demo') { // Move all demo files into root
				path.dirname = '.';
			}
			return path;
		}))
		.pipe(ghPages({
			cacheDir: 'gh-pages',
			push: true, // Change to false for dryrun (files dumped to cacheDir)
		}))
};
