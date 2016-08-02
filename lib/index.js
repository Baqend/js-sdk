require('core-js/modules/es6.set');
require('core-js/modules/es6.map');

if (!Object.assign) {
  require('core-js/modules/es6.object.assign');
}

if (!Object.setPrototypeOf) {
  require('core-js/modules/es6.object.set-prototype-of');
}

if (typeof Promise === "undefined") {
  require('core-js/modules/es6.promise');
}

if (!Array.from) {
  require('core-js/modules/es6.array.from');
  require('core-js/modules/es6.array.iterator');
}

if (typeof Symbol === "undefined") {
  require('core-js/modules/es6.symbol');
}

module.exports = require('./baqend');