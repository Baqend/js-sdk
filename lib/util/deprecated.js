'use strict';

module.exports = (obj, signature, alternative) => {
  const cls = obj.constructor.name;
  Object.defineProperty(obj, signature, {
    get() {
      console.log('Usage of ' + cls + '.' + signature + ' is deprecated, use ' + cls + '.' + alternative + ' instead.');
      return obj[alternative];
    },
    set(val) {
      console.log('Usage of ' + cls + '.' + signature + ' is deprecated, use ' + cls + '.' + alternative + ' instead.');
      obj[alternative] = val;
    },
    enumerable: true,
  });
};
