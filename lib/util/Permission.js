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
    /** @type {Object.<string, string>} */
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
   * Copies permissions from another permission object
   * @param {util.Permission} permission The permission to copy from
   * @return {util.Permission}
   */
  copy(permission) {
    this._metadata && this._metadata.writeAccess();
    this._rules = Object.assign({}, permission._rules);
    return this;
  }

  /**
   * Gets whenever all users and roles have the permission to perform the operation
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicAllowed() {
    if ('*' in this._rules)
      return false;

    for (let ref in this._rules) {
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
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {string} The actual access rule or undefined if no rule was found
   */
  getRule(userOrRole) {
    return this._rules[this._getRef(userOrRole)];
  }

  /**
   * Checks whenever the user or role is explicit allowed to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> If the given user or role is allowed
   */
  isAllowed(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'allow';
  }

  /**
   * Checks whenever the user or role is explicit denied to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> If the given user or role is denied
   */
  isDenied(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'deny';
  }

  /**
   * Allows the given users or rules to perform the operation
   * @param {...(model.User|model.Role|string)} userOrRole The users or roles to allow
   * @return {util.Permission} this permission object
   */
  allowAccess(userOrRole) {
    const rules = arguments;
    this._metadata && this._metadata.writeAccess();
    for (let i = 0; i < rules.length; i++) {
      this._rules[this._getRef(rules[i])] = 'allow';
    }
    return this;
  }

  /**
   * Denies the given users or rules to perform the operation
   * @param {...(model.User|model.Role|string)} userOrRole The users or roles to deny
   * @return {util.Permission} this permission object
   */
  denyAccess(userOrRole) {
    const rules = arguments;
    this._metadata && this._metadata.writeAccess();
    for (let i = 0; i < rules.length; i++) {
      this._rules[this._getRef(rules[i])] = 'deny';
    }
    return this;
  }

  /**
   * Deletes any allow/deny rules for the given users or roles
   * @param {...(model.User|model.Role|string)} userOrRole The users or roles to delete rules for
   * @return {util.Permission} this permission object
   */
  deleteAccess(userOrRole) {
    const rules = arguments;
    this._metadata && this._metadata.writeAccess();
    for (let i = 0; i < rules.length; i++) {
      delete this._rules[this._getRef(rules[i])];
    }
    return this;
  }

  /**
   * A Json representation of the set of rules
   * @return {json}
   */
  toJSON() {
    return Object.assign({}, this._rules);
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
   * @param {model.User|model.Role|string} userOrRole The user, role or reference
   * @return {string} The resolved and validated reference
   * @private
   */
  _getRef(userOrRole) {
    if (typeof userOrRole !== 'string') {
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
