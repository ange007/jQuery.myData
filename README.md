# jQuery.MyData
[![Latest Stable Version](https://poser.pugx.org/ange007/jquery-mydata/v/stable)](https://packagist.org/packages/ange007/jquery-mydata)
[![Total Downloads](https://poser.pugx.org/ange007/jquery-mydata/downloads)](https://packagist.org/packages/ange007/jquery-mydata)
[![License](https://poser.pugx.org/ange007/jquery-mydata/license)](https://packagist.org/packages/ange007/jquery-mydata)
[![Build Status](https://travis-ci.org/ange007/jQuery.myData.svg?branch=master)](https://travis-ci.org/ange007/JQuery.myData)

Small jQuery&amp;Zepto plugin for two-ways data binding.

## Install
Composer:
```sh
$ php composer.phar require "ange007/jquery-mydata"
```
Bower:
```sh
$ bower install --save-dev ange007/jquery-mydata
```

## Initialize
```javascript
$( /* parentElement */ ).myData( /* data and event object */, /* callback from all actions */ );
```
```javascript
$( /* parentElement */ ).myData( /* options object */, /* callbacks object */ );
```
```javascript
$( 'body' ).myData( object, function( type, element, propName, value, data ) { ... } );
```
```javascript
$( 'body' ).myData( { event: eventObject, data: dataObject }, function( type, element, propName, value, data ) { ... } );
```
```javascript
$( 'body' ).myData( data, {
	main: function( type /* event type */, element, propName, value, data ) { ... }, // Main callback from all actions
	set: function( element, propName, value, data /* [ eventType ] */ ) { ... }, // Callback from SET action
	get: function( element, propName, value, data /* [ ] */ ) { ... }, // Callback from GET action
	on: function( element, propName, value, data /* [ eventType, callArgs ] */ ) { ... } // Callback from ON action
} );
```

## Options
- **event** ```(object)``` - object for **[data-on]** actions.
- **data** ```(object)``` - object for **[data-bind]** actions.
- **exlusive** ```(boolean, default: false)``` - recreate plugin and event listeners if the plugin has already been used on this element.
- **data-keys** ```(object)``` - keys for working with data and events:
	- **event** ```(string, default: 'data-on')```
	- **event-value** ```(string, default: 'data-on-value')```
	- **data** ```(string, default: 'data-bind')```

## Uses
```javascript
{
	var data = { 
		'time': getTime( ),
		'check': false,
		'test': function( value, elementData /* [ element, elementEvent, elementValue ] */ ) { alert( 'Test alert: ' + value ); }
	};

	$( 'body' ).myData( data, function( type, element, propName, value, data )
	{
		if( key === 'text' ) { $( '#text-output' ).html( value ); }
		else if( key === 'check' ) { $( '#text-input' ).attr( 'disabled', !value ); }
	} );
}
```

```html
<span data-bind="time"></span>
```
```html
<input type="checkbox" data-bind="check"/>
```
```html
<label><b>Text input:</b></label> <input id="text-input" type="text" data-bind="text"/>
<div>You write: "<span id="text-output">*</span>"</div>
```
```html
<a href="#" class="button" data-on="click:test( 'message' )">Test</a>
```
```html
<input type="checkbox" data-on="console.warn( 'click' )"/>
```
```html
<input type="checkbox" data-on="[ click: console.warn( 'click' ), change: console.warn( 'change' ) ]"/>
```