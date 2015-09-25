"use strict";

var User = require('./User');
var Entity = require('./Entity');

/**
 * @class baqend.binding.Role
 * @extends baqend.binding.Entity
 */
class Role extends Entity {

  /**
   * Test if the given user has this role
   * @return {Boolean} <code>true</code> if the given user has this role,
   * otherwise <code>false</code>
   */
  hasUser(user) {
    return this.users && this.users.has(user);
  }

  /**
   * Add the given user to this role
   * @param {baqend.binding.User} user The user to add
   */
  addUser(user) {
    if (user instanceof User) {
      if (!this.users)
        this.users = new Set();

      this.users.add(user);
    } else {
      throw new Error('Only user instances can be added to a role.');
    }
  }

  /**
   * Remove the given user from this role
   * @param {baqend.binding.User} user The user to remove
   */
  removeUser(user) {
    if (User.isUser(user)) {
      if (this.users)
        this.users.delete(user);
    } else {
      throw new Error('Only user instances can be removed from a role.');
    }
  }

  /**
   * A set of users which have this role
   * @type Set<User>
   * @name users
   */

  /**
   * The name of the role
   * @type String
   * @name name
   */
}

module.exports = Role;


