'use strict';

/* * * * * * * * * * * * * *
 *  Подключениемые модули 
 * * * * * * * * * * * * * */

var gulp = require( 'gulp' ),
	gulpif = require( 'gulp-if' ),
	rename = require( 'gulp-rename' ),
	watch = require( 'gulp-watch' ),
	debug = require( 'gulp-debug' ),
	sync = require( 'gulp-config-sync' ),
	header = require('gulp-header'),
	rimraf = require( 'rimraf' ),
	uglify = require( 'gulp-uglify' ),
	babel = require( 'gulp-babel' );

/* * * * * * * * * * * * * *
 * Переменные / Функции 
 * * * * * * * * * * * * * */

// Основные параметры плагина
var params = 
{
	fileName: 'jquery.myData'
};

// Пути
var paths = 
{
	src: './src/',
	build: './build/'
};

// Параметры сборок
var bundles =
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

// Сборка по умолчанию
var bundle = bundles[ 'dev' ];

/* * * * * * * * * * * * * *
 * Задачи 
 * * * * * * * * * * * * * */

// Очищаем директорию сборки
gulp.task( 'clean', function( )
{  
    return rimraf.sync( paths.build + '/**' );
} );

// Синхронизация изменений конфигураций для bower и сomposer
gulp.task( 'config:sync', function( )
{
	var options = 
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
		.pipe( sync( options ) ) // Синхронизируем данные
		.pipe( gulp.dest( '.' ) );
} );

// Задача обработки скриптов библиотеки
gulp.task( 'js:build', function( ) 
{
	// Основные параметры
	var fileName = params.fileName + bundle.fileSuffix + '.js';
	
	// Формируем заголовок для файла
	var pkg = require( './package.json' ),
		banner = [ '/**',
					' * <%= pkg.name %> - <%= pkg.description %>',
					' * @version v<%= pkg.version %>',
					' * @link <%= pkg.homepage %>',
					' * @license <%= pkg.license %>',
					' * @author <%= pkg.author %>',
					' */',
					'',
					'' ].join( '\n' );
	
	// Собираем файл
    return gulp.src( paths.src + '/**/*.js' )
				.pipe( debug( { title: 'js:' } ) ) // Вывод пофайлового лога
				.pipe( babel( {	presets: [ 'es2015' ] } ) )
				.pipe( gulpif( bundle.compress, uglify( { mangle: true, compress: false } ) ) ) //
				.pipe( header( banner, { pkg: pkg } ) ) // Установка хидера
				.pipe( rename( fileName ) ) // Переименовываем
				.pipe( gulp.dest( paths.build ) );
} );

// Задача по сборке обычной версии
gulp.task( 'build', function( ) 
{
	bundle = bundles[ 'dev' ];
	gulp.start( 'js:build' ); 
} );

// Задача по сборке сжатой версии
gulp.task( 'build:min', function( ) 
{
	bundle = bundles[ 'min' ];
	gulp.start( 'js:build' ); 
} );

// Задача по умолчанию
gulp.task( 'default', function( ) 
{  
	// Запускаем основные задания
	gulp.start( 'clean', 'build', 'build:min' );

	// Надсмотрщики
	gulp.watch( paths.src + '/**/*.js', [ 'build:min', 'build' ] );
} );