'use strict';

// This implementation is based on https://github.com/mathiasbynens/base64/blob/master/src/base64.js
const TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

exports.atob = function atob(input) {
  const str = input.length % 4 === 0 ? input.replace(/==?$/, '') : input;
  const length = str.length;

  let bitCounter = 0;
  let bitStorage;
  let output = '';
  for (let position = 0; position < length; position += 1) {
    const buffer = TABLE.indexOf(str.charAt(position));
    const isModFour = bitCounter % 4;
    bitStorage = isModFour ? (bitStorage * 64) + buffer : buffer;
    bitCounter += 1;

    // Unless this is the first of a group of 4 characters…
    if (!isModFour) {
      // …convert the first 8 bits to a single ASCII character.
      // eslint-disable-next-line no-bitwise
      output += String.fromCharCode(0xFF & (bitStorage >> ((-2 * bitCounter) & 6)));
    }
  }

  return output;
};
