var Entity = require('./Entity');

/**
 * @mixin baqend.binding.User
 * @mixes baqend.binding.Entity
 */
var User = module.exports = Entity.inherit(/** @lends baqend.binding.User.prototype */ {

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


