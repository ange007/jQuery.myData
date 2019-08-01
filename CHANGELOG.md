# CHANGELOG
## v0.4.3: 
* Update and Fix gulpfile.js and gulp modules.
* Changed logic for disabled state value in ```input[type=checkbox|radio]``` (and fix ```data-bind-element``` disabled action).
## v0.4.2:
* Fix get values from ```form:submit``` event.
## v0.4.1:
* Set default event target for ```[ input, select, textarea ]``` - ```change``` and for other ```click```.
## v0.4.0:
* Add ```data-bind-element``` for change data in target element.
## v0.3.0:
* Add ```data``` argument to callbacks. Now he contains ```args``` and ```type``` for ```on``` event.
* Change arguments for ```on``` function callback: ```value|args, data = { target, event, value }```.
## v0.2.1:
* Read link ```href``` from ```data-on``` action.
## v0.2.0:
* Add ```data-keys``` options for uses custom data keys.
## v0.1.2:
* Add ```exlusive``` options.
* Add ```event``` and ```data``` options for separate event and data.
## v0.1.0:
* First build.