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
- **exclusive** ```(boolean, default: false)``` - recreate plugin and event listeners if the plugin has already been used on this element.
- **data-keys** ```(object)``` - keys for working with data and events:
	- **event** ```(string, default: 'data-on')```
	- **value** ```(string, default: 'data-value')```
	- **default-value** ```(string, default: 'data-default-value')```
	- **data** ```(string, default: 'data-bind')```
	- **data-element** ```(string, default: 'data-bind-element')```

## Uses
### Data Binding (control-to-object)
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
/* Output actual time */
<span data-bind="time"></span>

/* Intercepte change state */
<input type="checkbox" data-bind="check"/>

/* Text data transfer */
<label><b>Text input:</b></label> <input id="text-input" type="text" data-bind="text"/>
<div>You write: "<span id="text-output">*</span>"</div>
```

### Action Reaction
```html
/* Function execution */
<a href="#" class="button" data-on="click:test( 'message' )">Test</a>
<input type="checkbox" data-on="console.warn( 'click' )"/>

/* Function execution (custom value) */
<a href="#" class="button" data-on="click:test" data-on-value="message">Test</a>

/* Multiple function execution */
<input type="checkbox" data-on="[ click: console.warn( 'click' ), change: console.warn( 'change' ) ]"/>
```

### Data Binding (control-to-control)
```html
/* Enabled control, and show block */
<input type="checkbox" value="y" data-bind-element="[enabled:#text-element-input,visible:#text-element-block]"/>

<input id="text-element-input" type="text" data-bind-element="text:#text-element-output" disabled/>
<div id="text-element-block" style="visibility: hidden;">You write: "<span id="text-element-output">*</span>"</div>
```