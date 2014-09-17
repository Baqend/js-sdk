var Entity = require('./Entity').Entity;

var User;

/**
 * @mixin jspa.binding.User
 * @mixes jspa.binding.Entity
 */
exports.User = User = Entity.inherit(/** @lends jspa.binding.User.prototype */ {

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


