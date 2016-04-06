var EntityFactory = require('./EntityFactory');

/**
 * @class baqend.binding.UserFactory
 * @extends baqend.binding.EntityFactory
 */
var UserFactory = {};
Object.cloneOwnProperties(UserFactory, EntityFactory);

Object.defineProperty(UserFactory, 'me', {
  /**
   * The current logged in user, or <code>null</code> if the user is not logged in
   * @type baqend.binding.User
   */
  get: function() {
    return this._db.me;
  }
});

Object.extend(UserFactory, /** @lends baqend.binding.UserFactory */ {
  /**
   * @enum {number}
   */
  LoginOption: {
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
    PERSIST_LOGIN: 1
  },

  defaultOptions: {
    google: {
      width: 585,
      height: 545,
      scope: 'email'
    },
    facebook:{
      width: 1140,
      height: 640,
      scope: 'email'
    },
    github: {
      width: 1040,
      height: 580,
      scope: 'user:email'
    },
    twitter: {
      width: 740,
      height: 730
    },
    linkedin: {
      width: 630,
      height: 530,
      scope: ''
    }
  },

  /**
   * Register a new user with the given username and password, if the username is not used by an another user.
   * @param {String|baqend.binding.User} user The username as a string or a <baqend.binding.User> Object, which must contain the username.
   * @param {String} password The password for the given user
   * @param {Boolean|baqend.binding.UserFactory.LoginOption} [loginOption=true] The default logs the user in after a successful registration and keeps the user logged in over multiple sessions
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>} The created user object, for the new registered user.
   */
  register: function(user, password, loginOption, doneCallback, failCallback) {
    if (Function.isInstance(loginOption)) {
      failCallback = doneCallback;
      doneCallback = loginOption;
      loginOption = true;
    }

    user = String.isInstance(user)? this.fromJSON({username: user}): user;
    return this._db.register(user, password, loginOption === undefined? true: loginOption).then(doneCallback, failCallback);
  },

  /**
   * Log in the user with the given username and password and starts a user session
   * @param {String} username The username of the user
   * @param {String} password The password of the user
   * @param {Boolean|baqend.binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   */
  login: function(username, password, loginOption, doneCallback, failCallback) {
    if (Function.isInstance(loginOption)) {
      failCallback = doneCallback;
      doneCallback = loginOption;
      loginOption = true;
    }

    return this._db.login(username, password, loginOption === undefined? true: loginOption).then(doneCallback, failCallback);
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
  }

  /**
   * Prompts the user for the Google login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: <code>https://example.net/db/User/OAuth/google</code> and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {Boolean|baqend.binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=585] defines the width of the popup window
   * @param {Number} [options.height=545] defines the height of the popup window
   * @param {String} [options.scope="email"] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithGoogle
   * @memberOf baqend.binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the Facebook login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/facebook and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {Boolean|baqend.binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=1140] defines the width of the popup window
   * @param {Number} [options.height=640] defines the height of the popup window
   * @param {String} [options.scope="email"] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithFacebook
   * @memberOf baqend.binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the GitHub login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/github and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {Boolean|baqend.binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=1040] defines the width of the popup window
   * @param {Number} [options.height=580] defines the height of the popup window
   * @param {String} [options.scope="user:email"] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithGitHub
   * @memberOf baqend.binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the Twitter login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/twitter and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {Boolean|baqend.binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=740] defines the width of the popup window
   * @param {Number} [options.height=730] defines the height of the popup window
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithTwitter
   * @memberOf baqend.binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the LinkedIn login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/linkedin and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {Boolean|baqend.binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=630] defines the width of the popup window
   * @param {Number} [options.height=530] defines the height of the popup window
   * @param {String} [options.scope=""] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithLinkedIn
   * @memberOf baqend.binding.UserFactory.prototype
   */
});

["Google", "Facebook", "GitHub", "Twitter", "LinkedIn"].forEach(function(name) {
  UserFactory["loginWith" + name] = function(clientID, options, doneCallback, failCallback) {
    //noinspection JSPotentiallyInvalidUsageOfThis
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    options = Object.extend(Object.extend({}, UserFactory.defaultOptions[name.toLowerCase()]), options || {});

    return this._db.loginWithOAuth(name, clientID, options).then(doneCallback, failCallback);
  }
});

module.exports = UserFactory;
