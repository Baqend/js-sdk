'use strict';

exports.atob = function atob(input) {
  return Buffer.from(input, 'base64').toString('binary');
};
