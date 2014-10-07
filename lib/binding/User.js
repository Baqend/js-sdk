var Entity = require('./Entity').Entity;

var User;

/**
 * @mixin baqend.binding.User
 * @mixes baqend.binding.Entity
 */
exports.User = User = Entity.inherit(/** @lends baqend.binding.User.prototype */ {

  /**
   * The name of the user
   * @type String
   */
  username: null,

  /**
   * The email of the user
   * @type String
   */
  email: null

});


