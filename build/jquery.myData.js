/**
 * jquery.mydata - Small JQuery&Zepto plugin for two-ways data binding.
 * @version v0.4.3
 * @link https://github.com/ange007/JQuery.myData
 * @license MIT
 * @author Borisenko Vladimir
 */

"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

;

(function (factory) {
  // AMD
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } // CommonJS
  else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object') {
      module.exports = factory(window.Zepto || window.jQuery || window.$ || require('jquery'), window, document);
    } // 
    else {
        factory(window.Zepto || window.jQuery || window.$, window, document);
      }
})(function ($, window, document) {
  'use strict'; //

  var pluginName = 'myData';
  var isJQ = !!window.jQuery; // Plugin

  var Plugin = function Plugin(element, targetOrOptions, callback) {
    //
    this.bindings = [];
    this.checkTimer = undefined; //

    this.element = $(element);
    this.callbacks = {};
    this.keys = {
      'event': 'data-on',
      'event-value': 'data-on-value',
      'data': 'data-bind',
      'data-element': 'data-bind-element'
    }; // Event and Data target

    if (_typeof(targetOrOptions) === 'object' && targetOrOptions.hasOwnProperty('event') && targetOrOptions.hasOwnProperty('data')) {
      this.eventTarget = targetOrOptions.event;
      this.dataTarget = targetOrOptions.data; // Custom keys

      if (_typeof(targetOrOptions['data-keys']) === 'object') {
        this.keys = {
          'event': targetOrOptions['data-keys']['event'] || this.keys['event'],
          'event-value': targetOrOptions['data-keys']['event-value'] || this.keys['event-value'],
          'data': targetOrOptions['data-keys']['data'] || this.keys['data'],
          'data-element': targetOrOptions['data-keys']['data-element'] || this.keys['data-element']
        };
      }
    } else {
      this.eventTarget = targetOrOptions;
      this.dataTarget = targetOrOptions;
    } // Callback`s


    if (typeof callback === 'function') {
      this.callbacks.main = callback;
    } else if (_typeof(callback) === 'object') {
      this.callbacks.main = callback.main;
      this.callbacks.get = callback.get;
      this.callbacks.set = callback.set;
      this.callbacks.on = callback.on;
    } // Init


    this.bind();
  };

  Plugin.prototype = {
    // Add events
    bind: function bind() {
      var context = this; // Формируем список проверяемых параметров
      // @todo: Будет не верно работать в случае с динамически изменяемым содержимим элемента 
      //		(так как считывание происходит только один раз)

      this.element.find('[' + this.keys['data'] + ']').each(function (index, item) {
        var element = $(item),
            propName = element.attr(context.keys['data']) || '';

        if (propName === '') {
          return;
        } // Add element to list


        context.bindings.push({
          element: item,
          property: propName,
          value: undefined
        });
      });

      this._setEventListeners();

      this._setCheckTimer();
    },
    // Remove events
    unbind: function unbind() {
      // Disable event watcher
      this.element.off('.' + pluginName, '[' + this.keys['data'] + ']').off('.' + pluginName, '[' + this.keys['data-element'] + ']').off('.' + pluginName, '[' + this.keys['event'] + ']'); // Clear timer

      clearInterval(this.checkTimer); //

      this.bindings = [];
    },
    // Set events 
    _setEventListeners: function _setEventListeners() {
      var context = this;
      var bindEvents = ['change', 'keyup', 'input', 'paste'].map(function (item) {
        return item += '.' + pluginName;
      });
      var onEvents = ['click', 'dblclick', 'change', 'input', 'paste', 'load', 'unload', 'select', 'resize', 'scroll', 'submit', 'error', 'keydown', 'keyup', 'keypress', 'mouseover', 'mousedown', 'mouseup', 'mousemove', 'mouseout', 'mouseenter', 'mouseleave', 'blur', 'focus', 'focusin', 'focusout'].map(function (item) {
        return item += '.' + pluginName;
      }); // Change state reaction
      // data-bind="key" 

      this.element.on(bindEvents.join(' '), '[' + this.keys['data'] + ']', function (event) {
        var element = $(event.target);
        var targetKey = element.attr(context.keys['data']); //

        var value = undefined; // Change values

        for (var i in context.bindings) {
          var item = context.bindings[i];

          if (item.element !== event.target || item.property !== targetKey) {
            continue;
          } // Read value


          value = context._readElementValue(element, item.value); // Generate function name

          var setFunctionName = 'set' + targetKey.charAt(0).toUpperCase() + targetKey.substr(1); // Only if value changed

          if (value !== item.value) {
            item.value = value; // Send value

            if (typeof context.dataTarget[setFunctionName] === 'function') {
              context.dataTarget[setFunctionName].apply(context.dataTarget, [value]);
            } else if (typeof context.dataTarget[targetKey] === 'function') {
              context.dataTarget[targetKey].apply(context.dataTarget, [value]);
            } else if (context.dataTarget.hasOwnProperty(targetKey)) {
              context.dataTarget[targetKey] = value;
            }

            break;
          }
        } //


        if (typeof context.callbacks.set === 'function') {
          context.callbacks.set(element, targetKey, value, {
            type: event.type
          });
        } else if (typeof context.callbacks.main === 'function') {
          context.callbacks.main('set', element, targetKey, value, {
            type: event.type
          });
        }
      }); // Element connection
      // data-bind-element="enabled,text:#id"
      // data-bind-element="[enabled:#id,text:input[name=qqq]]"
      // data-bind-element="visible:.class"

      this.element.on(bindEvents.join(' '), '[' + this.keys['data-element'] + ']', function (event) {
        var element = $(event.target);
        var actionData = element.attr(context.keys['data-element']);

        context._extractActions(element, event, actionData, function (action, selector) {
          var targetElement = $(selector); // Read value

          var value = context._readElementValue(element, targetElement.val()); // Set value


          context._setElementValue(targetElement, action, value);
        });
      }); // Action reaction
      // data-on="focusin,focusout:action"
      // data-on="[click:action1,change:action2]"
      // data-on="click:test( '!!!' )"

      this.element.on(onEvents.join(' '), '[' + this.keys['event'] + ']', function (event) {
        var element = $(this);
        var actionData = element.attr(context.keys['event']);

        context._extractActions(element, event, actionData, function (eventType, handlerName) {
          var handlerFunc = handlerName.match(/([a-zA-Z0-9,\.\-_\/]+)(?:\(([^)]+)\))?$/) || false; //

          if (eventType != event.type || !handlerFunc) {
            return;
          } //


          var name = handlerFunc[1];
          var args = typeof handlerFunc[2] === 'string' ? handlerFunc[2].split(',').map(function (item) {
            return item.trim().match(/^['"]{0,}(.*?)['"]{0,}$/)[1] || '';
          }) : [];
          var targetFuncExist = context.eventTarget !== undefined && typeof context.eventTarget[name] === 'function';
          var windowFuncExist = typeof window[name] === 'function'; // Read value

          var value = context._readElementValue(element, undefined); //


          var callArgs = $.extend([], args);

          if (callArgs.length > 0) {
            callArgs.push([element, event, value]);
          } else {
            callArgs = [value, [element, event, value]];
          } //


          var result = undefined; // Call function

          if (targetFuncExist) {
            result = context.eventTarget[name].apply(context.eventTarget, callArgs);
          } else {
            try {
              result = eval(name).apply(window, callArgs);
            } catch (err) {
              console.warn('jQuery.myData: Could not call - "' + name + '"');
            }
          } // Callback


          if (typeof context.callbacks.on === 'function') {
            context.callbacks.on(element, name, value, {
              type: event.type,
              args: args
            });
          } else if (typeof context.callbacks.main === 'function') {
            context.callbacks.main('on', element, name, value, {
              type: event.type,
              args: args
            });
          } //


          if (result === false) {
            event.stopPropagation();
            return false;
          } //
          else if (result === true) {
              event.preventDefault();
              return result;
            }
        });
      });
    },
    // Timer 
    _setCheckTimer: function _setCheckTimer() {
      var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 250;
      var context = this;
      this.checkTimer = setInterval(function () {
        for (var i in context.bindings) {
          var item = context.bindings[i];
          var element = $(item.element);
          var targetKey = item.property;
          var oldValue = item.value;
          var value = ''; // Generate function name

          var getFunctionName = 'get' + targetKey.charAt(0).toUpperCase() + targetKey.substr(1); // Read value

          if (typeof context.dataTarget[getFunctionName] === 'function') {
            value = context.dataTarget[getFunctionName]();
          } else if (typeof context.dataTarget[targetKey] === 'function') {
            value = context.dataTarget[targetKey]();
          } else if (context.dataTarget.hasOwnProperty(targetKey)) {
            value = context.dataTarget[targetKey];
          } // Only if value changed


          if (value === oldValue) {
            continue;
          }

          item.value = value; // Set value to element

          if (element.is('input[type="checkbox"]') || element.is('input[type="radio"]')) {
            $(element).attr('checked', value);
          } else if (element.is('select') || element.is('input') || element.is('textarea')) {
            $(element).val(value);
          } else {
            $(element).html(value);
          } // Callback


          if (typeof context.callbacks.get === 'function') {
            context.callbacks.get(element, targetKey, value, {});
          } else if (typeof context.callbacks.main === 'function') {
            context.callbacks.main('get', element, targetKey, value, {});
          }
        }
      }, delay);
    },
    // Read value
    _readElementValue: function _readElementValue(element, oldValue) {
      var value = undefined;
      var elementValue = $(element).attr('value');
      var customValue = $(element).attr(this.keys['event-value']); // data-on-value

      if (customValue !== undefined && customValue !== '') {
        value = customValue;
      } // input:checkbox
      else if (element.is('input[type="checkbox"]') || element.is('input[type="radio"]')) {
          if (typeof oldValue !== 'boolean' && elementValue !== undefined) {
            value = $(element).is(':checked') ? elementValue : false;
          } else {
            value = $(element).is(':checked');
          }
        } // select
        else if (element.is('select')) {
            if (typeof oldValue === 'number') {
              value = $(element).find(':selected').index();
            } else {
              value = $(element).val();
            }
          } // input
          else if (element.is('input') || element.is('textarea')) {
              value = $(element).val();
            } // link
            else if (element.is('a')) {
                value = $(element).attr('href');
              } // form
              else if (element.is('form')) {
                  value = {};
                  $(element[0]).serializeArray().forEach(function (x) {
                    value[x.name] = x.value;
                  });
                } // If unable to read the value


      if (value === '' || value === undefined) {
        value = elementValue || $(element).html();
      }

      return value;
    },
    // Set value
    _setElementValue: function _setElementValue(element, event, value) {
      if (event === 'visible' || event === 'hidden') {
        var state = event === 'visible' ? 'hidden' : 'visible';

        if (typeof value === 'boolean' && value || typeof value === 'string' && (value === 'yes' || value === 'y' || value === 'true') || typeof value === 'integer' && value >= 1) {
          state = event;
        }

        element.css('visibility', state);
      } else if (event === 'enabled' || event === 'disabled') {
        if (typeof value === 'boolean' && value === true || typeof value === 'string' && (value === 'yes' || value === 'y') || typeof value === 'integer' && value >= 1) {
          if (event === 'enabled') {
            element.removeAttr('disabled');
          } else {
            element.attr('disabled', 'disabled');
          }
        } else {
          if (event === 'disabled') {
            element.removeAttr('disabled');
          } else {
            element.attr('disabled', 'disabled');
          }
        }
      } else {
        if (element.is('input') || element.is('textarea')) {
          element.val(value);
        } else {
          element.text(value);
        }
      }
    },
    //
    // ="focusin,focusout:action" 
    // ="[click:action1,change:action2]"
    // ="click:test( '!!!' )"
    _extractActions: function _extractActions(element, event, actionData, callback) {
      var defaultEvent = 'click';

      if (element.is('form')) {
        defaultEvent = 'submit';
      } else if (element.is('input, select, textarea')) {
        defaultEvent = 'change';
      } //


      var actionList = []; //

      if (typeof actionData !== 'string') {
        console.error('jQuery.myData: Empty data in [' + context.keys['event'] + '].');
        return;
      } else {
        actionList = actionData.indexOf('[') === 0 ? (actionData.match(/[\[\{}](.*?)[\}\]]/)[1] || '').split(',') : [actionData];
      } //


      actionList.forEach(function (listItem, i, arr) {
        var onData = listItem.indexOf(':') >= 0 ? listItem.split(':') : [defaultEvent, listItem];
        var actions = onData[0].trim().split(',');
        var value = onData[1].trim(); // 

        if (!value) {
          return;
        } //


        actions.forEach(function (action, i, arr) {
          callback(action, value);
        });
      });
    },
    // Destroy
    destroy: function destroy() {
      this.unbind();
    }
  }; // Plugin init

  $.fn[pluginName] = function (params, callback) {
    var args = arguments; // Object

    if (params === undefined || _typeof(params) === 'object') {
      this.each(function () {
        var instance = isJQ ? $(this).data('_' + pluginName) : $(this)[0]['_' + pluginName];
        var id = _typeof(params) === 'object' && params.hasOwnProperty('exlusive') ? '' : Math.random().toString(36).substring(7);

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
    } // String
    else if (typeof params === 'string' && params[0] !== '_' && params !== 'init') {
        var returns = undefined;
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