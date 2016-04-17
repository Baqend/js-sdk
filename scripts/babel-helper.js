var through = require('through2');

module.exports = function(b, opts) {
  //list of helpers babel-core\lib\transformation\file\index.js
  var helper = require("babel-core").buildExternalHelpers([
    'inherits',
    'createClass',
    'defaults',
    'classCallCheck',
    'possibleConstructorReturn',
    'typeof'
  ], 'var');

  //make babel helpers ie < 11 ready
  helper = helper.replace('subClass\.__proto__ = superClass', 'babelHelpers.defaults(subClass, superClass)');

  var first = true;
  b.pipeline.get('pack').push(through.obj(
      function (row, enc, next) {
        if (first) {
          var line = 'return ';
          this.push(row.slice(0, row.length - line.length));
          this.push(helper);
          this.push(line);
          first = false;
        } else {
          this.push(row)
        }
        next()
      }));
};