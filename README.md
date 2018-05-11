# JQuery.MyData
[![Latest Stable Version](https://poser.pugx.org/ange007/jquery-mydata/v/stable)](https://packagist.org/packages/ange007/jquery-mydata)
[![Total Downloads](https://poser.pugx.org/ange007/jquery-mydata/downloads)](https://packagist.org/packages/ange007/jquery-mydata)
[![License](https://poser.pugx.org/ange007/jquery-mydata/license)](https://packagist.org/packages/ange007/jquery-mydata)
[![Build Status](https://travis-ci.org/ange007/JQuery.myData.svg?branch=master)](https://travis-ci.org/ange007/JQuery.myData)

Small JQuery&amp;Zepto plugin for two-ways data binding.

## Install
Composer:
```sh
$ php composer.phar require "ange007/jquery-mydata"
```
Bower:
```sh
$ bower install --save-dev ange007/jquery-mydata
```

## Uses
```javascript
$( /* parentElement */ ).myData( /* data object */, /* callback from all actions */ );
```
```javascript
$( 'body' ).myData( data, function( type, element, propName, value ) { ... } );
```
or 
```javascript
$( /* parentElement */ ).myData( /* data object */, /* callbacks */ );
```
```javascript
$( 'body' ).myData( data, {
	main: function( type, element, propName, value ) { ... }, // Main callback from all actions
	set: function( element, propName, value ) { ... }, // Callback from SET action
	get: function( element, propName, value ) { ... }, // Callback from GET action
	on: function( element, propName, value ) { ... } // Callback from ON action
} );
```

## Example
```html
<body>
	<div>
		<label><b>Actual time:</b></label>
		<span data-bind="time"></span>
	</div>

	<br />
	<div>
		<label><b>Activated "input:text":</b></label>
		<input type="checkbox" data-bind="check"/>
	</div>	

	<br />
	<div>
		<label><b>Text input test:</b></label> <input id="text-input" type="text" data-bind="text"/>
		<div>You write: "<span id="text-output">*</span>"</div>
	</div>

	<br />
	<div>
		<a href="#" class="button" data-on="click:test(message)">Проверка</a>
	</div>	
</body>
```

```javascript
// Time formating
function n( n )
{
	var ret = n > 9 ? "" + n: "0" + n;
	return ret;
}

// Get actual time
function getTime( )
{
	const time = new Date( );
	return n( time.getHours( ) ) + ':' + n( time.getMinutes( ) ) + ':' + n( time.getSeconds( ) );
}

// Uses data
var data = { 
	'time': getTime( ),
	'text': '',
	'check': true,
	'test': function( msg ) { alert( 'alert: ' + msg ); }
};

// Activate two-way binding
$( 'body' ).myData( data, function( type, element, key, value )
{
	if( key === 'text' ) { $( '#text-output' ).html( value ); }
	else if( key === 'check' ) { $( '#text-input' ).attr( 'disabled', !value ); }
} );

// Dynamical time update
setInterval( function( ) { data.time = getTime( ); }, 1000 );

// Changed data and checked data-binding
data.text = 'My text';
```