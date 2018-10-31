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
	let Plugin = function( element, targetOrOptions, callback )
	{
		//
		this.bindings = [ ];
		this.checkTimer = undefined;

		//
		this.element = $( element );
		this.callbacks = { };
		this.keys = { 
			'event': 'data-on',
			'event-value': 'data-on-value',
			'data': 'data-bind',
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
	};

	Plugin.prototype =
	{
		// Add events
		bind: function( )
		{
			const context = this;
			
			// Формируем список проверяемых параметров
			// @todo: Будет не верно работать в случае с динамически изменяемым содержимим элемента 
			//		(так как считывание происходит только один раз)
			this.element.find( '[' + this.keys[ 'data' ] + ']' ).each( function( index, item )
			{
				let element = $( item ),
					propName = element.attr( context.keys[ 'data' ] ) || '';
				
				if( propName === '' ) { return; }

				// Add element to list
				context.bindings.push( { element: item, property: propName, value: undefined } );
			} );
			
			this._setEventListeners( );
			this._setCheckTimer( );
		},
		
		// Remove events
		unbind: function( )
		{
			// Отключение проверки событий
			this.element.off( '.' + pluginName, '[' + this.keys[ 'data' ] + ']' )
						.off( '.' + pluginName, '[' + this.keys[ 'event' ] + ']' )
						.off( '.' + pluginName, '[' + this.keys[ 'event-value' ] + ']' );
						
			// Clear timer
			clearInterval( this.checkTimer );
			
			//
			this.bindings = [ ];
		},
		
		// Реакция на изменение состояния элемента
		_setEventListeners: function( )
		{
			const context = this;
			const bindEvents = [ 'change', 'keydown', 'input', 'paste' ].map( function( item ) { return item += '.' + pluginName; } );
			const onEvents = [ 'click', 'dblclick', 'change', 'input', 'paste', 'load', 'unload', 'select', 
								'resize', 'scroll', 'submit', 'error', 'keydown', 'keyup', 'keypress', 
								'mouseover', 'mousedown', 'mouseup', 'mousemove', 'mouseout', 'mouseenter', 'mouseleave',
								'blur', 'focus', 'focusin', 'focusout' ].map( function( item ) { return item += '.' + pluginName; } );

			// Реакция на смену состояния элемента
			// data-bind="key" 
			this.element.on( bindEvents.join( ' ' ), '[' + this.keys[ 'data' ] + ']', function( event )
			{
				let element = $( event.target );
				let targetKey = element.attr( context.keys[ 'data' ] );
				let value = undefined;

				// Заменяем значение в список
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
				if( typeof context.callbacks.set === 'function' ) {	context.callbacks.set( element, targetKey, value, { } ); }
				else if( typeof context.callbacks.main === 'function' )	{ context.callbacks.main( 'set', element, targetKey, value, { } ); }
			} );
			
			// Обработка установленных событий
			// data-on="focusin,focusout:action" 
			// data-on="[click:action1,change:action2]"
			// data-on="click:test( '!!!' )"
			this.element.on( onEvents.join( ' ' ), '[' + this.keys[ 'event' ] + ']', function( event )
			{
				const element = $( this );
				const actionData = element.attr( context.keys[ 'event' ] );

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
				actionList.forEach( function( action, i, arr ) 
				{
					const onData = action.indexOf( ':' ) >= 0 ? action.split( ':' ) : [ 'click', action ];
					const eventTypes = onData[ 0 ].trim( ).split( ',' );
					const handlerName = onData[ 1 ].trim( );
					const handlerFunc = handlerName.match( /([a-zA-Z0-9,\.\-_\/]+)(?:\(([^)]+)\))?$/ ) || false;
					
					// Если данной событие не указано в перечне - игнорируем
					if( eventTypes.indexOf( event.type ) < 0 ) { return ; }
					
					// Вызов функции
					if( handlerFunc )
					{
						const name = handlerFunc[ 1 ];
						const args = ( typeof handlerFunc[ 2 ] === 'string' ) ? handlerFunc[ 2 ].split( ',' ).map( function( item ) { return ( item.trim( ).match( /^['"]{0,}(.*?)['"]{0,}$/ )[ 1 ] || '' ); } ) : [ ];
						const targetFuncExist = ( context.eventTarget !== undefined && typeof context.eventTarget[ name ] === 'function' );
						const windowFuncExist = ( typeof window[ name ] === 'function' );
						
						// Read value and arguments
						const value = context._readElementValue( element, undefined );
						const callArgs = $.extend( [ ], ( args.length > 0 ? [ args, [ element, event, value ] ] : [ value, [ element, event, value ] ] ) );

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

							return true;
						}
					}
				} );
			} );
		},
		
		// Timer 
		_setCheckTimer: function( delay = 250 )
		{
			let context = this;
			
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
					if( value !== oldValue )
					{
						item.value = value;
						
						// Set value to element
						if( element.is( 'input[type="checkbox"]' ) || element.is( 'input[type="radio"]' ) ) { $( element ).attr( 'checked', value ); }
						else if( element.is( 'select' ) || element.is( 'input' ) || element.is( 'textarea' ) ) { $( element ).val( value ); }
						else { $( element ).html( value ); }

						// Callback
						if( typeof context.callbacks.get === 'function' ) { context.callbacks.get( element, targetKey, value, { } ); }
						else if( typeof context.callbacks.main === 'function' )	{ context.callbacks.main( 'get', element, targetKey, value, { } ); }
					}
				}
			}, delay );
		},
		
		// Считывание значения
		_readElementValue: function( element, oldValue )
		{
			let value = undefined;
			let elementValue = $( element ).attr( 'value' );
			let customValue = $( element ).attr( this.keys[ 'event-value' ] );

			// input:checkbox
			if( element.is( 'input[type="checkbox"]' ) || element.is( 'input[type="radio"]' ) )
			{
				if( typeof oldValue !== 'boolean' && elementValue !== undefined ) { value = $( element ).is( ':checked' ) ? elementValue : '' }
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

			// Если не удалось считать значение
			if( value === '' || value === undefined ) { value = elementValue || customValue || $( element ).html( ); };
			
			return value;
		},
		
		// Уничтожение плагина
		destroy: function( )
		{
			this.unbind( );
		}
	};

	// Прописываем плагин
	$.fn[ pluginName ] = function( params, callback )
	{
		const args = arguments;

		// Если параметры это объект
		if( params === undefined || typeof params === 'object' )
		{
			// Проходим по компонентам
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
		// Если параметры это строка
		else if( typeof params === 'string' && params[0] !== '_' && params !== 'init' )
		{
			let returns = undefined;
			
			//
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
