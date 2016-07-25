"use strict";

var Entity = require('./Entity');
var User = require('./User');

/**
 * @alias binding.RoleEntity
 * @extends binding.Entity
 */
class RoleEntity extends Entity {
  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   */
  constructor(properties) {
    super(properties);
  }

}

Object.defineProperties(RoleEntity.prototype, /** @lends binding.RoleEntity.prototype */ {
  /**
   * Test if the given user has this role
   * @return {boolean} <code>true</code> if the given user has this role,
   * otherwise <code>false</code>
   * @method
   */
  hasUser: {
    value: function hasUser(user) {
      return this.users && this.users.has(user);
    }
  },

  /**
   * Add the given user to this role
   * @param {model.User} user The user to add
   * @method
   */
  addUser: {
    value: function addUser(user) {
      if (user instanceof User) {
        if (!this.users)
          this.users = new Set();

        this.users.add(user);
      } else {
        throw new Error('Only user instances can be added to a role.');
      }
    }
  },

  /**
   * Remove the given user from this role
   * @param {model.User} user The user to remove
   * @method
   */
  removeUser: {
    value: function removeUser(user) {
      if (user instanceof User) {
        if (this.users)
          this.users.delete(user);
      } else {
        throw new Error('Only user instances can be removed from a role.');
      }
    }
  }

  /**
   * A set of users which have this role
   * @type Set<model.User>
   * @name users
   * @memberOf binding.RoleEntity.prototype
   */

  /**
   * The name of the role
   * @type string
   * @name name
   * @memberOf binding.RoleEntity.prototype
   */
});

module.exports = RoleEntity;


