"use strict";

/**
 * @alias util.Permission
 */
class Permission {

  /**
   * Creates a new Permission object, with an empty rule set
   * @param {util.Metadata} metadata The metadata of the object
   */
  constructor(metadata) {
    /** @type {Object<string, string>} */
    this._rules = {};
    /** @type util.Metadata */
    this._metadata = metadata;
  }

  /**
   * Returns a list of user and role references of all rules
   * @return {Array<string>} a list of references
   */
  allRules() {
    return Object.keys(this._rules);
  }

  /**
   * Removes all rules from this permission object
   */
  clear() {
    this._metadata && this._metadata.writeAccess();
    this._rules = {};
  }

  /**
   * Gets whenever all users and roles have the permission to perform the operation
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicAllowed() {
    if ('*' in this._rules)
      return false;

    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        return false;
      }
    }

    return true;
  }

  /**
   * Sets whenever all users and roles should have the permission to perform the operation.
   * Note: All other allow rules will be removed.
   */
  setPublicAllowed() {
    this._metadata && this._metadata.writeAccess();
    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        delete this._rules[ref];
      }
    }
  }

  /**
   * Returns the actual rule of the given user or role.
   * @param {model.User|model.Role} userOrRole The user or role to check for
   * @return {string} The actual access rule or undefined if no rule was found
   */
  getRule(userOrRole) {
    return this._rules[this._getRef(userOrRole)];
  }

  /**
   * Checks whenever the user or role is explicit allowed to perform the operation.
   *
   * @param {model.User|model.Role} userOrRole The user or role to check for
   */
  isAllowed(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'allow';
  }

  /**
   * Checks whenever the user or role is explicit denied to perform the operation.
   *
   * @param {model.User|model.Role} userOrRole The user or role to check for
   */
  isDenied(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'deny';
  }

  /**
   * Allows the given user or rule to perform the operation
   * @param {model.User|model.Role} userOrRole The user or role to allow
   * @return {util.Permission} this permission object
   */
  allowAccess(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    this._rules[this._getRef(userOrRole)] = 'allow';
    return this;
  }

  /**
   * Denies the given user or rule to perform the operation
   * @param {model.User|model.Role} userOrRole The user or role to deny
   * @return {util.Permission} this permission object
   */
  denyAccess(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    this._rules[this._getRef(userOrRole)] = 'deny';
    return this;
  }

  /**
   * Deletes any allow/deny rule for the given user or role
   * @param {model.User|model.Role} userOrRole The user or role
   * @return {util.Permission} this permission object
   */
  deleteAccess(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    delete this._rules[this._getRef(userOrRole)];
    return this;
  }

  /**
   * A Json representation of the set of rules
   * @return {json}
   */
  toJSON() {
    return this._rules;
  }

  /**
   * Sets the permission rules from json
   * @param {json} json The permission json representation
   */
  fromJSON(json) {
    this._rules = json;
  }

  /**
   * Creates a permission from the given rules.
   * @param {json} json The rules.
   * @return {util.Permission} The permission.
   */
  static fromJSON(json) {
    var permission = new this();
    permission.fromJSON(json);
    return permission;
  }

  /**
   * Resolves user and role references and validate given references
   * @param {model.User|model.Role} userOrRole The user, role or reference
   * @return {string} The resolved and validated reference
   * @private
   */
  _getRef(userOrRole) {
    if (!(Object(userOrRole) instanceof String)) {
      userOrRole = userOrRole._metadata.id;
    }

    if (userOrRole.indexOf('/db/User/') == 0 || userOrRole.indexOf('/db/Role/') == 0) {
      return userOrRole;
    }

    throw new TypeError('The given object isn\'t a user, role or a valid reference.');
  }
}

Permission.BASE_PERMISSIONS = ['load', 'update', 'delete', 'query', 'insert'];
module.exports = Permission;
