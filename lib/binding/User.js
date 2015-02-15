var Entity = require('./Entity');

/**
 * @class baqend.binding.User
 * @extends baqend.binding.Entity
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


