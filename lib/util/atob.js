exports.atob = function(input) {
  return new Buffer(input, 'base64').toString('binary');
};