'use strict';

/* * * * * * * * * * * * * *
 *  Modules
 * * * * * * * * * * * * * */

const gulp = require( 'gulp' ),
	rimraf = require( 'rimraf' );

//
const plugins = require( 'gulp-load-plugins' ) (
{
	pattern: [ 'gulp-*', 'gulp.*', '@*/gulp{-,.}*' ],
	replaceString: /^gulp(-|\.)/,
	rename: {
		'gulp-config-sync': 'configSync'
	}
} );

/* * * * * * * * * * * * * *
 * Options/Var
 * * * * * * * * * * * * * */

const params =
{
	fileName: 'jquery.myData'
};

const paths =
{
	src: './src/',
	build: './build/'
};

const bundles =
{
	dev: {
		fileSuffix: '',
		compress: false
	},

	min: {
		fileSuffix: '.min',
		compress: true
	}
};

var bundle = { };

/* * * * * * * * * * * * * *
 * Tasks
 * * * * * * * * * * * * * */

// Clear old Build
gulp.task( 'clean', function( done )
{
	rimraf( paths.build + '/**', done );
} );

// Config sync: Bower & Composer
gulp.task( 'config:sync', function( done )
{
	const options =
	{
		fields: [
			'version',
			'description',
			'keywords',
			'repository',
			'license'
		],
		space: '  '
	};

	//
	gulp.src( [ 'bower.json', 'composer.json' ] )
		.pipe( plugins.configSync( options ) )
		.pipe( gulp.dest( '.' ) );

	done( );
} );

// JS
gulp.task( 'js:build', function( done )
{
	const fileName = params.fileName + bundle.fileSuffix + '.js';

	// Generate header
	const pkg = require( './package.json' ),
		banner = [ '/**',
					' * <%= pkg.name %> - <%= pkg.description %>',
					' * @version v<%= pkg.version %>',
					' * @link <%= pkg.homepage %>',
					' * @license <%= pkg.license %>',
					' * @author <%= pkg.author %>',
					' */',
					'',
					'' ].join( '\n' );
	
	// Create file
	gulp.src( paths.src + '**/*.js' )
		.pipe( plugins.debug( { title: 'js:' } ) )
		.pipe( plugins.babel( { presets: [ '@babel/env' ] } ) )
		.pipe( plugins.if( bundle.compress, plugins.uglify( { mangle: true, compress: false } ) ) )
		.pipe( plugins.header( banner, { pkg: pkg } ) ) 
		.pipe( plugins.rename( fileName ) )
		.pipe( gulp.dest( paths.build, { overwrite: true } ) );

	done( );
} );

// Standart Build
gulp.task( 'build', gulp.series( function( done ) { bundle = bundles[ 'dev' ]; done( ); }, 'js:build' ) );

// Minified Build
gulp.task( 'build:min', gulp.series( function( done ) { bundle = bundles[ 'min' ]; done( ); }, 'js:build' ) );

// Default
gulp.task( 'default', gulp.series( 'clean', 'config:sync', 'build', 'build:min', function( done )
{
	gulp.watch( paths.src + '**/*.js', gulp.series( [ 'build', 'build:min' ] ) );

	done( );
} ) );