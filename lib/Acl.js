"use strict";

var Permission = require('./util/Permission');

/**
 * Creates a new Acl object, with an empty rule set for an object
 *
 * @alias Acl
 */
class Acl {

  /**
   * @param {util.Metadata=} metadata the metadata of the object, null for files
   */
  constructor(metadata) {
    /**
     * The read permission of the object
     * @type util.Permission
     */
    this.read = new Permission(metadata);
    /**
     * The write permission of the object
     * @type util.Permission
     */
    this.write = new Permission(metadata);
  }

  /**
   * Removes all acl rules, read and write access is public afterwards
   */
  clear() {
    this.read.clear();
    this.write.clear();
  }

  /**
   * Gets whenever all users and roles have the permission to read the object
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicReadAllowed() {
    return this.read.isPublicAllowed();
  }

  /**
   * Sets whenever all users and roles should have the permission to read the object.
   * Note: All other allow read rules will be removed.
   */
  setPublicReadAllowed() {
    return this.read.setPublicAllowed();
  }

  /**
   * Checks whenever the user or role is explicit allowed to read the object.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if read access is explicitly allowed for the given user or role
   */
  isReadAllowed(userOrRole) {
    return this.read.isAllowed(userOrRole);
  }

  /**
   * Checks whenever the user or role is explicit denied to read the object
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if read access is explicitly denied for the given user or role
   */
  isReadDenied(userOrRole) {
    return this.read.isDenied(userOrRole);
  }

  /**
   * Allows the given user or rule to read the object
   * @param {model.User|model.Role|string} userOrRole The user or role to allow
   * @return {Acl} this acl object
   */
  allowReadAccess(userOrRole) {
    this.read.allowAccess(userOrRole);
    return this;
  }

  /**
   * Denies the given user or rule to read the object
   * @param {model.User|model.Role|string} userOrRole The user or role to deny
   * @return {Acl} this acl object
   */
  denyReadAccess(userOrRole) {
    this.read.denyAccess(userOrRole);
    return this;
  }

  /**
   * Deletes any read allow/deny rule for the given user or role
   * @param {model.User|model.Role|string} userOrRole The user or role
   * @return {Acl} this acl object
   */
  deleteReadAccess(userOrRole) {
    this.read.deleteAccess(userOrRole);
    return this;
  }

  /**
   * Gets whenever all users and roles have the permission to write the object
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicWriteAllowed() {
    return this.write.isPublicAllowed();
  }

  /**
   * Sets whenever all users and roles should have the permission to write the object.
   * Note: All other allow write rules will be removed.
   */
  setPublicWriteAllowed() {
    return this.write.setPublicAllowed();
  }

  /**
   * Checks whenever the user or role is explicit allowed to write the object.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if write access is explicitly allowed for the given user or role
   */
  isWriteAllowed(userOrRole) {
    return this.write.isAllowed(userOrRole);
  }

  /**
   * Checks whenever the user or role is explicit denied to write the object
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if write access is explicitly denied for the given user or role
   */
  isWriteDenied(userOrRole) {
    return this.write.isDenied(userOrRole);
  }

  /**
   * Allows the given user or rule to write the object
   * @param {model.User|model.Role|string} userOrRole The user or role to allow
   * @return {Acl} this acl object
   */
  allowWriteAccess(userOrRole) {
    this.write.allowAccess(userOrRole);
    return this;
  }

  /**
   * Denies the given user or rule to write the object
   * @param {model.User|model.Role|string} userOrRole The user or role to deny
   * @return {Acl} this acl object
   */
  denyWriteAccess(userOrRole) {
    this.write.denyAccess(userOrRole);
    return this;
  }

  /**
   * Deletes any write allow/deny rule for the given user or role
   * @param {model.User|model.Role|string} userOrRole The user or role
   * @return {Acl} this acl object
   */
  deleteWriteAccess(userOrRole) {
    this.write.deleteAccess(userOrRole);
    return this;
  }

  /**
   * A Json representation of the set of rules
   * @return {json}
   */
  toJSON() {
    return {
      read: this.read,
      write: this.write
    };
  }

  /**
   * Sets the acl rules form json
   * @param {json} json The json encoded acls
   */
  fromJSON(json) {
    this.read.fromJSON(json.read || {});
    this.write.fromJSON(json.write || {});
  }

}

module.exports = Acl;