'use strict';

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
    this.rules = {};
    /** @type util.Metadata */
    this.metadata = metadata;
  }

  /**
   * Returns a list of user and role references of all rules
   * @return {Array<string>} a list of references
   */
  allRules() {
    return Object.keys(this.rules);
  }

  /**
   * Removes all rules from this permission object
   */
  clear() {
    if (this.metadata) {
      this.metadata.writeAccess();
    }

    this.rules = {};
  }

  /**
   * Copies permissions from another permission object
   * @param {util.Permission} permission The permission to copy from
   * @return {util.Permission}
   */
  copy(permission) {
    if (this.metadata) {
      this.metadata.writeAccess();
    }

    this.rules = Object.assign({}, permission.rules);
    return this;
  }

  /**
   * Gets whenever all users and roles have the permission to perform the operation
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicAllowed() {
    if ('*' in this.rules) {
      return false;
    }

    return !this.allRules().some(ref => this.rules[ref] === 'allow');
  }

  /**
   * Sets whenever all users and roles should have the permission to perform the operation.
   * Note: All other allow rules will be removed.
   */
  setPublicAllowed() {
    if (this.metadata) {
      this.metadata.writeAccess();
    }

    this.allRules().forEach((ref) => {
      if (this.rules[ref] === 'allow') {
        delete this.rules[ref];
      }
    });
  }

  /**
   * Returns the actual rule of the given user or role.
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {string} The actual access rule or undefined if no rule was found
   */
  getRule(userOrRole) {
    return this.rules[this.ref(userOrRole)];
  }

  /**
   * Checks whenever the user or role is explicit allowed to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   */
  isAllowed(userOrRole) {
    return this.rules[this.ref(userOrRole)] === 'allow';
  }

  /**
   * Checks whenever the user or role is explicit denied to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   */
  isDenied(userOrRole) {
    return this.rules[this.ref(userOrRole)] === 'deny';
  }

  /**
   * Allows the given users or rules to perform the operation
   * @param {...(model.User|model.Role|string)} userOrRole The users or roles to allow
   * @return {util.Permission} this permission object
   */
  allowAccess(/* ...userOrRole */) {
    const rules = arguments;

    if (this.metadata) {
      this.metadata.writeAccess();
    }

    for (let i = 0; i < rules.length; i += 1) {
      this.rules[this.ref(rules[i])] = 'allow';
    }

    return this;
  }

  /**
   * Denies the given users or rules to perform the operation
   * @param {...(model.User|model.Role|string)} userOrRole The users or roles to deny
   * @return {util.Permission} this permission object
   */
  denyAccess(/* ...userOrRole */) {
    const rules = arguments;

    if (this.metadata) {
      this.metadata.writeAccess();
    }

    for (let i = 0; i < rules.length; i += 1) {
      this.rules[this.ref(rules[i])] = 'deny';
    }

    return this;
  }

  /**
   * Deletes any allow/deny rules for the given users or roles
   * @param {...(model.User|model.Role|string)} userOrRole The users or roles to delete rules for
   * @return {util.Permission} this permission object
   */
  deleteAccess(/* ...userOrRole */) {
    const rules = arguments;

    if (this.metadata) {
      this.metadata.writeAccess();
    }

    for (let i = 0; i < rules.length; i += 1) {
      delete this.rules[this.ref(rules[i])];
    }

    return this;
  }

  /**
   * A Json representation of the set of rules
   * @return {json}
   */
  toJSON() {
    return Object.assign({}, this.rules);
  }

  /**
   * Sets the permission rules from json
   * @param {json} json The permission json representation
   */
  fromJSON(json) {
    this.rules = json;
  }

  /**
   * Creates a permission from the given rules.
   * @param {json} json The rules.
   * @return {util.Permission} The permission.
   */
  static fromJSON(json) {
    const permission = new this();
    permission.fromJSON(json);
    return permission;
  }

  /**
   * Resolves user and role references and validate given references
   * @param {model.User|model.Role|string} userOrRole The user, role or reference
   * @return {string} The resolved and validated reference
   * @private
   */
  ref(userOrRole) {
    if (typeof userOrRole !== 'string') {
      userOrRole = userOrRole._metadata.id;
    }

    if (userOrRole.indexOf('/db/User/') === 0 || userOrRole.indexOf('/db/Role/') === 0) {
      return userOrRole;
    }

    throw new TypeError('The given object isn\'t a user, role or a valid reference.');
  }
}

Permission.BASE_PERMISSIONS = ['load', 'update', 'delete', 'query', 'insert'];
module.exports = Permission;
