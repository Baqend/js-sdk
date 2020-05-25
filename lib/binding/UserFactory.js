'use strict';

const EntityFactory = require('./EntityFactory');

/**
 * @class binding.UserFactory
 * @extends binding.EntityFactory<model.User>
 *
 * Creates a new instance of the managed type of this factory
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {model.User} The new managed instance
 */
const UserFactory = EntityFactory.extend(/** @lends binding.UserFactory.prototype */ {
  /**
   * The current logged in user, or <code>null</code> if the user is not logged in
   * @type model.User
   * @readonly
   */
  get me() {
    return this.db.me;
  },

  /**
   * Register a new user with the given username and password, if the username is not used by an another user.
   * @param {string|model.User} user The username as a string or a <User> Object, which must contain the username.
   * @param {string} password The password for the given user
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default logs the user in after a successful
   * registration and keeps the user logged in over multiple sessions
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>} The created user object, for the new registered user.
   */
  register(user, password, loginOption, doneCallback, failCallback) {
    if (loginOption instanceof Function) {
      return this.register(user, password, true, loginOption, doneCallback);
    }

    const userObj = typeof user === 'string' ? this.fromJSON({ username: user }) : user;
    return this.db.register(userObj, password, loginOption === undefined ? true : loginOption)
      .then(doneCallback, failCallback);
  },

  /**
   * Log in the user with the given username and password and starts a user session
   * @param {string} username The username of the user
   * @param {string} password The password of the user
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
   * multiple sessions
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   */
  login(username, password, loginOption, doneCallback, failCallback) {
    if (loginOption instanceof Function) {
      return this.login(username, password, true, loginOption, doneCallback);
    }

    return this.db.login(username, password, loginOption === undefined ? true : loginOption)
      .then(doneCallback, failCallback);
  },

  /**
   * Log in the user assiciated with the given token and starts a user session.
   * @param {string} token The user token.
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
   * multiple sessions
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   */
  loginWithToken(token, loginOption, doneCallback, failCallback) {
    if (loginOption instanceof Function) {
      return this.loginWithToken(token, true, loginOption, doneCallback);
    }

    this.db.token = token;
    return this.db.renew(loginOption).then(doneCallback, failCallback);
  },

  /**
   * Log out the current logged in user and ends the active user session
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  logout(doneCallback, failCallback) {
    return this.db.logout().then(doneCallback, failCallback);
  },

  /**
   * Change the password of the given user
   *
   * @param {string} username Username to identify the user
   * @param {string} password Current password of the user
   * @param {string} newPassword New password of the user
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   */
  newPassword(username, password, newPassword, doneCallback, failCallback) {
    // detect signature newPassword(token, newPassword, [loginOption=true][, doneCallback[, failCallback]])
    if (typeof newPassword === 'string') {
      return this.db.newPassword(username, password, newPassword).then(doneCallback, failCallback);
    }

    const arg = arguments;
    const token = arg[0];
    const newPassword2 = arg[1];
    let loginOption2 = arg[2];
    let doneCallback2 = arg[3];
    let failCallback2 = arg[4];
    if (loginOption2 instanceof Function) {
      failCallback2 = doneCallback2;
      doneCallback2 = loginOption2;
      loginOption2 = true;
    }

    return this.db.newPasswordWithToken(token, newPassword2, loginOption2).then(doneCallback2, failCallback2);
  },

  /**
   * Sends an email with a link to reset the password for the given username
   *
   * The username must be a valid email address.
   *
   * @param {string} username Username (email) to identify the user
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  resetPassword(username, doneCallback, failCallback) {
    return this.db.resetPassword(username).then(doneCallback, failCallback);
  },

  /**
   * Sends an email with a link to change the current username
   *
   * The user is identified by their current username and password.
   * The username must be a valid email address.
   *
   * @param {string} username Current username (email) to identify the user
   * @param {string} newUsername New username (email) to change the current username to
   * @param {string} password The current password of the user. Has to be passed to the function for security reason
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  changeUsername(username, newUsername, password, doneCallback, failCallback) {
    return this.db.changeUsername(username, newUsername, password, doneCallback, failCallback);
  },

  /**
   * Requests a perpetual token for the given user
   *
   * Only users with the admin role are allowed to request an API token.
   *
   * @param {binding.User|String} user The user object or id of the user object
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  requestAPIToken(user, doneCallback, failCallback) {
    return this.db.requestAPIToken(this.managedType.typeConstructor, user).then(doneCallback, failCallback);
  },

  /**
   * Revoke all created tokens for the given user
   *
   * This method will revoke all previously issued tokens and the user must login again.
   *
   * @param {binding.User|String} user The user object or id of the user object
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  revokeAllTokens(user, doneCallback, failCallback) {
    return this.db.revokeAllTokens(this.managedType.typeConstructor, user).then(doneCallback, failCallback);
  },
});

/**
 * Change the password of a user, which will be identified by the given token from the reset password e-mail
 *
 * @see resetPassword
 * @param {string} token Token from the reset password e-mail
 * @param {string} newPassword New password of the user
 * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true]
 * The default keeps the user logged in over multiple sessions
 * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name newPassword
 * @memberOf binding.UserFactory.prototype
 */

/**
 * Logs the user in with Google via OAuth
 *
 * Prompts the user for the Google login in a new window. Before using OAuth you need to setup your application
 * on the provider website, add the redirect uri: <code>https://example.net/db/User/OAuth/google</code> and copy the
 * client id and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is
 * logged in.
 *
 * @param {string} clientID
 * @param {Object=} options
 * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
 * multiple sessions
 * @param {string} [options.title="Login"] sets the title of the popup window
 * @param {number} [options.width=585] defines the width of the popup window
 * @param {number} [options.height=545] defines the height of the popup window
 * @param {string} [options.scope="email"] the range of rights requested from the user
 * @param {Object} [options.state={}]
 * @param {number} [options.timeout=5 * 60 * 1000]
 * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode,
 * i.e. this site is closed to open the providers login page.
 * Once the login is finished this redirect url will be opened with the logged-in user's token attached.
 * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithGoogle
 * @memberOf binding.UserFactory.prototype
 */

/**
 * Logs the user in with Facebook via OAuth
 *
 * Prompts the user for the Facebook login in a new window. Before using OAuth you need to setup your application
 * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/facebook and copy the client id
 * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
 *
 * @param {string} clientID
 * @param {Object=} options
 * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
 * multiple sessions
 * @param {string} [options.title="Login"] sets the title of the popup window
 * @param {number} [options.width=1140] defines the width of the popup window
 * @param {number} [options.height=640] defines the height of the popup window
 * @param {string} [options.scope="email"] the range of rights requested from the user
 * @param {Object} [options.state={}]
 * @param {number} [options.timeout=5 * 60 * 1000]
 * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode, i.e. this site is
 * closed to open the providers login page. Once the login is finished this redirect url will be opened
 * with the logged-in user's token attached.
 * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithFacebook
 * @memberOf binding.UserFactory.prototype
 */

/**
 * Logs the user in with GitHub via OAuth
 *
 * Prompts the user for the GitHub login in a new window. Before using OAuth you need to setup your application
 * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/github and copy the client id
 * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
 *
 * @param {string} clientID
 * @param {Object=} options
 * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over*
 * multiple sessions
 * @param {string} [options.title="Login"] sets the title of the popup window
 * @param {number} [options.width=1040] defines the width of the popup window
 * @param {number} [options.height=580] defines the height of the popup window
 * @param {string} [options.scope="user:email"] the range of rights requested from the user
 * @param {Object} [options.state={}]
 * @param {number} [options.timeout=5 * 60 * 1000]
 * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode, i.e. this site is
 * closed to open the providers login page. Once the login is finished this redirect url will be opened
 * with the logged-in user's token attached.
 * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithGitHub
 * @memberOf binding.UserFactory.prototype
 */

/**
 * Logs the user in with Twitter via OAuth
 *
 * Prompts the user for the Twitter login in a new window. Before using OAuth you need to setup your application
 * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/twitter and copy the client id
 * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
 *
 * @param {string} clientID
 * @param {Object=} options
 * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
 * multiple sessions
 * @param {string} [options.title="Login"] sets the title of the popup window
 * @param {number} [options.width=740] defines the width of the popup window
 * @param {number} [options.height=730] defines the height of the popup window
 * @param {number} [options.timeout=5 * 60 * 1000]
 * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode,
  i.e. this site is
   * closed to open the providers login page. Once the login is finished this redirect url will be opened
 * with the logged-in user's token attached.
 * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithTwitter
 * @memberOf binding.UserFactory.prototype
 */

/**
 * Logs the user in with LinkedIn via OAuth
 *
 * Prompts the user for the LinkedIn login in a new window. Before using OAuth you need to setup your application
 * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/linkedin and copy the client id
 * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
 *
 * @param {string} clientID
 * @param {Object=} options
 * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
 * multiple sessions
 * @param {string} [options.title="Login"] sets the title of the popup window
 * @param {number} [options.width=630] defines the width of the popup window
 * @param {number} [options.height=530] defines the height of the popup window
 * @param {string} [options.scope=""] the range of rights requested from the user
 * @param {Object} [options.state={}]
 * @param {number} [options.timeout=5 * 60 * 1000]
 * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode, i.e. this site is
 * closed to open the providers login page. Once the login is finished this redirect url will be opened
 * with the logged-in user's token attached.
 * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithLinkedIn
 * @memberOf binding.UserFactory.prototype
 */

/**
 * Logs the user in with Salesforce via OAuth
 *
 * Prompts the user for the Salesforce login in a new window. Before using OAuth you need to setup your application
 * on the provider website, add the redirect uri: <code>https://example.net/db/User/OAuth/salesforce</code> and copy the
 * client id and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is
 * logged in.
 *
 * @param {string} clientID
 * @param {Object=} options
 * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
 * multiple sessions
 * @param {string} [options.title="Login"] sets the title of the popup window
 * @param {number} [options.width=585] defines the width of the popup window
 * @param {number} [options.height=545] defines the height of the popup window
 * @param {string} [options.scope="email"] the range of rights requested from the user
 * @param {Object} [options.state={}]
 * @param {number} [options.timeout=5 * 60 * 1000]
 * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode,
 * i.e. this site is closed to open the providers login page.
 * Once the login is finished this redirect url will be opened with the logged-in user's token attached.
 * @param {Object} [options.path] The OAuth login endpoint of the salesforce server
 * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithSalesforce
 * @memberOf binding.UserFactory.prototype
 */

/**
 * Creates a new user object
 *
 * @function
 * @name new
 * @param {Object<string, *>} properties Additional properties which will be applied to the created instance
 * @return {model.User} A new created user
 * @memberOf binding.UserFactory.prototype
 */

/**
 * @alias binding.UserFactory.LoginOption
 * @enum {number}
 */
UserFactory.LoginOption = {
  /**
   * Do not login the user after a successful registration
   */
  NO_LOGIN: -1,
  /**
   * Login in after a successful registration and keep the token in a nonpermanent storage, i.e SessionStorage
   */
  SESSION_LOGIN: 0,
  /**
   * Login in after a successful registration and keep the token in a persistent storage, i.e LocalStorage
   */
  PERSIST_LOGIN: 1,
};

/**
 * @alias binding.UserFactory.DefaultOptions
 * @property {Object} oauth default properties
 * @property {Object} oauth.google default oauth properties for Google
 * @property {Object} oauth.facebook default oauth properties for Facebook
 * @property {Object} oauth.github default oauth properties for GitHub
 * @property {Object} oauth.twitter default oauth properties for Twitter
 * @property {Object} oauth.linkedin default oauth properties for LinkedIn
 * @property {Object} oauth.salesforce default oauth properties for Salesforce
 */
UserFactory.DefaultOptions = {
  google: {
    width: 585,
    height: 545,
    scope: 'email',
  },
  facebook: {
    width: 1140,
    height: 640,
    scope: 'email',
  },
  github: {
    width: 1040,
    height: 580,
    scope: 'user:email',
  },
  twitter: {
    width: 740,
    height: 730,
  },
  linkedin: {
    width: 630,
    height: 530,
    scope: 'r_liteprofile',
  },
  salesforce: {
    width: 585,
    height: 545,
    scope: 'email',
  },
};

['Google', 'Facebook', 'GitHub', 'Twitter', 'LinkedIn', 'Salesforce'].forEach((name) => {
  const methodName = 'loginWith' + name;
  // do not use a lambda here since we will loose the this context
  UserFactory[methodName] = function (clientID, options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this[methodName](clientID, {}, options, doneCallback);
    }

    const opt = Object.assign({}, UserFactory.DefaultOptions[name.toLowerCase()], options || {});

    return this.db.loginWithOAuth(name, clientID, opt).then(doneCallback, failCallback);
  };
});

module.exports = UserFactory;
