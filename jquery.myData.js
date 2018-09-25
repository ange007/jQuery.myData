/**
 * jquery.mydata - Small JQuery&Zepto plugin for two-ways data binding.
 * @version v0.2.1
 * @link https://github.com/ange007/JQuery.myData
 * @license MIT
 * @author Borisenko Vladimir
 */

'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

;(function (factory) {
	// AMD
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	}
	// CommonJS
	else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
			module.exports = factory(window.Zepto || window.jQuery || window.$ || require('jquery'), window, document);
		}
		// 
		else {
				factory(window.Zepto || window.jQuery || window.$, window, document);
			}
})(function ($, window, document) {
	'use strict';

	//

	var pluginName = 'myData';
	var isJQ = !!window.jQuery;

	// Plugin
	var Plugin = function Plugin(element, targetOrOptions, callback) {
		//
		this.bindings = [];
		this.checkTimer = undefined;

		//
		this.element = $(element);
		this.callbacks = {};
		this.keys = {
			'event': 'data-on',
			'event-value': 'data-on-value',
			'data': 'data-bind'
		};

		// Event and Data target
		if ((typeof targetOrOptions === 'undefined' ? 'undefined' : _typeof(targetOrOptions)) === 'object' && targetOrOptions.hasOwnProperty('event') && targetOrOptions.hasOwnProperty('data')) {
			this.eventTarget = targetOrOptions.event;
			this.dataTarget = targetOrOptions.data;

			// Custom keys
			if (_typeof(targetOrOptions['data-keys']) === 'object') {
				this.keys = {
					'event': targetOrOptions['data-keys']['event'] || this.keys['event'],
					'event-value': targetOrOptions['data-keys']['event-value'] || this.keys['event-value'],
					'data': targetOrOptions['data-keys']['data'] || this.keys['data']
				};
			}
		} else {
			this.eventTarget = targetOrOptions;
			this.dataTarget = targetOrOptions;
		}

		// Callback`s
		if (typeof callback === 'function') {
			this.callbacks.main = callback;
		} else if ((typeof callback === 'undefined' ? 'undefined' : _typeof(callback)) === 'object') {
			this.callbacks.main = callback.main;
			this.callbacks.get = callback.get;
			this.callbacks.set = callback.set;
			this.callbacks.on = callback.on;
		}

		// Init
		this.bind();
	};

	Plugin.prototype = {
		// Навешивание событий и обработчиков
		bind: function bind() {
			var context = this;

			// Формируем список проверяемых параметров
			// @todo: Будет не верно работать в случае с динамически изменяемым содержимим элемента 
			//		(так как считывание происходит только один раз)
			this.element.find('[' + this.keys['data'] + ']').each(function (index, item) {
				var element = $(item),
				    propName = element.attr(context.keys['data']) || '';

				if (propName === '') {
					return;
				}

				// Записываем элемент
				context.bindings.push({ element: item, property: propName, value: undefined });
			});

			this._setEventListeners();
			this._setCheckTimer();
		},

		// Снятие событий и обработчиков
		unbind: function unbind() {
			// Отключение проверки событий
			this.element.off('.' + pluginName, '[' + this.keys['data'] + ']').off('.' + pluginName, '[' + this.keys['event'] + ']').off('.' + pluginName, '[' + this.keys['event-value'] + ']');

			// Таймер проверки значений
			clearInterval(this.checkTimer);

			//
			this.bindings = [];
		},

		// Реакция на изменение состояния элемента
		_setEventListeners: function _setEventListeners() {
			var context = this;
			var bindEvents = ['change', 'keydown', 'input', 'paste'].map(function (item) {
				return item += '.' + pluginName;
			});
			var onEvents = ['click', 'dblclick', 'change', 'input', 'paste', 'load', 'unload', 'select', 'resize', 'scroll', 'submit', 'error', 'keydown', 'keyup', 'keypress', 'mouseover', 'mousedown', 'mouseup', 'mousemove', 'mouseout', 'mouseenter', 'mouseleave', 'blur', 'focus', 'focusin', 'focusout'].map(function (item) {
				return item += '.' + pluginName;
			});

			// Реакция на смену состояния элемента
			// data-bind="key" 
			this.element.on(bindEvents.join(' '), '[' + this.keys['data'] + ']', function (event) {
				var element = $(event.target);
				var targetKey = element.attr(context.keys['data']);
				var value = undefined;

				// Заменяем значение в список
				for (var i in context.bindings) {
					var item = context.bindings[i];

					if (item.element !== event.target || item.property !== targetKey) {
						continue;
					}

					// Считываем значение
					value = context._readElementValue(element, item.value);

					// Имя функции для установки значения
					var setFunctionName = 'set' + targetKey.charAt(0).toUpperCase() + targetKey.substr(1);

					// Если значение изменилось с прошлого раза
					if (value !== item.value) {
						item.value = value;

						// Установка значения
						if (typeof context.dataTarget[setFunctionName] === 'function') {
							context.dataTarget[setFunctionName].apply(context.dataTarget, [value]);
						} else if (typeof context.dataTarget[targetKey] === 'function') {
							context.dataTarget[targetKey].apply(context.dataTarget, [value]);
						} else if (context.dataTarget.hasOwnProperty(targetKey)) {
							context.dataTarget[targetKey] = value;
						}

						break;
					}
				}

				//
				if (typeof context.callbacks.set === 'function') {
					context.callbacks.set(element, targetKey, value);
				} else if (typeof context.callbacks.main === 'function') {
					context.callbacks.main('set', element, targetKey, value);
				}
			});

			// Обработка установленных событий
			// data-on="focusin,focusout:action" 
			// data-on="[click:action1,change:action2]"
			// data-on="click:test( '!!!' )"
			this.element.on(onEvents.join(' '), '[' + this.keys['event'] + ']', function (event) {
				var element = $(this);
				var actionData = element.attr(context.keys['event']);

				//
				var actionList = [];

				//
				if (typeof actionData !== 'string') {
					console.error('jQuery.myData: Empty data in [' + context.keys['event'] + '].');
					return;
				} else {
					actionList = actionData.indexOf('[') === 0 ? (actionData.match(/[\[\{}](.*?)[\}\]]/)[1] || '').split(',') : [actionData];
				}

				//
				actionList.forEach(function (action, i, arr) {
					var onData = action.indexOf(':') >= 0 ? action.split(':') : ['click', action];
					var eventTypes = onData[0].trim().split(',');
					var handlerName = onData[1].trim();
					var handlerFunc = handlerName.match(/([a-zA-Z0-9,\.\-_\/]+)(?:\(([^)]+)\))?$/) || false;

					// Если данной событие не указано в перечне - игнорируем
					if (eventTypes.indexOf(event.type) < 0) {
						return;
					}

					// Вызов функции
					if (handlerFunc) {
						var name = handlerFunc[1];
						var args = typeof handlerFunc[2] === 'string' ? handlerFunc[2].split(',').map(function (item) {
							return item.trim().match(/^['"]{0,}(.*?)['"]{0,}$/)[1] || '';
						}) : [];
						var targetFuncExist = context.eventTarget !== undefined && typeof context.eventTarget[name] === 'function';
						var windowFuncExist = typeof window[name] === 'function';

						// Считываем значение элемента
						var value = context._readElementValue(element, undefined);
						// const callArgs = ( element.is( '[' + context.keys[ 'event-value' ] + ']' ) ? args.concat( [ element, value ] ) : ( args || [ element, value ] ) );
						var callArgs = [element, value].concat([args, event]);

						//
						var result = undefined;

						// Вызываем функцию
						if (targetFuncExist) {
							result = context.eventTarget[name].apply(context.eventTarget, callArgs);
						} else {
							try {
								result = eval(name).apply(window, callArgs);
							} catch (err) {
								console.warn('jQuery.myData: Could not call - "' + name + '"');
							}
						}

						// Вызываем события
						if (typeof context.callbacks.on === 'function') {
							context.callbacks.on(element, event.type, value);
						} else if (typeof context.callbacks.main === 'function') {
							context.callbacks.main('on', element, event.type, value);
						}

						//
						if (result === false) {
							event.stopPropagation();

							return false;
						}
						// 
						else result === true;
						{
							event.preventDefault();

							return true;
						}
					}
				});
			});
		},

		// Таймер прослушивания изменений объекта
		_setCheckTimer: function _setCheckTimer() {
			var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 250;

			var context = this;

			// Таймер проверки значений
			this.checkTimer = setInterval(function () {
				for (var i in context.bindings) {
					// Изменяемая ссылка на текущий элемент
					var item = context.bindings[i];
					var element = $(item.element);
					var targetKey = item.property;
					var oldValue = item.value;
					var value = '';

					// Имя функции для установки значения
					var getFunctionName = 'get' + targetKey.charAt(0).toUpperCase() + targetKey.substr(1);

					// Проверка функции "get"
					if (typeof context.dataTarget[getFunctionName] === 'function') {
						value = context.dataTarget[getFunctionName]();
					} else if (typeof context.dataTarget[targetKey] === 'function') {
						value = context.dataTarget[targetKey]();
					} else if (context.dataTarget.hasOwnProperty(targetKey)) {
						value = context.dataTarget[targetKey];
					}

					// Меняем значение элемента
					if (value !== oldValue) {
						item.value = value;

						//
						if (element.is('input[type="checkbox"]') || element.is('input[type="radio"]')) {
							$(element).attr('checked', value);
						} else if (element.is('select') || element.is('input') || element.is('textarea')) {
							$(element).val(value);
						} else {
							$(element).html(value);
						}

						//
						if (typeof context.callbacks.get === 'function') {
							context.callbacks.get(element, targetKey, value);
						} else if (typeof context.callbacks.main === 'function') {
							context.callbacks.main('get', element, targetKey, value);
						}
					}
				}
			}, delay);
		},

		// Считывание значения
		_readElementValue: function _readElementValue(element, oldValue) {
			var value = undefined,
			    elementValue = $(element).attr('value'),
			    customValue = $(element).attr(this.keys['event-value']);

			// input:checkbox
			if (element.is('input[type="checkbox"]') || element.is('input[type="radio"]')) {
				if (typeof oldValue !== 'boolean' && elementValue !== undefined) {
					value = $(element).is(':checked') ? elementValue : '';
				} else {
					value = $(element).is(':checked');
				}
			}
			// select
			else if (element.is('select')) {
					if (typeof oldValue === 'number') {
						value = $(element).find(':selected').index();
					} else {
						value = $(element).val();
					}
				}
				// input
				else if (element.is('input') || element.is('textarea')) {
						value = $(element).val();
					}
					// link
					else if (element.is('a')) {
							value = $(element).attr('href');
						}

			// Если не удалось считать значение
			if (value === '' || value === undefined) {
				value = elementValue || customValue || $(element).html();
			};

			return value;
		},

		// Уничтожение плагина
		destroy: function destroy() {
			this.unbind();
		}
	};

	// Прописываем плагин
	$.fn[pluginName] = function (params, callback) {
		var args = arguments;

		// Если параметры это объект
		if (params === undefined || (typeof params === 'undefined' ? 'undefined' : _typeof(params)) === 'object') {
			// Проходим по компонентам
			this.each(function () {
				var instance = isJQ ? $(this).data('_' + pluginName) : $(this)[0]['_' + pluginName];
				var id = (typeof params === 'undefined' ? 'undefined' : _typeof(params)) === 'object' && params.hasOwnProperty('exlusive') ? '' : Math.random().toString(36).substring(7);

				if (!instance || id !== '') {
					var plugin = new Plugin(this, params, callback);

					if (isJQ) {
						$(this).data('_' + pluginName, plugin);
					} else {
						$(this)[0]['_' + pluginName] = plugin;
					}
				}
			});

			return $(this);
		}
		// Если параметры это строка
		else if (typeof params === 'string' && params[0] !== '_' && params !== 'init') {
				var returns = undefined;

				//
				this.each(function () {
					var instance = isJQ ? $(this).data('_' + pluginName) : $(this)[0]['_' + pluginName];

					if (instance instanceof Plugin && typeof instance[params] === 'function') {
						returns = instance[params].apply(instance, Array.prototype.slice.call(args, 1));
					}
				});

				return returns !== undefined ? returns : $(this);
			}
	};
});