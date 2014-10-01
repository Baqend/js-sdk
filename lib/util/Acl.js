var Permission = require('./Permission').Permission;
var Acl;

/**
 * @class jspa.Acl
 */
exports.Acl = Acl = Object.inherit(/** @lends jspa.Acl.prototype */ {

  /**
   * The read permission of the object
   * @type jspa.util.Permission
   */
  read: null,

  /**
   * The write permission of the object
   * @type jspa.util.Permission
   */
  write: null,

  /**
   * Creates a new Acl object, with an empty rule set for an object
   * @param {jspa.util.Metadata} metadata the metadata of the object
   */
  initialize: function(metadata) {
    this.read = new Permission(metadata);
    this.write = new Permission(metadata);
  },

  /**
   * Removes all acl rules, read and write access is public afterwards
   */
  clear: function() {
    this.read.clear();
    this.write.clear();
  },

  /**
   * Gets whenever all users and roles have the permission to read the object
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicReadAllowed: function() {
    return this.read.isPublicAllowed();
  },

  /**
   * Sets whenever all users and roles should have the permission to read the object.
   * Note: All other allow read rules will be removed.
   */
  setPublicReadAllowed: function() {
    return this.read.setPublicAllowed();
  },

  /**
   * Checks whenever the user or role is explicit allowed to read the object.
   *
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role to check for
   */
  isReadAllowed: function(userOrRole) {
    return this.read.isAllowed(userOrRole);
  },

  /**
   * Checks whenever the user or role is explicit denied to read the object
   *
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role to check for
   */
  isReadDenied: function(userOrRole) {
    return this.read.isDenied(userOrRole);
  },

  /**
   * Allows the given user or rule to read the object
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role to allow
   * @return {jspa.Acl} this acl object
   */
  allowReadAccess: function(userOrRole) {
    this.read.allowAccess(userOrRole);
    return this;
  },

  /**
   * Denies the given user or rule to read the object
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role to deny
   * @return {jspa.Acl} this acl object
   */
  denyReadAccess: function(userOrRole) {
    this.read.denyAccess(userOrRole);
    return this;
  },

  /**
   * Deletes any read allow/deny rule for the given user or role
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role
   * @return {jspa.Acl} this acl object
   */
  deleteReadAccess: function(userOrRole) {
    this.read.deleteAccess(userOrRole);
    return this;
  },

  /**
   * Gets whenever all users and roles have the permission to write the object
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicWriteAllowed: function() {
    return this.write.isPublicAllowed();
  },

  /**
   * Sets whenever all users and roles should have the permission to write the object.
   * Note: All other allow write rules will be removed.
   */
  setPublicWriteAllowed: function() {
    return this.write.setPublicAllowed();
  },

  /**
   * Checks whenever the user or role is explicit allowed to write the object.
   *
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role to check for
   */
  isWriteAllowed: function(userOrRole) {
    return this.write.isAllowed(userOrRole);
  },

  /**
   * Checks whenever the user or role is explicit denied to write the object
   *
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role to check for
   */
  isWriteDenied: function(userOrRole) {
    return this.write.isDenied(userOrRole);
  },

  /**
   * Allows the given user or rule to write the object
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role to allow
   * @return {jspa.Acl} this acl object
   */
  allowWriteAccess: function(userOrRole) {
    this.write.allowAccess(userOrRole);
    return this;
  },

  /**
   * Denies the given user or rule to write the object
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role to deny
   * @return {jspa.Acl} this acl object
   */
  denyWriteAccess: function(userOrRole) {
    this.write.denyAccess(userOrRole);
    return this;
  },

  /**
   * Deletes any write allow/deny rule for the given user or role
   * @param {jspa.binding.User|jspa.binding.Role|String} userOrRole The user or role
   * @return {jspa.Acl} this acl object
   */
  deleteWriteAccess: function(userOrRole) {
    this.write.deleteAccess(userOrRole);
    return this;
  },

  /**
   * A Json representation of the set of rules
   * @return {object}
   */
  toJson: function() {
    return {
      read: this.read,
      write: this.write
    };
  },

  /**
   * Sets the acl rules form json
   * @param {object} json The json encoded acls
   */
  fromJson: function(json) {
    this.read.fromJson(json.read);
    this.write.fromJson(json.write);
  }

});