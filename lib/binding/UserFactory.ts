'use strict';

import { EntityFactory } from "./EntityFactory";
import { ManagedFactory } from "./ManagedFactory";
import { model } from "../model";
import { ManagedType } from "../metamodel/ManagedType";
import { EntityManager } from "../EntityManager";
import { EntityType } from "../metamodel/EntityType";

export enum LoginOption {
  /**
   * Do not login the user after a successful registration
   */
  NO_LOGIN = -1,
  /**
   * Login in after a successful registration and keep the token in a nonpermanent storage, i.e SessionStorage
   */
  SESSION_LOGIN = 0,
  /**
   * Login in after a successful registration and keep the token in a persistent storage, i.e LocalStorage
   */
  PERSIST_LOGIN = 1,
}

/**
 * Creates a new instance of the managed type of this factory
 */
export class UserFactory extends EntityFactory<model.User> {
  public static readonly LoginOption = LoginOption;

  /**
   * @property oauth default properties
   * @property oauth.google default oauth properties for Google
   * @property oauth.facebook default oauth properties for Facebook
   * @property oauth.github default oauth properties for GitHub
   * @property oauth.twitter default oauth properties for Twitter
   * @property oauth.linkedin default oauth properties for LinkedIn
   */
  public static readonly DefaultOptions = {
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
  };

  /**
   * The current logged in user, or <code>null</code> if the user is not logged in
   */
  get me(): model.User | null {
    return this.db.me;
  }

  /**
   * Register a new user with the given username and password, if the username is not used by an another user.
   * @param user The username as a string or a <User> Object, which must contain the username.
   * @param password The password for the given user
   * @param [loginOption=true] The default logs the user in after a successful
   * registration and keeps the user logged in over multiple sessions
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return The created user object, for the new registered user.
   */
  register(user: string | model.User, password: string, loginOption?: boolean | LoginOption, doneCallback?, failCallback?): Promise<model.User> {
    if (loginOption instanceof Function) {
      return this.register(user, password, true, loginOption, doneCallback);
    }

    const userObj = typeof user === 'string' ? this.fromJSON({ username: user }) : user;
    return this.db.register(userObj, password, loginOption === undefined ? true : loginOption)
      .then(doneCallback, failCallback);
  }

  /**
   * Log in the user with the given username and password and starts a user session
   * @param username The username of the user
   * @param password The password of the user
   * @param [loginOption=true] The default keeps the user logged in over
   * multiple sessions
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  login(username: string, password: string, loginOption?: boolean | LoginOption, doneCallback?, failCallback?): Promise<model.User> {
    if (loginOption instanceof Function) {
      return this.login(username, password, true, loginOption, doneCallback);
    }

    return this.db.login(username, password, loginOption === undefined ? true : loginOption)
      .then(doneCallback, failCallback);
  }

  /**
   * Log in the user assiciated with the given token and starts a user session.
   * @param token The user token.
   * @param [loginOption=true] The default keeps the user logged in over
   * multiple sessions
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  loginWithToken(token: string, loginOption?: boolean | LoginOption, doneCallback?, failCallback?): Promise<model.User> {
    if (loginOption instanceof Function) {
      return this.loginWithToken(token, true, loginOption, doneCallback);
    }

    this.db.token = token;
    return this.db.renew(loginOption).then(doneCallback, failCallback);
  }

  /**
   * Log out the current logged in user and ends the active user session
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  logout(doneCallback?, failCallback?): Promise<any> {
    return this.db.logout().then(doneCallback, failCallback);
  }

  /**
   * Change the password of the given user
   *
   * @param username Username to identify the user
   * @param password Current password of the user
   * @param newPassword New password of the user
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  newPassword(username: string, password: string, newPassword: string, doneCallback?, failCallback?): Promise<model.User> {
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
  }

  /**
   * Sends an email with a link to reset the password for the given username
   *
   * The username must be a valid email address.
   *
   * @param username Username (email) to identify the user
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  resetPassword(username: string, doneCallback, failCallback): Promise<any> {
    return this.db.resetPassword(username).then(doneCallback, failCallback);
  }

  /**
   * Sends an email with a link to change the current username
   *
   * The user is identified by their current username and password.
   * The username must be a valid email address.
   *
   * @param username Current username (email) to identify the user
   * @param newUsername New username (email) to change the current username to
   * @param password The current password of the user. Has to be passed to the function for security reason
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  changeUsername(username: string, newUsername: string, password: string, doneCallback, failCallback): Promise<any> {
    return this.db.changeUsername(username, newUsername, password).then(doneCallback, failCallback);
  }

  /**
   * Requests a perpetual token for the given user
   *
   * Only users with the admin role are allowed to request an API token.
   *
   * @param user The user object or id of the user object
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  requestAPIToken(user: model.User, doneCallback, failCallback): Promise<any> {
    return this.db.requestAPIToken(this.managedType.typeConstructor, user).then(doneCallback, failCallback);
  }

  /**
   * Revoke all created tokens for the given user
   *
   * This method will revoke all previously issued tokens and the user must login again.
   *
   * @param user The user object or id of the user object
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  revokeAllTokens(user: model.User, doneCallback, failCallback): Promise<any> {
    return this.db.revokeAllTokens(this.managedType.typeConstructor, user).then(doneCallback, failCallback);
  }
}

/**
 * Change the password of a user, which will be identified by the given token from the reset password e-mail
 *
 * @see resetPassword
 * @param {string} token Token from the reset password e-mail
 * @param {string} newPassword New password of the user
 * @param {boolean|UserFactory.LoginOption} [loginOption=true]
 * The default keeps the user logged in over multiple sessions
 * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name newPassword
 * @memberOf UserFactory.prototype
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
 * @param {boolean|UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
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
 * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithGoogle
 * @memberOf UserFactory.prototype
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
 * @param {boolean|UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
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
 * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithFacebook
 * @memberOf UserFactory.prototype
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
 * @param {boolean|UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over*
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
 * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithGitHub
 * @memberOf UserFactory.prototype
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
 * @param {boolean|UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
 * multiple sessions
 * @param {string} [options.title="Login"] sets the title of the popup window
 * @param {number} [options.width=740] defines the width of the popup window
 * @param {number} [options.height=730] defines the height of the popup window
 * @param {number} [options.timeout=5 * 60 * 1000]
 * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode,
  i.e. this site is
   * closed to open the providers login page. Once the login is finished this redirect url will be opened
 * with the logged-in user's token attached.
 * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithTwitter
 * @memberOf UserFactory.prototype
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
 * @param {boolean|UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over
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
 * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
 * @param {Entity~failCallback=} failCallback Called when the operation failed.
 * @return {Promise<model.User>}
 *
 * @function
 * @name loginWithLinkedIn
 * @memberOf UserFactory.prototype
 */

/**
 * Creates a new user object
 *
 * @function
 * @name new
 * @param {Object<string, *>} properties Additional properties which will be applied to the created instance
 * @return {model.User} A new created user
 * @memberOf UserFactory.prototype
 */


['Google', 'Facebook', 'GitHub', 'Twitter', 'LinkedIn'].forEach((name) => {
  const methodName = 'loginWith' + name;
  // do not use a lambda here since we will loose the this context
  UserFactory.prototype[methodName] = function (clientID, options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this[methodName](clientID, {}, options, doneCallback);
    }

    const opt = Object.assign({}, UserFactory.DefaultOptions[name.toLowerCase()], options || {});

    return this.db.loginWithOAuth(name, clientID, opt).then(doneCallback, failCallback);
  };
});
