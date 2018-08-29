'use strict';

/* eslint-disable no-console */
module.exports = (obj, signature, alternative) => {
  const cls = obj.constructor.name;
  Object.defineProperty(obj, signature, {
    get() {
      console.log('Usage of ' + cls + '.' + signature + ' is deprecated, use ' + cls + '.' + alternative + ' instead.');
      return this[alternative];
    },
    set(val) {
      console.log('Usage of ' + cls + '.' + signature + ' is deprecated, use ' + cls + '.' + alternative + ' instead.');
      this[alternative] = val;
    },
    enumerable: false,
  });
};
