'use strict';

const Entity = require('./Entity');

/**
 * @alias binding.User
 * @extends binding.Entity
 */
class User extends Entity {
  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   * @constructor
   */
}

Object.defineProperties(User.prototype, /** @lends binding.User.prototype */ {

  /**
   * Change the password of the given user
   *
   * @param {string} currentPassword Current password of the user
   * @param {string} password New password of the user
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   * @method
   */
  newPassword: {
    value: function newPassword(currentPassword, password, doneCallback, failCallback) {
      return this._metadata.db.newPassword(this.username, currentPassword, password).then(doneCallback, failCallback);
    },
  },

  /**
   * Change the username of the current user
   *
   * @param {string} newUsername New username for the current user
   * @param {string} password The password of the current user
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   * @method
   */
  changeUsername: {
    value: function changeUsername(newUsername, password, doneCallback, failCallback) {
      return this._metadata.db.changeUsername(this.username, newUsername, password).then(doneCallback, failCallback);
    },
  },

  /**
   * Requests a perpetual token for the user
   *
   * Only users with the admin role are allowed to request an API token.
   *
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   * @method
   */
  requestAPIToken: {
    value: function requestAPIToken(doneCallback, failCallback) {
      return this._metadata.db.requestAPIToken(this.constructor, this).then(doneCallback, failCallback);
    },
  },
});

/**
 * The users username or email address
 * @type string
 * @name username
 * @memberOf binding.User.prototype
 */

/**
 * Indicates if the user is currently inactive, which disallow user login
 * @type boolean
 * @name inactive
 * @memberOf binding.User.prototype
 */

module.exports = User;
