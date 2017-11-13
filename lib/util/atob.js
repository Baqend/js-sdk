'use strict';

exports.atob = function atob(input) {
  return new Buffer(input, 'base64').toString('binary');
};
