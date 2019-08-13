# CHANGELOG
## v0.4.5: 
* Triggered ```data-bind-element``` events on start (need for actualizing event state).
* Added ```MutationObserver``` for wait dynamic created elements and triggered ```data-bind-element``` events.
* Update demo.
## v0.4.4: 
* Update and Fix ```gulpfile.js```.
* Update README.md.
* Added ```MutationObserver``` for wait dynamic created elements and add to ```data-on``` watching list.
## v0.4.3: 
* Update and Fix ```gulpfile.js``` and gulp modules.
* Changed logic for disabled state value in ```input[type=checkbox|radio]``` (and fix ```data-bind-element``` disabled action).
## v0.4.2:
* Fix get values from ```form:submit``` event.
## v0.4.1:
* Set default event target for ```[ input, select, textarea ]``` - ```change``` and for other ```click```.
## v0.4.0:
* Added ```data-bind-element``` for change data in target element.
## v0.3.0:
* Added ```data``` argument to callbacks. Now he contains ```args``` and ```type``` for ```on``` event.
* Change arguments for ```on``` function callback: ```value|args, data = { target, event, value }```.
## v0.2.1:
* Read link ```href``` from ```data-on``` action.
## v0.2.0:
* Added ```data-keys``` options for uses custom data keys.
## v0.1.2:
* Added ```exlusive``` options.
* Added ```event``` and ```data``` options for separate event and data.
## v0.1.0:
* First build.