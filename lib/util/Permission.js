/**
 * @class baqend.util.Permission
 */
var Permission = Object.inherit(/** @lends baqend.util.Permission.prototype */ {

  /**
   * @type baqend.util.Metadata
   * @private
   */
  _metadata: null,

  /**
   * The set of rules
   * @type object
   * @private
   */
  _rules: null,

  /**
   * Creates a new Permission object, with an empty rule set
   * @param {baqend.util.Metadata} metadata The metadata of the object
   */
  constructor: function Permission(metadata) {
    this._rules = {};
    this._metadata = metadata;
  },

  /**
   * Returns a list of user and role references of all rules
   * @return {String[]} a list of references
   */
  allRules: function() {
    return Object.keys(this._rules);
  },

  /**
   * Removes all rules from this permission object
   */
  clear: function() {
    this._metadata && this._metadata.writeAccess();
    this._rules = {};
  },

  /**
   * Gets whenever all users and roles have the permission to perform the operation
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicAllowed: function() {
    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        return false;
      }
    }

    return true;
  },

  /**
   * Sets whenever all users and roles should have the permission to perform the operation.
   * Note: All other allow rules will be removed.
   */
  setPublicAllowed: function() {
    this._metadata && this._metadata.writeAccess();
    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        delete this._rules[ref];
      }
    }
  },

  /**
   * Returns the actual rule of the given user or role.
   * @param userOrRole The user or role to check for
   * @return {String|undefined} The actual access rule
   */
  getRule: function(userOrRole) {
    return this._rules[this._getRef(userOrRole)];
  },

  /**
   * Checks whenever the user or role is explicit allowed to perform the operation.
   *
   * @param userOrRole The user or role to check for
   */
  isAllowed: function(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'allow';
  },

  /**
   * Checks whenever the user or role is explicit denied to perform the operation.
   *
   * @param userOrRole The user or role to check for
   */
  isDenied: function(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'deny';
  },

  /**
   * Allows the given user or rule to perform the operation
   * @param userOrRole The user or role to allow
   * @return {baqend.util.Permission} this permission object
   */
  allowAccess: function(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    this._rules[this._getRef(userOrRole)] = 'allow';
    return this;
  },

  /**
   * Denies the given user or rule to perform the operation
   * @param userOrRole The user or role to deny
   * @return {baqend.util.Permission} this permission object
   */
  denyAccess: function(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    this._rules[this._getRef(userOrRole)] = 'deny';
    return this;
  },

  /**
   * Deletes any allow/deny rule for the given user or role
   * @param userOrRole The user or role
   * @return {baqend.util.Permission} this permission object
   */
  deleteAccess: function(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    delete this._rules[this._getRef(userOrRole)];
    return this;
  },

  /**
   * A Json representation of the set of rules
   * @return {object}
   */
  toJSON: function() {
    return this._rules;
  },

  /**
   * Sets the permission rules from json
   * @param {object} json The permission json representation
   */
  fromJSON: function(json) {
    this._rules = json;
  },

  /**
   * Resolves user and role references and validate given references
   * @param userOrRole The user, role or reference
   * @return {String} The resolved and validated reference
   * @private
   */
  _getRef: function(userOrRole) {
    if (!String.isInstance(userOrRole)) {
      userOrRole = userOrRole._metadata.id;
    }

    if (userOrRole.indexOf('/db/User/') == 0 || userOrRole.indexOf('/db/Role/') == 0) {
      return userOrRole;
    }

    throw new TypeError('The given object isn\'t a user, role or a valid reference.');
  }

});

module.exports = Permission;