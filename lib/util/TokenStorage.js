'use strict';

const hmac = require('./hmac').hmac;
const deprectated = require('./deprecated');

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
      data: token.substring(0, token.length - 40),
    };
  }

  /**
   * Get the stored token
   * @returns {string} The token or undefined, if no token is available
   */
  get token() {
    return this.tokenData ? this.tokenData.val : null;
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
    this.tokenData = token ? TokenStorage.parse(token) : null;
    this.origin = origin;
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
  saveToken(origin, token, temporary) {
    console.log('Using deprecated TokenStorage._saveToken implementation.');
    this._saveToken(origin, token, temporary);
  }

  /**
   * Use the underlying storage implementation to save the token
   * @param {string} origin The origin where the token belongs to
   * @param {string} token The initial token
   * @param {boolean} temporary If the token should be saved temporary or permanently
   * @deprecated Use TokenStorage#saveToken instead
   * @protected
   * @abstract
   */
  _saveToken(origin, token, temporary) {} // eslint-disable-line no-unused-vars

  /**
   * Update the token for the givin origin, the operation may be asynchronous
   * @param {String} token The token to store or <code>null</code> to remove the token
   */
  update(token) {
    const t = token ? TokenStorage.parse(token) : null;
    if (this.tokenData && t && this.tokenData.expireAt > t.expireAt) {
      // an older token was fetched from the cache, so ignore it
      return;
    }

    this.tokenData = t;
    this.saveToken(this.origin, token, this.temporary);
  }

  /**
   * Derived a resource token from the the stored origin token for the resource and signs the resource with the
   * generated resource token
   * @param {string} resource The resource which will be accessible with the returned token
   * @returns {string} A resource token which can only be used to access the specified resource
   */
  signPath(resource) {
    if (this.tokenData) {
      const path = resource.split('/').map(encodeURIComponent).join('/');
      return path + '?BAT=' + (this.tokenData.data + hmac(path + this.tokenData.data, this.tokenData.sig));
    }
    return resource;
  }
}

deprectated(TokenStorage.prototype, '_token', 'tokenData');
deprectated(TokenStorage.prototype, '_origin', 'origin');

const tokens = {};

/**
 * @ignore
 */
class GlobalStorage extends TokenStorage {
  /**
   * Creates a global token storage instance for the given origin
   * A global token storage use a global variable to store the actual origin tokens
   * @param origin
   * @return {Promise.<GlobalStorage>}
   */
  static create(origin) {
    return Promise.resolve(new GlobalStorage(origin, tokens[origin]));
  }

  /**
   * @inheritDoc
   */
  saveToken(origin, token, temporary) {
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
      // firefox throws an exception if cookies are disabled
      if (typeof localStorage === 'undefined') {
        return false;
      }

      localStorage.setItem('bq_webstorage_test', 'bq');
      localStorage.removeItem('bq_webstorage_test');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Creates a global web storage instance for the given origin
   * A web token storage use the localStorage or sessionStorage to store the origin tokens
   * @param origin
   * @return {Promise.<WebStorage>}
   */
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
  saveToken(origin, token, temporary) {
    const webStorage = temporary ? sessionStorage : localStorage;
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
