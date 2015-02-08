/**
 * @class baqend.util.ValidationResult
 */
var ValidationResult = module.exports = Object.inherit(/** @lends baqend.util.ValidationResult.prototype */ {

  fields: null,

  get isValid() {
    for (var key in this.fields) {
      if(!this.fields[key].isValid) {
        return false;
      }
    }
    return true;
  },

  initialize: function() {
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