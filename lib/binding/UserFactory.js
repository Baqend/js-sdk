var EntityFactory = require('./EntityFactory');

/**
 * @class baqend.binding.UserFactory
 * @extends baqend.binding.EntityFactory
 */
var UserFactory = EntityFactory.inherit(/** @lends baqend.binding.UserFactory.prototype */ {

  /** @lends baqend.binding.UserFactory */
  extend: {
    /**
     * Creates a new UserFactory
     * @param {baqend.metamodel.ManagedType} managedType The metadata of the user type
     * @param {baqend.EntityManager} db
     * @return {baqend.binding.UserFactory} A new object factory to created instances of Users
     */
    create: function(managedType, db) {
      var factory = EntityFactory.create(managedType, db);
      Object.cloneOwnProperties(factory, UserFactory.prototype);
      return factory;
    }
  },

  constructor: function UserFactory(managedType, db) {
    EntityFactory.call(this, managedType, db);
  },

  /**
   * Register a new user with the given username and password, if the username is not used by an another user.
   * @param {String|Object} user The username as a string or a JSON to set the user fields, which must contain the username.
   * @param {String} password The password for the given user
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>} The created user object, for the new registered user.
   */
  register: function(user, password, doneCallback, failCallback) {
    user = String.isInstance(user)? this.fromJSON({username: user}): user;
    return this._db.register(user, password).then(doneCallback, failCallback);
  },

  /**
   * Log in the user with the given username and password and starts a user session
   * @param {String} username The username of the user
   * @param {String} password The password of the user
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   */
  login: function(username, password, doneCallback, failCallback) {
    return this._db.login(username, password).then(doneCallback, failCallback);
  },

  /**
   * Log out the current logged in user and ends the active user session
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<null>}
   */
  logout: function(doneCallback, failCallback) {
    return this._db.logout().then(doneCallback, failCallback);
  },

  /**
   * Change the password of the given user
   *
   * @param {String} username Username to identify the user
   * @param {String} password Current password of the user
   * @param {String} newPassword New password of the user
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   */
  newPassword: function(username, password, newPassword, doneCallback, failCallback) {
    return this._db.newPassword(username, password, newPassword).then(doneCallback, failCallback);
  },

  /**
   * The current logged in user, or <code>null</code> if the user is not logged in
   * @type baqend.binding.User
   */
  get me() {
    return this._db.me;
  }

});

module.exports = UserFactory;