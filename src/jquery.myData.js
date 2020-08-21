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
		constructor( element, targetOrOptions, callback, debug )
		{
			//
			this.debug = debug;
			this.bindings = [ ];
			this.checkTimer = undefined;
			this.bindEventsObserver = undefined;
			this.bindElementsObserver = undefined;

			//
			this.element = $( element );
			this.callbacks = { };
			this.keys = {
				'event': 'data-on',
				'data': 'data-bind',
				'data-element': 'data-bind-element',
				'value': 'data-value',
				'default-value': 'data-default-value',
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
						'value': targetOrOptions[ 'data-keys' ][ 'value' ] || this.keys[ 'value' ],
						'default-value': targetOrOptions[ 'data-keys' ][ 'default-value' ] || this.keys[ 'default-value' ],
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
			const bindEvents = [ 'change', 'keyup', 'input', 'paste' ].map( ( item ) => { return item += '.' + pluginName; } );
			const onEvents = [ 'click', 'dblclick', 'change', 'input', 'paste', 'load', 'unload', 'select', 
								'resize', 'scroll', 'submit', 'error', 'keydown', 'keyup', 'keypress', 
								'mouseover', 'mousedown', 'mouseup', /*'mousemove',*/ 'mouseout', 'mouseenter', 'mouseleave',
								'blur', 'focus', 'focusin', 'focusout' ].map( ( item ) => { return item += '.' + pluginName; } );

			// Change state reaction
			// data-bind="key" 
			this.element.on( bindEvents.join( ' ' ), '[' + this.keys[ 'data' ] + ']', ( event ) =>
			{
				const element = $( event.currentTarget );
				const targetKey = element.attr( this.keys[ 'data' ] );

				//
				let value = undefined;

				// Change values
				for( let i in this.bindings )
				{
					let item = this.bindings[ i ];

					if( item.element !== event.currentTarget || item.property !== targetKey ) { continue; }

					// Read value
					value = this._readElementValue( element, item.value );

					// Generate function name
					let setFunctionName = 'set' + targetKey.charAt( 0 ).toUpperCase( ) + targetKey.substr( 1 );

					// Only if value changed
					if( value !== item.value )
					{
						item.value = value;

						// Send value
						if( typeof this.dataTarget[ setFunctionName ] === 'function' ) { this.dataTarget[ setFunctionName ].apply( this.dataTarget, [ value ] );	}
						else if( typeof this.dataTarget[ targetKey ] === 'function' ) { this.dataTarget[ targetKey ].apply( this.dataTarget, [ value ] ); }
						else if( this.dataTarget.hasOwnProperty( targetKey ) ) { this.dataTarget[ targetKey ] = value; }

						break;
					}
				}

				//
				if( this.debug ) { console.info( `jQuery.myData - Binding Data (element > object) (data-bind): Set "${ value }" to "(set)${ targetKey }", event: ${ event.type }`, element.get( 0 ) ); }

				//
				if( typeof this.callbacks.set === 'function' ) { this.callbacks.set( element, targetKey, value, { type: event.type } ); }
				else if( typeof this.callbacks.main === 'function' ) { this.callbacks.main( 'set', element, targetKey, value, { type: event.type } ); }
			} );

			// Element connection
			// data-bind-element="enabled,text:#id"
			// data-bind-element="[enabled:#id,text:input[name=qqq]]"
			// data-bind-element="visible:.class"
			this.element.on( bindEvents.join( ' ' ) + ' click', '[' + this.keys[ 'data-element' ] + ']', ( event ) =>
			{
				const element = $( event.currentTarget );
				const actionData = element.attr( this.keys[ 'data-element' ] );

				this._extractActions( element, actionData, ( action, selector ) =>
				{
					const targetElement = element.find( selector ).length 
											? element.find( selector ) 
											: $( selector );

					// Read value
					let value = this._readElementValue( element, targetElement.val( ) );

					//
					if( this.debug ) { console.info( `jQuery.myData - Element connection (data-bind-element): Set element "${ selector }" value: "${ value }", event: ${ event.type }`, element.get( 0 ) ); }

					// Set value
					this._setElementValue( targetElement, action, value );
				} );
			} );

			// Action reaction
			// data-on="focusin,focusout:action"
			// data-on="[click:action1,change:action2]"
			// data-on="click:test( '!!!' )"
			this.element.on( onEvents.join( ' ' ), '[' + this.keys[ 'event' ] + ']', ( event ) =>
			{
				const element = $( event.currentTarget );
				const actionData = element.attr( this.keys[ 'event' ] );

				this._extractActions( element, actionData, ( eventType, handlerName ) => 
				{
					const handlerFunc = handlerName.match( /([a-zA-Z0-9,\.\-_\/]+)(?:\(([^)]+)\))?$/ ) || false;

					//
					if( eventType != event.type || !handlerFunc ) { return ; }

					//
					const name = handlerFunc[ 1 ];
					const args = ( typeof handlerFunc[ 2 ] === 'string' ) ? handlerFunc[ 2 ].split( ',' ).map( ( item ) => { return ( item.trim( ).match( /^['"]{0,}(.*?)['"]{0,}$/ )[ 1 ] || '' ); } ) : [ ];
					const targetFuncExist = ( this.eventTarget !== undefined && typeof this.eventTarget[ name ] === 'function' );
					const windowFuncExist = ( typeof window[ name ] === 'function' );

					// Read value
					const value = this._readElementValue( element, undefined );

					//
					let callArgs = $.extend( [ ], args );
					if( callArgs.length > 0 ) { callArgs.push( { element: element, event: event, value: value } ); }
					else { callArgs = [ value, { element: element, event: event, value: value } ]; }

					//
					let result = undefined;

					// Call function
					if( targetFuncExist )
					{
						result = this.eventTarget[ name ].apply( this.eventTarget, callArgs );
					}
					else
					{
						try { result = eval( name ).apply( window, callArgs ); } 
						catch( err ) { console.warn( `jQuery.myData: Could not call - "${ name }"` ); }
					}

					//
					if( this.debug ) { console.info( `jQuery.myData - Action Reaction (data-on): Call function "${ handlerName }", event: ${ event.type }`, element.get( 0 ) ); }

					// Callback
					if( typeof this.callbacks.on === 'function' ) { this.callbacks.on( element, name, value, { type: event.type, args: args } ); }
					else if( typeof this.callbacks.main === 'function' ) { this.callbacks.main( 'on', element, name, value, { type: event.type, args: args } ); }

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

			//
			if( this.debug ) { console.info( `jQuery.myData - Set Event Listeners`, this.element ); }
		}

		// Add new elements to [data-bind] list
		_setBindEvents( )
		{
			const setBinding = ( element ) =>
			{
				const $element = $( element ),
					propName = $element.attr( this.keys[ 'data' ] ) || '';

				if( propName === '' ) { return; }

				// Add element to list
				this.bindings.push( { element: element, property: propName, value: undefined } );
			}

			// Create the list of checked parameters
			this.element.find( '[' + this.keys[ 'data' ] + ']' ).each( ( index, item ) =>
			{
				setBinding( item );
			} );

			// Wait new elements
			this.bindEventsObserver = new MutationObserver( ( mutations ) =>
			{
				mutations.forEach( ( mutation ) =>
				{
					mutation.addedNodes.forEach( ( item ) =>
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
			const trigger = ( element, firstInit ) =>
			{
				const $element = $( element );
				const actionData = $element.attr( this.keys[ 'data-element' ] ) || '';

				if( actionData === '' ) { return; }

				this._extractActions( $element, actionData, ( action, selector ) =>
				{
					const targetElement = $( selector );

					// Read value
					let value = undefined;
					if( firstInit ) { value = $( element ).attr( this.keys[ 'default-value' ] ); };
					if( !value ) { value = this._readElementValue( $element, targetElement.val( ) ); }

					// Set value
					this._setElementValue( targetElement, action, value );
				} );
			}

			// Trigger leave elements
			this.element.find( '[' + this.keys[ 'data-element' ] + ']' ).each( ( index, item ) =>
			{
				trigger( item, true );
			} );

			// Wait new elements
			this.bindElementsObserver = new MutationObserver( ( mutations ) =>
			{
				mutations.forEach( ( mutation ) =>
				{
					mutation.addedNodes.forEach( ( item ) =>
					{
						trigger( item, true );
					} );
				} ); 
			} );

			//
			this.bindElementsObserver.observe( this.element[0], { childList: true } );
		}

		// Timer 
		// @todo: Replace to Object.defineProperty( get( ): { }, set( ): { } ) ?
		_setCheckTimer( delay )
		{
			// Clear timer
			clearInterval( this.checkTimer );

			//
			this.checkTimer = setInterval( ( ) =>
			{
				for( let i in this.bindings )
				{
					let item = this.bindings[ i ];
					let element = $( item.element );
					let targetKey = item.property;
					let oldValue = item.value;
					let value = '';

					// Generate function name
					let getFunctionName = 'get' + targetKey.charAt( 0 ).toUpperCase( ) + targetKey.substr( 1 );

					// Read value
					if( typeof this.dataTarget[ getFunctionName ] === 'function' ) { value = this.dataTarget[ getFunctionName ]( ); }
					else if( typeof this.dataTarget[ targetKey ] === 'function' ) { value = this.dataTarget[ targetKey ]( ); }
					else if( this.dataTarget.hasOwnProperty( targetKey ) ) { value = this.dataTarget[ targetKey ]; }

					// Only if value changed
					if( value === oldValue ) { continue; }
					item.value = value;

					// Set value to element
					if( element.is( 'input[type="checkbox"]' ) || element.is( 'input[type="radio"]' ) ) { element.attr( 'checked', value ); }
					else if( element.is( 'select' ) || element.is( 'input' ) || element.is( 'textarea' ) ) { element.val( value ); }
					else { element.html( value ); }

					//
					if( this.debug ) { console.info( `jQuery.myData - Binding Data (object > element) (data-bind): Read "${ value }" from "(get)${ targetKey }"`, element.get( 0 ) ); }

					// Callback
					if( typeof this.callbacks.get === 'function' ) { this.callbacks.get( element, targetKey, value, { } ); }
					else if( typeof this.callbacks.main === 'function' ) { this.callbacks.main( 'get', element, targetKey, value, { } ); }
				}
			}, delay );
		}

		// Read value
		_readElementValue( element, oldValue )
		{
			let value = undefined;
			let elementValue = $( element ).attr( 'value' );
			let customValue = $( element ).attr( this.keys[ 'value' ] );

			// data-value
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
				$( element[ 0 ] ).serializeArray( ).forEach( ( x ) => { value[ x.name ] = x.value; } );
			}

			// If unable to read the value
			if( value === '' || value === undefined ) { value = elementValue || $( element ).html( ); }

			return value;
		}

		// Set value
		_setElementValue( element, event, value )
		{
			const isBooleanVal = this._valIsBoolean( value );
			const booleanVal = this._valToBoolean( value );
			const isInit = element.data( 'myData-init' );

			let state;

			if( event === 'visible' || event === 'hidden' )
			{
				const isDisplay = ( element.css( 'display' ) === '' 
									|| element.css( 'display' ) === 'block' 
									|| element.css( 'display' ) === 'none' );

				// set
				if( isBooleanVal ) { state = ( event === 'visible' && booleanVal ) ? 'visible' : 'hidden'; }
				// toggle
				else { state = ( event === 'visible' && element.is( ':visible' ) ) ? 'hidden' : 'visible'; }

				//
				if( isDisplay ) { element.css( 'display', ( state === 'hidden' ? 'none' : 'block' ) ); }
				else { element.css( 'visibility', state ); }
			}
			else if( event === 'enabled' || event === 'disabled' )
			{
				// set
				if( isBooleanVal ) { state = ( !booleanVal && event === 'enabled' ) || ( booleanVal && event === 'disabled' ); }
				// toggle
				else { state = element.is( ':disabled' ); }

				//
				if( !state ) { element.removeAttr( 'disabled' ); }
				else { element.attr( 'disabled', 'disabled' ); }
			}
			else if( event === 'slide' )
			{
				// set
				if( isBooleanVal ) { state = booleanVal; }
				// toggle
				else { state = !element.is( ':visible' ); }

				//
				if( state ) { element.slideDown( 200 ); }
				else { element.slideUp( 200 ); }
			}
			else
			{
				if( element.is( 'input' ) || element.is( 'textarea' ) ) { element.val( value ); }
				else { element.text( value ); }
			}

			//
			element.data( 'myData-init', true );
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
				// console.error( 'jQuery.myData: Empty data in [' + this.keys[ 'event' ] + '].' );
				return ;
			}
			else
			{
				if( actionData.indexOf( '[' ) === 0 )
				{
					try { actionList = JSON.parse( actionData ); }	
					catch { actionList = ( actionData.match( /[\[\{}](.*?)[\}\]]/ )[ 1 ] || '' ).split( ',' ); }
				}
				else { actionList = actionData.split( ',' ); }
			}

			//
			actionList.forEach( ( listItem, i, arr ) =>
			{
				const onData = listItem.indexOf( ':' ) >= 0 ? listItem.split( ':' ) : [ defaultEvent, listItem ];
				const actions = onData[ 0 ].trim( ).split( ',' );
				const value = onData[ 1 ].trim( );

				// 
				if( !value ) { return ; }

				//
				actions.forEach( ( action, i, arr ) =>
				{
					callback( action, value );
				} );
			} );
		}

		_valIsBoolean( value ) 
		{
			return ( ( typeof value === 'boolean' && value )
					|| ( typeof value === 'string' && [ 'yes', 'true', 'y', 'no', 'false', 'n' ].indexOf( value ) !== -1 )
					|| ( typeof value === 'integer' && [ 0, 1 ].indexOf( value ) !== -1 ) );
		}

		_valToBoolean( value )
		{
			return ( ( typeof value === 'boolean' && value )
					|| ( typeof value === 'string' && [ 'yes', 'true', 'y' ].indexOf( value ) !== -1 )
					|| ( typeof value === 'integer' && value === 1 ) );
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
		const instance = isJQ 
						? $( this ).data( '_' + pluginName )
						: $( this )[ 0 ][ '_' + pluginName ];

		// Object
		if( params === undefined || typeof params === 'object' )
		{
			let id = Math.random( ).toString( 36 ).substring( 7 );
			let debug = false;

			if( typeof params === 'object' )
			{
				if( params.exclusive )
				{
					id = '';
					delete params.exclusive;
				}

				if( params.debug )
				{
					debug = true;
					delete params.debug;
				}
			}

			if( !instance || id !== '' )
			{
				let plugin = new Plugin( this, params, callback, debug );

				if( isJQ ) { $( this ).data( '_' + pluginName, plugin ); }
				else { $( this )[ 0 ][ '_' + pluginName ] = plugin;	}
			}

			return $( this );
		}
		// String
		else if( typeof params === 'string' && params[0] !== '_' && params !== 'init' )
		{
			const args = arguments;
			let returns = undefined;

			if( instance instanceof Plugin && typeof instance[ params ] === 'function' )
			{
				returns = instance[ params ].apply( instance, Array.prototype.slice.call( args, 1 ) );
			}

			return returns !== undefined ? returns : $( this );
		}
	};
} ) );
