;( function( factory )
{
	// AMD
	if( typeof define === 'function' && define.amd ) { define( [ 'jquery' ], factory ); } 
	// CommonJS
	else if( typeof exports === 'object' ) { module.exports = factory( window.Zepto || window.jQuery || window.$ || require( 'jquery' ), window, document ); } 
	// 
	else { factory( window.Zepto || window.jQuery || window.$, window, document ); }
}

( function( $, window, document )
{
	'use strict';

	//
	const pluginName = 'myData';
	const isJQ = !!( window.jQuery );

	// Plugin
	class Plugin 
	{
		constructor( element, targetOrOptions, callback )
		{
			//
			this.bindings = [ ];
			this.checkTimer = undefined;
			this.bindEventsObserver = undefined;
			this.bindElementsObserver = undefined;

			//
			this.element = $( element );
			this.callbacks = { };
			this.keys = {
				'event': 'data-on',
				'event-value': 'data-on-value',
				'data': 'data-bind',
				'data-element': 'data-bind-element',
			};

			// Event and Data target
			if( typeof targetOrOptions === 'object' && targetOrOptions.hasOwnProperty( 'event' ) && targetOrOptions.hasOwnProperty( 'data' ) )
			{
				this.eventTarget = targetOrOptions.event;
				this.dataTarget = targetOrOptions.data;

				// Custom keys
				if( typeof targetOrOptions[ 'data-keys' ] === 'object' )
				{
					this.keys = { 
						'event': targetOrOptions[ 'data-keys' ][ 'event' ] || this.keys[ 'event' ],
						'event-value': targetOrOptions[ 'data-keys' ][ 'event-value' ] || this.keys[ 'event-value' ],
						'data': targetOrOptions[ 'data-keys' ][ 'data' ] || this.keys[ 'data' ],
						'data-element': targetOrOptions[ 'data-keys' ][ 'data-element' ] || this.keys[ 'data-element' ],
					};
				}
			}
			else
			{
				this.eventTarget = targetOrOptions;
				this.dataTarget = targetOrOptions;
			}

			// Callback`s
			if( typeof callback === 'function' )
			{
				this.callbacks.main = callback;
			}
			else if( typeof callback === 'object' )
			{
				this.callbacks.main = callback.main;
				this.callbacks.get = callback.get;
				this.callbacks.set = callback.set;
				this.callbacks.on = callback.on;
			}

			// Init
			this.bind( );
		}

		// Add events
		bind( )
		{
			const context = this;

			this._setBindEvents( );
			this._setEventListeners( );
			this._triggerBindElementEvents( );
			this._setCheckTimer( 250 );
		}

		// Remove events
		unbind( )
		{
			// Disable event watcher
			this.element.off( '.' + pluginName, '[' + this.keys[ 'data' ] + ']' )
						.off( '.' + pluginName, '[' + this.keys[ 'data-element' ] + ']' )
						.off( '.' + pluginName, '[' + this.keys[ 'event' ] + ']' );

			// Clear timer
			clearInterval( this.checkTimer );

			//
			this.bindEventsObserver.disconnect( );
			this.bindElementsObserver.disconnect( );

			//
			this.bindings = [ ];
		}

		// Set events 
		_setEventListeners( )
		{
			const context = this;
			const bindEvents = [ 'change', 'keyup', 'input', 'paste' ].map( function( item ) { return item += '.' + pluginName; } );
			const onEvents = [ 'click', 'dblclick', 'change', 'input', 'paste', 'load', 'unload', 'select', 
								'resize', 'scroll', 'submit', 'error', 'keydown', 'keyup', 'keypress', 
								'mouseover', 'mousedown', 'mouseup', 'mousemove', 'mouseout', 'mouseenter', 'mouseleave',
								'blur', 'focus', 'focusin', 'focusout' ].map( function( item ) { return item += '.' + pluginName; } );

			// Change state reaction
			// data-bind="key" 
			this.element.on( bindEvents.join( ' ' ), '[' + this.keys[ 'data' ] + ']', function( event )
			{
				const element = $( event.target );
				const targetKey = element.attr( context.keys[ 'data' ] );

				//
				let value = undefined;

				// Change values
				for( let i in context.bindings )
				{
					let item = context.bindings[ i ];

					if( item.element !== event.target || item.property !== targetKey ) { continue; }

					// Read value
					value = context._readElementValue( element, item.value );

					// Generate function name
					let setFunctionName = 'set' + targetKey.charAt( 0 ).toUpperCase( ) + targetKey.substr( 1 );

					// Only if value changed
					if( value !== item.value )
					{
						item.value = value;

						// Send value
						if( typeof context.dataTarget[ setFunctionName ] === 'function' ) { context.dataTarget[ setFunctionName ].apply( context.dataTarget, [ value ] );	}
						else if( typeof context.dataTarget[ targetKey ] === 'function' ) { context.dataTarget[ targetKey ].apply( context.dataTarget, [ value ] ); }
						else if( context.dataTarget.hasOwnProperty( targetKey ) ) { context.dataTarget[ targetKey ] = value; }

						break;
					}
				}

				//
				if( typeof context.callbacks.set === 'function' ) {	context.callbacks.set( element, targetKey, value, { type: event.type } ); }
				else if( typeof context.callbacks.main === 'function' )	{ context.callbacks.main( 'set', element, targetKey, value, { type: event.type } ); }
			} );

			// Element connection
			// data-bind-element="enabled,text:#id"
			// data-bind-element="[enabled:#id,text:input[name=qqq]]"
			// data-bind-element="visible:.class"
			this.element.on( bindEvents.join( ' ' ), '[' + this.keys[ 'data-element' ] + ']', function( event )
			{
				const element = $( event.target );
				const actionData = element.attr( context.keys[ 'data-element' ] );

				context._extractActions( element, actionData, function( action, selector )
				{
					const targetElement = $( selector );

					// Read value
					let value = context._readElementValue( element, targetElement.val( ) );

					// Set value
					context._setElementValue( targetElement, action, value );
				} );
			} );

			// Action reaction
			// data-on="focusin,focusout:action"
			// data-on="[click:action1,change:action2]"
			// data-on="click:test( '!!!' )"
			this.element.on( onEvents.join( ' ' ), '[' + this.keys[ 'event' ] + ']', function( event )
			{
				const element = $( this );
				const actionData = element.attr( context.keys[ 'event' ] );

				context._extractActions( element, actionData, function( eventType, handlerName )
				{
					const handlerFunc = handlerName.match( /([a-zA-Z0-9,\.\-_\/]+)(?:\(([^)]+)\))?$/ ) || false;

					//
					if( eventType != event.type || !handlerFunc ) { return ; }

					//
					const name = handlerFunc[ 1 ];
					const args = ( typeof handlerFunc[ 2 ] === 'string' ) ? handlerFunc[ 2 ].split( ',' ).map( function( item ) { return ( item.trim( ).match( /^['"]{0,}(.*?)['"]{0,}$/ )[ 1 ] || '' ); } ) : [ ];
					const targetFuncExist = ( context.eventTarget !== undefined && typeof context.eventTarget[ name ] === 'function' );
					const windowFuncExist = ( typeof window[ name ] === 'function' );

					// Read value
					const value = context._readElementValue( element, undefined );

					//
					let callArgs = $.extend( [ ], args );
					if( callArgs.length > 0 ) { callArgs.push( [ element, event, value ] ); }
					else { callArgs = [ value, [ element, event, value ] ]; }

					//
					let result = undefined;

					// Call function
					if( targetFuncExist )
					{
						result = context.eventTarget[ name ].apply( context.eventTarget, callArgs );
					}
					else
					{
						try { result = eval( name ).apply( window, callArgs ); } catch( err ) { console.warn( 'jQuery.myData: Could not call - "' + name + '"' ); }
					}

					// Callback
					if( typeof context.callbacks.on === 'function' ) { context.callbacks.on( element, name, value, { type: event.type, args: args } ); }
					else if( typeof context.callbacks.main === 'function' )	{ context.callbacks.main( 'on', element, name, value, { type: event.type, args: args } ); }

					//
					if( result === false )
					{
						event.stopPropagation( );

						return false;
					}
					//
					else if( result === true )
					{
						event.preventDefault( );

						return result;
					}
				} );
			} );
		}

		// Add new elements to [data-bind] list
		_setBindEvents( )
		{
			const context = this;
			const setBinding = function( element )
			{
				const $element = $( element ),
					propName = $element.attr( context.keys[ 'data' ] ) || '';

				if( propName === '' ) { return; }

				// Add element to list
				context.bindings.push( { element: element, property: propName, value: undefined } );
			}

			// Create the list of checked parameters
			this.element.find( '[' + this.keys[ 'data' ] + ']' ).each( function( index, item )
			{
				setBinding( item );
			} );

			// Wait new elements
			this.bindEventsObserver = new MutationObserver( function( mutations )
			{
				mutations.forEach( function( mutation ) 
				{
					mutation.addedNodes.forEach( function( item ) 
					{
						setBinding( item );
					} );
				} ); 
			} );

			//
			this.bindEventsObserver.observe( this.element[0], { childList: true } );
		}

		// [data-bind-element] Triggered events for new elements
		_triggerBindElementEvents( )
		{
			const context = this;
			const trigger = function( element )
			{
				const $element = $( element );
				const actionData = $element.attr( context.keys[ 'data-element' ] ) || '';

				if( actionData === '' ) { return; }

				context._extractActions( $element, actionData, function( action, selector )
				{
					const targetElement = $( selector );

					// Read value
					let value = context._readElementValue( $element, targetElement.val( ) );

					// Set value
					context._setElementValue( targetElement, action, value );
				} );
			}

			// Trigger leave elements
			this.element.find( '[' + this.keys[ 'data-element' ] + ']' ).each( function( index, item )
			{
				trigger( item );
			} );

			// Wait new elements
			this.bindElementsObserver = new MutationObserver( function( mutations )
			{
				mutations.forEach( function( mutation ) 
				{
					mutation.addedNodes.forEach( function( item ) 
					{
						trigger( item );
					} );
				} ); 
			} );

			//
			this.bindElementsObserver.observe( this.element[0], { childList: true } );
		}

		// Timer 
		_setCheckTimer( delay )
		{
			let context = this;

			// Clear timer
			clearInterval( this.checkTimer );

			//
			this.checkTimer = setInterval( function( )
			{
				for( let i in context.bindings )
				{
					let item = context.bindings[ i ];
					let element = $( item.element );
					let targetKey = item.property;
					let oldValue = item.value;
					let value = '';

					// Generate function name
					let getFunctionName = 'get' + targetKey.charAt( 0 ).toUpperCase( ) + targetKey.substr( 1 );

					// Read value
					if( typeof context.dataTarget[ getFunctionName ] === 'function' ) { value = context.dataTarget[ getFunctionName ]( ); }
					else if( typeof context.dataTarget[ targetKey ] === 'function' ) { value = context.dataTarget[ targetKey ]( ); }
					else if( context.dataTarget.hasOwnProperty( targetKey ) ) { value = context.dataTarget[ targetKey ]; }

					// Only if value changed
					if( value === oldValue ) { continue; }
					item.value = value;

					// Set value to element
					if( element.is( 'input[type="checkbox"]' ) || element.is( 'input[type="radio"]' ) ) { $( element ).attr( 'checked', value ); }
					else if( element.is( 'select' ) || element.is( 'input' ) || element.is( 'textarea' ) ) { $( element ).val( value ); }
					else { $( element ).html( value ); }

					// Callback
					if( typeof context.callbacks.get === 'function' ) { context.callbacks.get( element, targetKey, value, { } ); }
					else if( typeof context.callbacks.main === 'function' )	{ context.callbacks.main( 'get', element, targetKey, value, { } ); }
				}
			}, delay );
		}

		// Read value
		_readElementValue( element, oldValue )
		{
			let value = undefined;
			let elementValue = $( element ).attr( 'value' );
			let customValue = $( element ).attr( this.keys[ 'event-value' ] );

			// data-on-value
			if( customValue !== undefined && customValue !== '' ) { value = customValue; }
			// input:checkbox
			else if( element.is( 'input[type="checkbox"]' ) || element.is( 'input[type="radio"]' ) )
			{
				if( typeof oldValue !== 'boolean' && elementValue !== undefined ) { value = $( element ).is( ':checked' ) ? elementValue : false }
				else { value = $( element ).is( ':checked' ); }
			}
			// select
			else if( element.is( 'select' ) )
			{
				if( typeof oldValue === 'number' ) { value = $( element ).find( ':selected' ).index( );  }
				else { value = $( element ).val( ); }
			}
			// input
			else if( element.is( 'input' ) || element.is( 'textarea' ) ) { value = $( element ).val( ); }
			// link
			else if( element.is( 'a' ) ) { value = $( element ).attr( 'href' ); }
			// form
			else if( element.is( 'form' ) )
			{
				value = { };
				$( element[0] ).serializeArray( ).forEach( function( x ) { value[ x.name ] = x.value; } );
			}

			// If unable to read the value
			if( value === '' || value === undefined ) { value = elementValue || $( element ).html( ); }

			return value;
		}

		// Set value
		_setElementValue( element, event, value )
		{
			if( event === 'visible' || event === 'hidden' )
			{
				let state = ( event === 'visible' ? 'hidden' : 'visible' );

				if( ( typeof value === 'boolean' && value )
					|| ( typeof value === 'string' && ( value === 'yes' || value === 'y' || value === 'true' ) )
					|| ( typeof value === 'integer' && value >= 1 ) ) { state = event; }

				// Display invisible
				if( element.css( 'display' ) === '' 
					|| element.css( 'display' ) === 'block' 
					|| element.css( 'display' ) === 'none' )
				{
					element.css( 'display', ( state === 'hidden' ? 'none' : 'block' ) );
				}
				else
				{
					element.css( 'visibility', state );
				}
			}
			else if( event === 'enabled' || event === 'disabled' )
			{
				if( ( typeof value === 'boolean' && value === true )
					|| ( typeof value === 'string' && ( value === 'yes' || value === 'y' ) )
					|| ( typeof value === 'integer' && value >= 1 ) )
				{
					if( event === 'enabled' ) { element.removeAttr( 'disabled' ); }
					else { element.attr( 'disabled', 'disabled' ); }
				}
				else
				{
					if( event === 'disabled' ) { element.removeAttr( 'disabled' ); }
					else { element.attr( 'disabled', 'disabled' ); }
				}
			}
			else
			{
				if( element.is( 'input' ) || element.is( 'textarea' ) ) { element.val( value ); }
				else { element.text( value ); }
			}
		}

		// Extract actions from data
		// ="focusin,focusout:action" 
		// ="[click:action1,change:action2]"
		// ="click:test( '!!!' )"
		_extractActions( element, actionData, callback )
		{
			let defaultEvent = 'click';
			if( element.is( 'form' ) ) { defaultEvent = 'submit'; }
			else if( element.is( 'input, select, textarea' ) ) { defaultEvent = 'change'; }

			//
			let actionList = [ ];

			//
			if( typeof actionData !== 'string' )
			{
				console.error( 'jQuery.myData: Empty data in [' + context.keys[ 'event' ] + '].' );
				return ;
			}
			else
			{
				actionList = ( actionData.indexOf( '[' ) === 0 ) ? ( actionData.match( /[\[\{}](.*?)[\}\]]/ )[ 1 ] || '' ).split( ',' ) : [ actionData ];
			}

			//
			actionList.forEach( function( listItem, i, arr ) 
			{
				const onData = listItem.indexOf( ':' ) >= 0 ? listItem.split( ':' ) : [ defaultEvent, listItem ];
				const actions = onData[ 0 ].trim( ).split( ',' );
				const value = onData[ 1 ].trim( );

				// 
				if( !value ) { return ; }

				//
				actions.forEach( function( action, i, arr )
				{
					callback( action, value );
				} );
			} );
		}

		// Destroy
		destroy( )
		{
			this.unbind( );
		}
	};

	// Plugin init
	$.fn[ pluginName ] = function( params, callback )
	{
		const args = arguments;

		// Object
		if( params === undefined || typeof params === 'object' )
		{
			this.each( function( )
			{
				const instance = isJQ ? $( this ).data( '_' + pluginName ) : $( this )[ 0 ][ '_' + pluginName ];
				const id = ( typeof params === 'object' && params.hasOwnProperty( 'exlusive' ) ) ? '' : Math.random( ).toString( 36 ).substring( 7 );

				if( !instance || id !== '' )
				{
					let plugin = new Plugin( this, params, callback );

					if( isJQ ) { $( this ).data( '_' + pluginName, plugin ); }
					else { $( this )[ 0 ][ '_' + pluginName ] = plugin;	}
				}
			} );

			return $( this );
		}
		// String
		else if( typeof params === 'string' && params[0] !== '_' && params !== 'init' )
		{
			let returns = undefined;

			this.each( function( )
			{
				const instance = isJQ ? $( this ).data( '_' + pluginName ) : $( this )[ 0 ][ '_' + pluginName ];

				if( instance instanceof Plugin && typeof instance[ params ] === 'function' )
				{
					returns = instance[ params ].apply( instance, Array.prototype.slice.call( args, 1 ) );
				}
			} );

			return returns !== undefined ? returns : $( this );
		}
	};
} ) );
