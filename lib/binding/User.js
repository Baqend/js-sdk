"use strict";

var Entity = require('./Entity');

/**
 * @class baqend.binding.User
 * @extends baqend.binding.Entity
 */
class User extends Entity {

  /**
   * Indicates if the given object is an user instance
   * @param {*} obj The instance to check
   * @return {boolean} <code>true</code> if the object is an user
   */
  static isUser(obj) {
    return obj instanceof Object && "_metadata" in obj && "id" in obj && "username" in obj;
  }

  /**
   * Change the password of the given user
   *
   * @param {String} password Current password of the user
   * @param {String} newPassword New password of the user
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   */
  newPassword(password, newPassword, doneCallback, failCallback) {
    return this._metadata.db.newPassword(this.username, password, newPassword).then(doneCallback, failCallback);
  }

  /**
   * The name of the user
   * @type String
   * @name username
   */
}

module.exports = User;


