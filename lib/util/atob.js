/**
 * Converts Base64-encoded data to string.
 *
 * @function
 * @memberOf util.prototype
 * @param {string} input Base64-encoded data.
 * @return {string} Binary-encoded data string.
 */
function atob(input) {
  return new Buffer(input, 'base64').toString('binary');
}

exports.atob = atob;
