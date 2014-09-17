var EntityFactory = require('./EntityFactory').EntityFactory;
var UserFactory;

/**
 * @class jspa.binding.UserFactory
 * @extends jspa.binding.EntityFactory<jspa.binding.User>
 */
exports.UserFactory = UserFactory = EntityFactory.inherit(/** @lends jspa.binding.UserFactory.prototype */ {

  /** @lends jspa.binding.UserFactory */
  extend: {
    /**
     * Creates a new UserFactory
     * @param {jspa.metamodel.ManagedType} managedType The metadata of the user type
     * @param {jspa.EntityManager} db
     * @return {jspa.binding.UserFactory} A new object factory to created instances of Users
     */
    create: function(managedType, db) {
      var factory = EntityFactory.create(managedType, db);
      Object.cloneOwnProperties(factory, UserFactory.prototype);
      return factory;
    }
  },

  /**
   * Register a new user with the given username and password, if the username is not used by an another user.
   * @param {String} username The unique username
   * @param {String} password The password for the given user
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.User>} The created user object, for the new registered user.
   */
  register: function(username, password, doneCallback, failCallback) {
    return this._db.register(username, password).then(doneCallback, failCallback);
  },

  /**
   * Log in the user with the given username and password and starts a user session
   * @param {String} username The username of the user
   * @param {String} password The password of the user
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.User>}
   */
  login: function(username, password, doneCallback, failCallback) {
    return this._db.login(username, password).then(doneCallback, failCallback);
  },

  /**
   * Log out the current logged in user and ends the active user session
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<null>}
   */
  logout: function(doneCallback, failCallback) {
    return this._db.logout().then(doneCallback, failCallback);
  },

  /**
   * The current logged in user, or <code>null</code> if the user is not logged in
   * @type jspa.binding.User
   */
  get me() {
    return this._db.me;
  }

});