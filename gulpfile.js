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

gulp.task('default', ['serve']);
gulp.task('build', ['js', 'js:demo']);

gulp.task('js', function() {
	gulp.src('./index.js')
		.pipe(plumber({
			errorHandler: function(err) {
				gutil.log(gutil.colors.red('ERROR DURING JS BUILD'));
				process.stdout.write(err.stack);
				this.emit('end');
			},
		}))
		.pipe(rename('polyglot.js'))
		.pipe(babel({
			presets: ['@babel/env'],
		}))
		.pipe(gulp.dest('./dist'))
		.pipe(uglify())
		.pipe(rename('polyglot.min.js'))
		.pipe(gulp.dest('./dist'))
});

gulp.task('js:demo', ()=>
	Promise.resolve()
		.then(()=> rollup.rollup({
			input: './demo/app.js',
			output: {
				format: 'umd',
			},
			plugins: [
				require('rollup-plugin-alias')({
					vue$: 'vue/dist/vue.common.js',
				}),
				// require('rollup-plugin-vue').default(),
				require('rollup-plugin-node-resolve')(), // Allow Node style module resolution
				require('rollup-plugin-node-globals')({ // Inject global Node module shivs
					baseDir: false,
					buffer: false,
					dirname: false,
					filename: false,
					global: false,
					process: true,
				}),
				require('rollup-plugin-commonjs')({ // Allow reading CommonJS formatted files
					include: 'node_modules/**/*',
				}),
			],
		}))
		.then(bundle => bundle.write({
			file: './dist/demoApp.js',
			format: 'umd',
			name: 'demoApp',
			sourcemap: true,
		}))
);

gulp.task('serve', ['build'], function() {
	var monitor = nodemon({
		script: './demo/server.js',
		ext: 'js css',
		ignore: ['**/*.js', '**/.css'], // Ignore everything else as its watched seperately
	})
		.on('start', function() {
			console.log('Server started');
		})
		.on('restart', function() {
			console.log('Server restarted');
		});

	watch(['./index.js', 'demo/**/*.js', 'src/**/*.js'], function() {
		console.log('Rebuild client-side JS files...');
		gulp.start('js:demo');
	});
});

gulp.task('gh-pages', ['build'], function() {
	rimraf.sync('./gh-pages');

	return gulp.src([
		'./LICENSE',
		'./demo/_config.yml',
		'./demo/app.css',
		'./demo/app.js',
		'./demo/index.html',
		'./dist/**/*',
		'./node_modules/angular/angular.min.js',
		'./node_modules/bootstrap/dist/css/bootstrap.min.css',
		'./node_modules/bootstrap/dist/js/bootstrap.min.js',
		'./node_modules/lodash/lodash.min.js',
		'./node_modules/jquery/dist/jquery.min.js',
		'./node_modules/font-awesome/css/font-awesome.min.css',
		'./node_modules/font-awesome/fonts/fontawesome-webfont.ttf',
		'./node_modules/font-awesome/fonts/fontawesome-webfont.woff',
		'./node_modules/font-awesome/fonts/fontawesome-webfont.woff2',
		'./node_modules/popper.js/dist/umd/popper.min.js',
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
});
