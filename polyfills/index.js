/* eslint-disable global-require */

'use strict';

require('core-js/modules/es6.set');
require('core-js/modules/es6.map');

if (!Object.assign) {
  require('core-js/modules/es6.object.assign');
}

if (!Object.setPrototypeOf) {
  require('core-js/modules/es6.object.set-prototype-of');
}

if (typeof Promise === 'undefined') {
  require('core-js/modules/es6.promise');
}

if (!Array.from) {
  require('core-js/modules/es6.array.from');
  require('core-js/modules/es6.array.iterator');
}

if (!Number.isNaN) {
  require('core-js/modules/es6.number.is-nan.js');
}

if (!Number.isFinite) {
  require('core-js/modules/es6.number.is-finite.js');
}

if (typeof Symbol === 'undefined') {
  require('core-js/modules/es6.symbol');
}
