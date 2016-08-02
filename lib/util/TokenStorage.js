"use strict";

const hmac = require('./util').hmac;

/**
 * @interface util.TokenStorageFactory
 */

/**
 * Creates a new tokenStorage which persist tokens for the given origin
 * @param {string} origin The origin where the token contains to
 * @return {Promise<TokenStorage>} The initialized token storage
 * @name create
 * @memberOf util.TokenStorageFactory.prototype
 * @method
 */

/**
 * @alias util.TokenStorage
 */
class TokenStorage {
  /**
   * Get the stored token
   * @returns {string} The token or undefined, if no token is available
   */
  get token() {
    return this._token;
  }

  static create(origin) {
    return Promise.resolve(new TokenStorage(origin));
  }

  constructor(origin, token, temporary) {
    /**
     * The actual stored token
     */
    this._token = token || null;
    this._origin = origin;
    /**
     * Indicates if the token should keep temporary only or should be persisted for later sessions
     * @type boolean
     */
    this.temporary = temporary;
  }

  /**
   * Use the underlying storage implementation to save the token
   * @param {string} origin The origin where the token belongs to
   * @param {string} token The initial token
   * @param {boolean} temporary If the token should be saved temporary or permanently
   * @protected
   * @abstract
   */
  _saveToken(origin, token, temporary) {}

  /**
   * Update the token for the givin origin, the operation may be asynchronous
   * @param {String} token The token to store or <code>null</code> to remove the token
   */
  update(token) {
    this._token = token;
    this._saveToken(this._origin, this._token, this.temporary);
  }

  /**
   * Derived a resource token from the the stored origin token for the resource and signs the resource with the
   * generated resource token
   * @param {string} resource The resource which will be accessible with the returned token
   * @returns {string} A resource token which can only be used to access the specified resource
   */
  signPath(resource) {
    var token = this.token;
    if (token) {
      var data = token.substring(0, token.length - 40);
      var sig = token.substring(data.length);

      var path = resource.split('/').map(encodeURIComponent).join('/');
      return path + '?BAT=' + (data + hmac(resource + data, sig));
    }
    return resource;
  }
}

const tokens = {};
class GlobalStorage extends TokenStorage {

  static create(origin) {
    return Promise.resolve(new GlobalStorage(origin, tokens[origin]));
  }

  /**
   * @inheritDoc
   */
  _saveToken(origin, token, temporary) {
    if (!temporary) {
      if (token) {
        tokens[origin] = token;
      } else {
        delete tokens[origin];
      }
    }
  }
}

/**
 * @alias util.TokenStorage.GLOBAL
 * @type {util.TokenStorageFactory}
 */
TokenStorage.GLOBAL = GlobalStorage;

class WebStorage extends TokenStorage {
  static isAvailable() {
    try {
      //firefox throws an exception if cookies are disabled
      return typeof localStorage !== 'undefined';
    } catch (e) {}
    return false;
  }

  static create(origin) {
    let temporary = false;
    let token = localStorage.getItem('BAT:' + origin);
    if (!token) {
      token = sessionStorage.getItem('BAT:' + origin);
      temporary = !!token;
    }

    return Promise.resolve(new WebStorage(origin, token, temporary));
  }

  /**
   * @inheritDoc
   */
  _saveToken(origin, token, temporary) {
    var webStorage = temporary? sessionStorage: localStorage;
    if (token) {
      webStorage.setItem('BAT:' + origin, token);
    } else {
      webStorage.removeItem('BAT:' + origin);
    }
  }
}

if (WebStorage.isAvailable()) {
  /**
   * @alias util.TokenStorage.WEB_STORAGE
   * @type {util.TokenStorageFactory}
   */
  TokenStorage.WEB_STORAGE = WebStorage;
}

module.exports = TokenStorage;