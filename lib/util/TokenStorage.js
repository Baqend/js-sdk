"use strict";

const hmac = require('./hmac').hmac;

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
   * Parse a token string in its components
   * @param {string} token The token string to parse, time values are returned as timestamps
   * @return {{data: string, createdAt: int, expireAt: int, sig: string}}
   */
  static parse(token) {
    return {
      val: token,
      createdAt: parseInt(token.substring(0, 8), 16) * 1000,
      expireAt: parseInt(token.substring(8, 16), 16) * 1000,
      sig: token.substring(token.length - 40),
      data: token.substring(0, token.length - 40)
    };
  }

  /**
   * Get the stored token
   * @return {string} The token or undefined, if no token is available
   */
  get token() {
    return this._token? this._token.val: null;
  }

  static create(origin) {
    return Promise.resolve(new TokenStorage(origin));
  }

  /**
   * @param {string} origin The origin where the token belongs to
   * @param {string} token The initial token
   * @param {boolean=} temporary If the token should be saved temporary or permanently
   */
  constructor(origin, token, temporary) {
    /**
     * The actual stored token
     */
    this._token = token? TokenStorage.parse(token): null;
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
   * @return {void}
   * @protected
   * @abstract
   */
  _saveToken(origin, token, temporary) {}

  /**
   * Update the token for the givin origin, the operation may be asynchronous
   * @param {String} token The token to store or <code>null</code> to remove the token
   * @return {void}
   */
  update(token) {
    const t = token? TokenStorage.parse(token): null;
    if (this._token && t && this._token.expireAt > t.expireAt) {
      //an older token was fetched from the cache, so ignore it
      return;
    }

    this._token = t;
    this._saveToken(this._origin, token, this.temporary);
  }

  /**
   * Derived a resource token from the the stored origin token for the resource and signs the resource with the
   * generated resource token
   * @param {string} resource The resource which will be accessible with the returned token
   * @return {string} A resource token which can only be used to access the specified resource
   */
  signPath(resource) {
    if (this._token) {
      const path = resource.split('/').map(encodeURIComponent).join('/');
      return path + '?BAT=' + (this._token.data + hmac(path + this._token.data, this._token.sig));
    }
    return resource;
  }
}

const tokens = {};
/**
 * @ignore
 */
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

/**
 * @ignore
 */
class WebStorage extends TokenStorage {
  static isAvailable() {
    try {
      //firefox throws an exception if cookies are disabled
      if (typeof localStorage === 'undefined') {
        return false;
      }

      localStorage.setItem('bq_webstorage_test', 'bq');
      localStorage.removeItem('bq_webstorage_test');
      return true;
    } catch (e) {}
    return false;
  }

  static create(origin) {
    let temporary = false;
    let token = localStorage.getItem('BAT:' + origin);

    if (!token && typeof sessionStorage !== 'undefined') {
      token = sessionStorage.getItem('BAT:' + origin);
      temporary = !!token;
    }

    return Promise.resolve(new WebStorage(origin, token, temporary));
  }

  /**
   * @inheritDoc
   */
  _saveToken(origin, token, temporary) {
    const webStorage = temporary? sessionStorage: localStorage;
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
