'use strict';

/**
 * Adds a trailing slash to a string if it is missing
 * @param {string} str
 * @return {string}
 * @name trailingSlashIt
 * @memberOf binding.prototype
 * @function
 */
function trailingSlashIt(str) {
  if (str.charAt(str.length - 1) !== '/') {
    return str + '/';
  }

  return str;
}

exports.trailingSlashIt = trailingSlashIt;
