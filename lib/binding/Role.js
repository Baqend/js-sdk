var Entity = require('./Entity');
var User = require('./User');
var Set = require('../collection').Set;

/**
 * @class baqend.binding.Role
 * @extends baqend.binding.Entity
 */
var Role = module.exports = Entity.inherit(/** @lends baqend.binding.Role.prototype */ {

  /**
   * A set of users which have this role
   * @type baqend.Set
   */
  users: null,

  /**
   * The name of the role
   * @type String
   */
  name: null,

  /**
   * Test if the given user has this role
   * @return {Boolean} <code>true</code> if the given user has this role,
   * otherwise <code>false</code>
   */
  hasUser: function(user) {
    return this.users && this.users.has(user);
  },

  /**
   * Add the given user to this role
   * @param {baqend.binding.User} user The user to add
   */
  addUser: function(user) {
    if (User.isInstance(user)) {
      if (!this.users)
        this.users = new Set();

      this.users.add(user);
    } else {
      throw new Error('Only user instances can be added to a role.');
    }
  },

  /**
   * Remove the given user from this role
   * @param {baqend.binding.User} user The user to remove
   */
  removeUser: function(user) {
    if (User.isInstance(user)) {
      if (this.users)
        this.users.remove(user);
    } else {
      throw new Error('Only user instances can be removed from a role.');
    }
  }

});


