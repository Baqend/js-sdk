var hmac = require('./util').hmac;

/**
 * @class baqend.util.TokenStorage
 */
class TokenStorage {
  constructor() {
    /**
     * The actual token storage
     * @type Object<String,String>
     */
    this.tokens = {};
  }

  /**
   * Get the stored token for the given origin
   * @param {string} origin The origin of the token
   * @returns {string} The token or undefined, if no token is available for the origin
   */
  get(origin) {
    return this.tokens[origin] || null;
  }

  /**
   * Update the token for the givin origin
   * @param {string} origin The origin of the token
   * @param {string|null} token The token to store, <code>null</code> to remove the token
   */
  update(origin, token) {
    if (token) {
      this.tokens[origin] = token;
    } else {
      delete this.tokens[origin];
    }
  }

  /**
   * Derived a resource token from the the stored origin token for the resource
   * @param {string} origin The origin of the token which is used to drive the resource token from
   * @param {string} resource The resource which will be accessible with the returned token
   * @returns {String} A resource token which can only be used to access the specified resource
   */
  createResourceToken(origin, resource) {
    var token = this.get(origin);
    if (token) {
      var data = token.substring(0, token.length - 40);
      var sig = token.substring(data.length);
      return data + hmac(resource + data, sig);
    }
    return null;
  }
}

TokenStorage.GLOBAL = new TokenStorage();

try {
  if (typeof localStorage != "undefined") {
    TokenStorage.WEB_STORAGE = new (class WebStorage extends TokenStorage {
      get(origin) {
        return sessionStorage.getItem('BAT:' + origin) || localStorage.getItem('BAT:' + origin);
      }
      update(origin, token, useLocalStorage) {
        if (useLocalStorage === undefined)
          useLocalStorage = typeof localStorage.getItem('BAT:' + origin) == "string";

        var webStorage = useLocalStorage? localStorage: sessionStorage;
        if (typeof token === "string") {
          webStorage.setItem('BAT:' + origin, token);
        } else {
          webStorage.removeItem('BAT:' + origin);
        }
      }
    });
  }
} catch (e) {
  //firefox throws an exception if we try to access the localStorage while cookies are disallowed
}

module.exports = TokenStorage;