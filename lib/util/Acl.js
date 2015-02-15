var Permission = require('./Permission');

/**
 * @class baqend.Acl
 *
 * @classdesc Creates a new Acl object, with an empty rule set for an object
 * @param {baqend.util.Metadata} metadata the metadata of the object
 */
var Acl = module.exports = Object.inherit(/** @lends baqend.Acl.prototype */ {

  /**
   * The read permission of the object
   * @type baqend.util.Permission
   */
  read: null,

  /**
   * The write permission of the object
   * @type baqend.util.Permission
   */
  write: null,

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
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isReadAllowed: function(userOrRole) {
    return this.read.isAllowed(userOrRole);
  },

  /**
   * Checks whenever the user or role is explicit denied to read the object
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isReadDenied: function(userOrRole) {
    return this.read.isDenied(userOrRole);
  },

  /**
   * Allows the given user or rule to read the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to allow
   * @return {baqend.Acl} this acl object
   */
  allowReadAccess: function(userOrRole) {
    this.read.allowAccess(userOrRole);
    return this;
  },

  /**
   * Denies the given user or rule to read the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to deny
   * @return {baqend.Acl} this acl object
   */
  denyReadAccess: function(userOrRole) {
    this.read.denyAccess(userOrRole);
    return this;
  },

  /**
   * Deletes any read allow/deny rule for the given user or role
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role
   * @return {baqend.Acl} this acl object
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
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isWriteAllowed: function(userOrRole) {
    return this.write.isAllowed(userOrRole);
  },

  /**
   * Checks whenever the user or role is explicit denied to write the object
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isWriteDenied: function(userOrRole) {
    return this.write.isDenied(userOrRole);
  },

  /**
   * Allows the given user or rule to write the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to allow
   * @return {baqend.Acl} this acl object
   */
  allowWriteAccess: function(userOrRole) {
    this.write.allowAccess(userOrRole);
    return this;
  },

  /**
   * Denies the given user or rule to write the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to deny
   * @return {baqend.Acl} this acl object
   */
  denyWriteAccess: function(userOrRole) {
    this.write.denyAccess(userOrRole);
    return this;
  },

  /**
   * Deletes any write allow/deny rule for the given user or role
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role
   * @return {baqend.Acl} this acl object
   */
  deleteWriteAccess: function(userOrRole) {
    this.write.deleteAccess(userOrRole);
    return this;
  },

  /**
   * A Json representation of the set of rules
   * @return {object}
   */
  toJSON: function() {
    return {
      read: this.read,
      write: this.write
    };
  },

  /**
   * Sets the acl rules form json
   * @param {object} json The json encoded acls
   */
  fromJSON: function(json) {
    this.read.fromJSON(json.read);
    this.write.fromJSON(json.write);
  }

});