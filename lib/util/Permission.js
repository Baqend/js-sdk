'use strict';

const deprecated = require('./deprecated');

/**
 * An aggregation of access rules for given object metadata.
 *
 * @alias util.Permission
 */
class Permission {
  /**
   * Creates a new Permission object, with an empty rule set
   * @param {util.Metadata=} metadata The metadata of the object
   */
  constructor(metadata) {
    /** @type {Object.<string, string>} */
    this.rules = {};
    /** @type util.Metadata= */
    this._metadata = metadata;
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
   * @return {void}
   */
  clear() {
    if (this._metadata) {
      this._metadata.writeAccess();
    }

    this.rules = {};
  }

  /**
   * Copies permissions from another permission object
   * @param {util.Permission} permission The permission to copy from
   * @return {util.Permission}
   */
  copy(permission) {
    if (this._metadata) {
      this._metadata.writeAccess();
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
   * Sets whenever all users and roles should have the permission to perform the operation
   *
   * Note: All other allow rules will be removed.
   *
   * @return {void}
   */
  setPublicAllowed() {
    if (this._metadata) {
      this._metadata.writeAccess();
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
   * Checks whether the user or role is implicitly allowed to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if the given user or role is implicitly allowed
   */
  isAccessAllowed(userOrRole) {
    const ref = this.ref(userOrRole);
    const ruledIds = Object.keys(this.rules);

    if (!ruledIds.length) {
      return true;
    }

    if (this.rules['*'] === 'deny') {
      return false;
    }

    if (ruledIds.some(otherRef => ref !== otherRef && this.rules[otherRef] === 'allow')) {
      return false;
    }

    if (ruledIds.some(otherRef => ref !== otherRef && this.rules[otherRef] === 'deny')) {
      return true;
    }

    return this.isAllowed(ref);
  }

  /**
   * Checks whether the user or role is explicitly allowed to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> If the given user or role is explicitly allowed
   */
  isAllowed(userOrRole) {
    return this.rules[this.ref(userOrRole)] === 'allow';
  }

  /**
   * Checks whether the user or role is implicitly denied to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if the given user or role is implicitly allowed
   */
  isAccessDenied(userOrRole) {
    const ref = this.ref(userOrRole);
    const ruledIds = Object.keys(this.rules);

    if (!ruledIds.length) {
      return false;
    }

    if (this.rules['*'] === 'deny') {
      return true;
    }

    if (ruledIds.some(otherRef => ref !== otherRef && this.rules[otherRef] === 'allow')) {
      return true;
    }

    if (ruledIds.some(otherRef => ref !== otherRef && this.rules[otherRef] === 'deny')) {
      return false;
    }

    return this.isDenied(ref);
  }

  /**
   * Checks whether the user or role is explicitly denied to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> If the given user or role is denied
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

    if (this._metadata) {
      this._metadata.writeAccess();
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

    if (this._metadata) {
      this._metadata.writeAccess();
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

    if (this._metadata) {
      this._metadata.writeAccess();
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
   * @return {void}
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
    const ref = typeof userOrRole === 'string' ? userOrRole : userOrRole.id;

    if (ref.indexOf('/db/User/') === 0 || ref.indexOf('/db/Role/') === 0) {
      return ref;
    }

    throw new TypeError('The given object isn\'t a user, role or a valid reference.');
  }
}

Permission.BASE_PERMISSIONS = ['load', 'update', 'delete', 'query', 'insert'];

deprecated(Permission.prototype, '_rules', 'rules');

module.exports = Permission;
