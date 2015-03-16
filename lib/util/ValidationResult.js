/**
 * @class baqend.util.ValidationResult
 */
var ValidationResult = Object.inherit(/** @lends baqend.util.ValidationResult.prototype */ {

  fields: null,

  get isValid() {
    for (var key in this.fields) {
      if(!this.fields[key].isValid) {
        return false;
      }
    }
    return true;
  },

  constructor: function ValidationResult() {
    this.fields = {};
  },

  toJSON: function() {
    var json = {};
    for(var key in this.fields) {
      json[key] = this.fields[key].toJSON();
    }
    return json;
  }
});

module.exports = ValidationResult;