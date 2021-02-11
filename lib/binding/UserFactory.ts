import { EntityFactory } from './EntityFactory';
import type * as model from '../model';

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
  public get LoginOption() {
    return LoginOption;
  }

  /**
   * @property oauth default properties
   * @property google default oauth properties for Google
   * @property facebook default oauth properties for Facebook
   * @property github default oauth properties for GitHub
   * @property twitter default oauth properties for Twitter
   * @property linkedin default oauth properties for LinkedIn
   * @property {Object} oauth.salesforce default oauth properties for Salesforce
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
    salesforce: {
      width: 585,
      height: 545,
      scope: 'email',
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
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return The created user object, for the new registered user.
   */
  register(user: string | model.User, password: string, loginOption?: boolean | LoginOption | Function,
    doneCallback?: any, failCallback?: any): Promise<model.User> {
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
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  login(username: string, password: string, loginOption?: boolean | LoginOption | Function, doneCallback?: any,
    failCallback?: any): Promise<model.User> {
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
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  loginWithToken(token: string, loginOption?: boolean | LoginOption | Function, doneCallback?: any,
    failCallback?: any): Promise<model.User> {
    if (loginOption instanceof Function) {
      return this.loginWithToken(token, true, loginOption, doneCallback);
    }

    this.db.token = token;
    return this.db.renew(loginOption).then(doneCallback, failCallback);
  }

  /**
   * Log out the current logged in user and ends the active user session
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  logout(doneCallback?: any, failCallback?: any): Promise<any> {
    return this.db.logout().then(doneCallback, failCallback);
  }

  /**
   * Change the password of the given user
   *
   * @param username Username to identify the user
   * @param password Current password of the user
   * @param newPassword New password of the user
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  newPassword(username: string, password: string, newPassword: string, doneCallback?: any,
    failCallback?: any): Promise<model.User>;

  /**
   * Change the password of a user, which will be identified by the given token from the reset password e-mail
   *
   * @see resetPassword
   * @param token Token from the reset password e-mail
   * @param newPassword New password of the user
   * @param [loginOption=true]
   * The default keeps the user logged in over multiple sessions
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  newPassword(token: string, newPassword: string, loginOption?: boolean | LoginOption, doneCallback?: any,
    failCallback?: any): Promise<model.User>;

  newPassword(...args: any[]): Promise<model.User> {
    // detect signature newPassword(token, newPassword, [loginOption=true][, doneCallback[, failCallback]])
    if (typeof args[2] === 'string') {
      const [username, password, newPassword, doneCallback, failCallback] = args as [string, string, string, any, any];
      return this.db.newPassword(username, password, newPassword).then(doneCallback, failCallback);
    }

    // eslint-disable-next-line prefer-const
    let [token, newPassword, loginOption, doneCallback, failCallback] = args as [
      string, string, undefined | boolean | LoginOption | Function, any, any];
    if (loginOption instanceof Function) {
      failCallback = doneCallback;
      doneCallback = loginOption;
      loginOption = true;
    }

    return this.db.newPasswordWithToken(token, newPassword, loginOption).then(doneCallback, failCallback);
  }

  /**
   * Sends an email with a link to reset the password for the given username
   *
   * The username must be a valid email address.
   *
   * @param username Username (email) to identify the user
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  resetPassword(username: string, doneCallback?: any, failCallback?: any): Promise<any> {
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
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  changeUsername(username: string, newUsername: string, password: string, doneCallback?: any,
    failCallback?: any): Promise<any> {
    return this.db.changeUsername(username, newUsername, password).then(doneCallback, failCallback);
  }

  /**
   * Requests a perpetual token for the given user
   *
   * Only users with the admin role are allowed to request an API token.
   *
   * @param user The user object or id of the user object
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  requestAPIToken(user: model.User, doneCallback?: any, failCallback?: any): Promise<any> {
    return this.db.requestAPIToken(this.managedType.typeConstructor, user).then(doneCallback, failCallback);
  }

  /**
   * Revoke all created tokens for the given user
   *
   * This method will revoke all previously issued tokens and the user must login again.
   *
   * @param user The user object or id of the user object
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  revokeAllTokens(user: model.User, doneCallback?: any, failCallback?: any): Promise<any> {
    return this.db.revokeAllTokens(this.managedType.typeConstructor, user).then(doneCallback, failCallback);
  }
}

export interface UserFactory extends EntityFactory<model.User> {
  /**
   * Logs the user in with Google via OAuth
   *
   * Prompts the user for the Google login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: <code>https://example.net/db/User/OAuth/google</code> and copy the
   * client id and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is
   * logged in.
   *
   * @param clientID
   * @param options
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  loginWithGoogle(clientID: string, options: OAuthOptions, doneCallback?: any, failCallback?: any): Promise<model.User>;

  /**
   * Logs the user in with Facebook via OAuth
   *
   * Prompts the user for the Facebook login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/facebook and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param clientID
   * @param options
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  loginWithFacebook(clientID: string, options: OAuthOptions, doneCallback?: any,
    failCallback?: any): Promise<model.User>;

  /**
   * Logs the user in with GitHub via OAuth
   *
   * Prompts the user for the GitHub login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/github and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param clientID
   * @param options
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  loginWithGitHub(clientID: string, options: OAuthOptions, doneCallback?: any, failCallback?: any): Promise<model.User>;

  /**
   * Logs the user in with Twitter via OAuth
   *
   * Prompts the user for the Twitter login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/twitter and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param clientID
   * @param options
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  loginWithTwitter(clientID: string, options: OAuthOptions, doneCallback?: any,
    failCallback?: any): Promise<model.User>;

  /**
   * Logs the user in with LinkedIn via OAuth
   *
   * Prompts the user for the LinkedIn login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/linkedin and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param clientID
   * @param options
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  loginWithLinkedIn(clientID: string, options: OAuthOptions, doneCallback?: any,
    failCallback?: any): Promise<model.User>;

  /**
   * Logs the user in with Salesforce via OAuth
   *
   * Prompts the user for the Salesforce login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: <code>https://example.net/db/User/OAuth/salesforce</code> and copy the
   * client id and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is
   * logged in.
   *
   * @param clientID
   * @param options
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  loginWithSalesforce(clientID: string, options: OAuthOptions, doneCallback?: any,
    failCallback?: any): Promise<model.User>;

  /**
   * Creates a new user object
   *
   * @param properties Additional properties which will be applied to the created instance
   * @return A new created user
   */
  new(properties?: {[property: string]: any}): model.User;
}

export interface OAuthOptions {
  /**
   * UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   */
  loginOption?: boolean;
  /**
   *  [title="Login"] sets the title of the popup window
   */
  title?: string;
  /**
   *  [width=585] defines the width of the popup window
   */
  width?: number;
  /**
   *  [height=545] defines the height of the popup window
   */
  height?: number;
  /**
   *  [scope="email"] the range of rights requested from the user
   */
  scope?: string;
  /**
   *  [state=]
   */
  state?: Object;
  /**
   *  [timeout=5 * 60 * 1000]
   */
  timeout?: number;
  /**
   * [redirect=""] if set this changes the oauth behaviour to redirect mode,
   * i.e. this site is closed to open the providers login page.
   * Once the login is finished this redirect url will be opened with the logged-in user's token attached.
   */
  redirect?: string;

  /**
   * The OAuth login endpoint of the salesforce server
   */
  path?: string;
}

['Google', 'Facebook', 'GitHub', 'Twitter', 'LinkedIn', 'Salesforce'].forEach((name) => {
  const methodName = `loginWith${name}`;
  // do not use a lambda here since we will loose the this context
  (UserFactory.prototype as any)[methodName] = function loginWithOAuth(clientID: string,
    options: OAuthOptions | Function, doneCallback?: any, failCallback?: any) {
    if (options instanceof Function) {
      return this[methodName](clientID, {}, options, doneCallback);
    }

    const opt = { ...(UserFactory.DefaultOptions as any)[name.toLowerCase()], ...options || {} };

    return this.db.loginWithOAuth(name, clientID, opt).then(doneCallback, failCallback);
  };
});
