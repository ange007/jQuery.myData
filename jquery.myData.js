/**
 * jquery.mydata - Small JQuery&Zepto plugin for two-ways data binding.
 * @version v0.5.0
 * @link https://github.com/ange007/JQuery.myData
 * @license MIT
 * @author Borysenko Vladymyr
 */

"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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

  var Plugin = /*#__PURE__*/function () {
    function Plugin(element, targetOrOptions, callback, debug) {
      _classCallCheck(this, Plugin);

      //
      this.debug = debug;
      this.bindings = [];
      this.checkTimer = undefined;
      this.bindEventsObserver = undefined;
      this.bindElementsObserver = undefined; //

      this.element = $(element);
      this.callbacks = {};
      this.keys = {
        'event': 'data-on',
        'data': 'data-bind',
        'data-element': 'data-bind-element',
        'value': 'data-value',
        'default-value': 'data-default-value'
      }; // Event and Data target

      if (_typeof(targetOrOptions) === 'object' && targetOrOptions.hasOwnProperty('event') && targetOrOptions.hasOwnProperty('data')) {
        this.eventTarget = targetOrOptions.event;
        this.dataTarget = targetOrOptions.data; // Custom keys

        if (_typeof(targetOrOptions['data-keys']) === 'object') {
          this.keys = {
            'event': targetOrOptions['data-keys']['event'] || this.keys['event'],
            'value': targetOrOptions['data-keys']['value'] || this.keys['value'],
            'default-value': targetOrOptions['data-keys']['default-value'] || this.keys['default-value'],
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
    } // Add events


    _createClass(Plugin, [{
      key: "bind",
      value: function bind() {
        this._setBindEvents();

        this._setEventListeners();

        this._triggerBindElementEvents();

        this._setCheckTimer(250);
      } // Remove events

    }, {
      key: "unbind",
      value: function unbind() {
        // Disable event watcher
        this.element.off('.' + pluginName, '[' + this.keys['data'] + ']').off('.' + pluginName, '[' + this.keys['data-element'] + ']').off('.' + pluginName, '[' + this.keys['event'] + ']'); // Clear timer

        clearInterval(this.checkTimer); //

        this.bindEventsObserver.disconnect();
        this.bindElementsObserver.disconnect(); //

        this.bindings = [];
      } // Set events 

    }, {
      key: "_setEventListeners",
      value: function _setEventListeners() {
        var _this = this;

        var bindEvents = ['change', 'keyup', 'input', 'paste'].map(function (item) {
          return item += '.' + pluginName;
        });
        var onEvents = ['click', 'dblclick', 'change', 'input', 'paste', 'load', 'unload', 'select', 'resize', 'scroll', 'submit', 'error', 'keydown', 'keyup', 'keypress', 'mouseover', 'mousedown', 'mouseup',
        /*'mousemove',*/
        'mouseout', 'mouseenter', 'mouseleave', 'blur', 'focus', 'focusin', 'focusout'].map(function (item) {
          return item += '.' + pluginName;
        }); // Change state reaction
        // data-bind="key" 

        this.element.on(bindEvents.join(' '), '[' + this.keys['data'] + ']', function (event) {
          var element = $(event.currentTarget);
          var targetKey = element.attr(_this.keys['data']); //

          var value = undefined; // Change values

          for (var i in _this.bindings) {
            var item = _this.bindings[i];

            if (item.element !== event.currentTarget || item.property !== targetKey) {
              continue;
            } // Read value


            value = _this._readElementValue(element, item.value); // Generate function name

            var setFunctionName = 'set' + targetKey.charAt(0).toUpperCase() + targetKey.substr(1); // Only if value changed

            if (value !== item.value) {
              item.value = value; // Send value

              if (typeof _this.dataTarget[setFunctionName] === 'function') {
                _this.dataTarget[setFunctionName].apply(_this.dataTarget, [value]);
              } else if (typeof _this.dataTarget[targetKey] === 'function') {
                _this.dataTarget[targetKey].apply(_this.dataTarget, [value]);
              } else if (_this.dataTarget.hasOwnProperty(targetKey)) {
                _this.dataTarget[targetKey] = value;
              }

              break;
            }
          } //


          if (_this.debug) {
            console.info("jQuery.myData - Binding Data (element > object) (data-bind): Set \"".concat(value, "\" to \"(set)").concat(targetKey, "\", event: ").concat(event.type), element.get(0));
          } //


          if (typeof _this.callbacks.set === 'function') {
            _this.callbacks.set(element, targetKey, value, {
              type: event.type
            });
          } else if (typeof _this.callbacks.main === 'function') {
            _this.callbacks.main('set', element, targetKey, value, {
              type: event.type
            });
          }
        }); // Element connection
        // data-bind-element="enabled,text:#id"
        // data-bind-element="[enabled:#id,text:input[name=qqq]]"
        // data-bind-element="visible:.class"

        this.element.on(bindEvents.join(' ') + ' click', '[' + this.keys['data-element'] + ']', function (event) {
          var element = $(event.currentTarget);
          var actionData = element.attr(_this.keys['data-element']);

          _this._extractActions(element, actionData, function (action, selector) {
            var targetElement = element.find(selector).length ? element.find(selector) : $(selector); // Read value

            var value = _this._readElementValue(element, targetElement.val()); //


            if (_this.debug) {
              console.info("jQuery.myData - Element connection (data-bind-element): Set element \"".concat(selector, "\" value: \"").concat(value, "\", event: ").concat(event.type), element.get(0));
            } // Set value


            _this._setElementValue(targetElement, action, value);
          });
        }); // Action reaction
        // data-on="focusin,focusout:action"
        // data-on="[click:action1,change:action2]"
        // data-on="click:test( '!!!' )"

        this.element.on(onEvents.join(' '), '[' + this.keys['event'] + ']', function (event) {
          var element = $(event.currentTarget);
          var actionData = element.attr(_this.keys['event']);

          _this._extractActions(element, actionData, function (eventType, handlerName) {
            var handlerFunc = handlerName.match(/([a-zA-Z0-9,\.\-_\/]+)(?:\(([^)]+)\))?$/) || false; //

            if (eventType != event.type || !handlerFunc) {
              return;
            } //


            var name = handlerFunc[1];
            var args = typeof handlerFunc[2] === 'string' ? handlerFunc[2].split(',').map(function (item) {
              return item.trim().match(/^['"]{0,}(.*?)['"]{0,}$/)[1] || '';
            }) : [];
            var targetFuncExist = _this.eventTarget !== undefined && typeof _this.eventTarget[name] === 'function';
            var windowFuncExist = typeof window[name] === 'function'; // Read value

            var value = _this._readElementValue(element, undefined); //


            var callArgs = $.extend([], args);

            if (callArgs.length > 0) {
              callArgs.push({
                element: element,
                event: event,
                value: value
              });
            } else {
              callArgs = [value, {
                element: element,
                event: event,
                value: value
              }];
            } //


            var result = undefined; // Call function

            if (targetFuncExist) {
              result = _this.eventTarget[name].apply(_this.eventTarget, callArgs);
            } else {
              try {
                result = eval(name).apply(window, callArgs);
              } catch (err) {
                console.warn("jQuery.myData: Could not call - \"".concat(name, "\""));
              }
            } //


            if (_this.debug) {
              console.info("jQuery.myData - Action Reaction (data-on): Call function \"".concat(handlerName, "\", event: ").concat(event.type), element.get(0));
            } // Callback


            if (typeof _this.callbacks.on === 'function') {
              _this.callbacks.on(element, name, value, {
                type: event.type,
                args: args
              });
            } else if (typeof _this.callbacks.main === 'function') {
              _this.callbacks.main('on', element, name, value, {
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
        }); //

        if (this.debug) {
          console.info("jQuery.myData - Set Event Listeners", this.element);
        }
      } // Add new elements to [data-bind] list

    }, {
      key: "_setBindEvents",
      value: function _setBindEvents() {
        var _this2 = this;

        var setBinding = function setBinding(element) {
          var $element = $(element),
              propName = $element.attr(_this2.keys['data']) || '';

          if (propName === '') {
            return;
          } // Add element to list


          _this2.bindings.push({
            element: element,
            property: propName,
            value: undefined
          });
        }; // Create the list of checked parameters


        this.element.find('[' + this.keys['data'] + ']').each(function (index, item) {
          setBinding(item);
        }); // Wait new elements

        this.bindEventsObserver = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (item) {
              setBinding(item);
            });
          });
        }); //

        this.bindEventsObserver.observe(this.element[0], {
          childList: true
        });
      } // [data-bind-element] Triggered events for new elements

    }, {
      key: "_triggerBindElementEvents",
      value: function _triggerBindElementEvents() {
        var _this3 = this;

        var trigger = function trigger(element, firstInit) {
          var $element = $(element);
          var actionData = $element.attr(_this3.keys['data-element']) || '';

          if (actionData === '') {
            return;
          }

          _this3._extractActions($element, actionData, function (action, selector) {
            var targetElement = $(selector); // Read value

            var value = undefined;

            if (firstInit) {
              value = $(element).attr(_this3.keys['default-value']);
            }

            ;

            if (!value) {
              value = _this3._readElementValue($element, targetElement.val());
            } // Set value


            _this3._setElementValue(targetElement, action, value);
          });
        }; // Trigger leave elements


        this.element.find('[' + this.keys['data-element'] + ']').each(function (index, item) {
          trigger(item, true);
        }); // Wait new elements

        this.bindElementsObserver = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (item) {
              trigger(item, true);
            });
          });
        }); //

        this.bindElementsObserver.observe(this.element[0], {
          childList: true
        });
      } // Timer 
      // @todo: Replace to Object.defineProperty( get( ): { }, set( ): { } ) ?

    }, {
      key: "_setCheckTimer",
      value: function _setCheckTimer(delay) {
        var _this4 = this;

        // Clear timer
        clearInterval(this.checkTimer); //

        this.checkTimer = setInterval(function () {
          for (var i in _this4.bindings) {
            var item = _this4.bindings[i];
            var element = $(item.element);
            var targetKey = item.property;
            var oldValue = item.value;
            var value = ''; // Generate function name

            var getFunctionName = 'get' + targetKey.charAt(0).toUpperCase() + targetKey.substr(1); // Read value

            if (typeof _this4.dataTarget[getFunctionName] === 'function') {
              value = _this4.dataTarget[getFunctionName]();
            } else if (typeof _this4.dataTarget[targetKey] === 'function') {
              value = _this4.dataTarget[targetKey]();
            } else if (_this4.dataTarget.hasOwnProperty(targetKey)) {
              value = _this4.dataTarget[targetKey];
            } // Only if value changed


            if (value === oldValue) {
              continue;
            }

            item.value = value; // Set value to element

            if (element.is('input[type="checkbox"]') || element.is('input[type="radio"]')) {
              element.attr('checked', value);
            } else if (element.is('select') || element.is('input') || element.is('textarea')) {
              element.val(value);
            } else {
              element.html(value);
            } //


            if (_this4.debug) {
              console.info("jQuery.myData - Binding Data (object > element) (data-bind): Read \"".concat(value, "\" from \"(get)").concat(targetKey, "\""), element.get(0));
            } // Callback


            if (typeof _this4.callbacks.get === 'function') {
              _this4.callbacks.get(element, targetKey, value, {});
            } else if (typeof _this4.callbacks.main === 'function') {
              _this4.callbacks.main('get', element, targetKey, value, {});
            }
          }
        }, delay);
      } // Read value

    }, {
      key: "_readElementValue",
      value: function _readElementValue(element, oldValue) {
        var value = undefined;
        var elementValue = $(element).attr('value');
        var customValue = $(element).attr(this.keys['value']); // data-value

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
      } // Set value

    }, {
      key: "_setElementValue",
      value: function _setElementValue(element, event, value) {
        var isBooleanVal = this._valIsBoolean(value);

        var booleanVal = this._valToBoolean(value);

        var isInit = element.data('myData-init');
        var state;

        if (event === 'visible' || event === 'hidden') {
          var isDisplay = element.css('display') === '' || element.css('display') === 'block' || element.css('display') === 'none'; // set

          if (isBooleanVal) {
            state = event === 'visible' && booleanVal ? 'visible' : 'hidden';
          } // toggle
          else {
              state = event === 'visible' && element.is(':visible') ? 'hidden' : 'visible';
            } //


          if (isDisplay) {
            element.css('display', state === 'hidden' ? 'none' : 'block');
          } else {
            element.css('visibility', state);
          }
        } else if (event === 'enabled' || event === 'disabled') {
          // set
          if (isBooleanVal) {
            state = !booleanVal && event === 'enabled' || booleanVal && event === 'disabled';
          } // toggle
          else {
              state = element.is(':disabled');
            } //


          if (!state) {
            element.removeAttr('disabled');
          } else {
            element.attr('disabled', 'disabled');
          }
        } else if (event === 'slide') {
          // set
          if (isBooleanVal) {
            state = booleanVal;
          } // toggle
          else {
              state = !element.is(':visible');
            } //


          if (state) {
            element.slideDown(200);
          } else {
            element.slideUp(200);
          }
        } else {
          if (element.is('input') || element.is('textarea')) {
            element.val(value);
          } else {
            element.text(value);
          }
        } //


        element.data('myData-init', true);
      } // Extract actions from data
      // ="focusin,focusout:action" 
      // ="[click:action1,change:action2]"
      // ="click:test( '!!!' )"

    }, {
      key: "_extractActions",
      value: function _extractActions(element, actionData, callback) {
        var defaultEvent = 'click';

        if (element.is('form')) {
          defaultEvent = 'submit';
        } else if (element.is('input, select, textarea')) {
          defaultEvent = 'change';
        } //


        var actionList = []; //

        if (typeof actionData !== 'string') {
          // console.error( 'jQuery.myData: Empty data in [' + this.keys[ 'event' ] + '].' );
          return;
        } else {
          if (actionData.indexOf('[') === 0) {
            try {
              actionList = JSON.parse(actionData);
            } catch (_unused) {
              actionList = (actionData.match(/[\[\{}](.*?)[\}\]]/)[1] || '').split(',');
            }
          } else {
            actionList = actionData.split(',');
          }
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
      }
    }, {
      key: "_valIsBoolean",
      value: function _valIsBoolean(value) {
        return typeof value === 'boolean' && value || typeof value === 'string' && ['yes', 'true', 'y', 'no', 'false', 'n'].indexOf(value) !== -1 || typeof value === 'integer' && [0, 1].indexOf(value) !== -1;
      }
    }, {
      key: "_valToBoolean",
      value: function _valToBoolean(value) {
        return typeof value === 'boolean' && value || typeof value === 'string' && ['yes', 'true', 'y'].indexOf(value) !== -1 || typeof value === 'integer' && value === 1;
      } // Destroy

    }, {
      key: "destroy",
      value: function destroy() {
        this.unbind();
      }
    }]);

    return Plugin;
  }();

  ; // Plugin init

  $.fn[pluginName] = function (params, callback) {
    var instance = isJQ ? $(this).data('_' + pluginName) : $(this)[0]['_' + pluginName]; // Object

    if (params === undefined || _typeof(params) === 'object') {
      var id = Math.random().toString(36).substring(7);
      var debug = false;

      if (_typeof(params) === 'object') {
        if (params.exclusive) {
          id = '';
          delete params.exclusive;
        }

        if (params.debug) {
          debug = true;
          delete params.debug;
        }
      }

      if (!instance || id !== '') {
        var plugin = new Plugin(this, params, callback, debug);

        if (isJQ) {
          $(this).data('_' + pluginName, plugin);
        } else {
          $(this)[0]['_' + pluginName] = plugin;
        }
      }

      return $(this);
    } // String
    else if (typeof params === 'string' && params[0] !== '_' && params !== 'init') {
        var args = arguments;
        var returns = undefined;

        if (instance instanceof Plugin && typeof instance[params] === 'function') {
          returns = instance[params].apply(instance, Array.prototype.slice.call(args, 1));
        }

        return returns !== undefined ? returns : $(this);
      }
  };
});