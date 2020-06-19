'use strict';

import { hmac } from "../util/hmac";
import { deprecated } from "../util/deprecated";

export interface TokenData {
   val: any;
   sig: string;
   createdAt: number;
   data: string;
   expireAt: number;
}

export interface TokenStorageFactory {
  /**
   * Creates a new tokenStorage which persist tokens for the given origin
   * @param origin The origin where the token contains to
   * @return The initialized token storage
   */
  create(origin: string): Promise<TokenStorage>
}

export class TokenStorage {
  static GLOBAL: typeof GlobalStorage;
  static WEB_STORAGE: typeof WebStorage;

  /**
   * The actual stored token
   */
  tokenData: TokenData | null;

  /**
   * The origin of the token
   */
  origin: string;

  /**
   * Indicates if the token should keep temporary only or should be persisted for later sessions
   */
  temporary: boolean;

  /**
   * Parse a token string in its components
   * @param token The token string to parse, time values are returned as timestamps
   * @return The parsed token data
   */
  static parse(token: string): TokenData {
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
   * @return The token or undefined, if no token is available
   */
  get token(): string {
    return this.tokenData ? this.tokenData.val : null;
  }

  static create(origin) {
    return Promise.resolve(new TokenStorage(origin));
  }

  /**
   * @param origin The origin where the token belongs to
   * @param token The initial token
   * @param temporary If the token should be saved temporary or permanently
   */
  constructor(origin: string, token?: string | null, temporary?: boolean) {
    this.tokenData = token ? TokenStorage.parse(token) : null;
    this.origin = origin;
    this.temporary = !!temporary;
  }

  /**
   * Use the underlying storage implementation to save the token
   * @param origin The origin where the token belongs to
   * @param token The initial token
   * @param temporary If the token should be saved temporary or permanently
   * @return
   */
  protected saveToken(origin: string, token: string | null, temporary: boolean): void {
    // eslint-disable-next-line no-underscore-dangle
    if (this._saveToken !== TokenStorage.prototype._saveToken) {
      // eslint-disable-next-line no-console
      console.log('Using deprecated TokenStorage._saveToken implementation.');
      // eslint-disable-next-line no-underscore-dangle
      this._saveToken(origin, token, temporary);
    }
  }

  /**
   * Use the underlying storage implementation to save the token
   * @param origin The origin where the token belongs to
   * @param token The initial token
   * @param temporary If the token should be saved temporary or permanently
   * @return
   * @deprecated Use TokenStorage#saveToken instead
   * @protected
   */
  protected _saveToken(origin: string, token: string | null, temporary: boolean): void {} // eslint-disable-line no-unused-vars

  /**
   * Update the token for the givin origin, the operation may be asynchronous
   * @param token The token to store or <code>null</code> to remove the token
   */
  update(token: string | null) {
    const t = token ? TokenStorage.parse(token) : null;
    if (this.tokenData && t && this.tokenData.expireAt > t.expireAt) {
      // an older token was fetched from the cache, so ignore it
      return;
    }

    this.tokenData = t;
    this.saveToken(this.origin, token, this.temporary);
  }

  /**
   * Derives a resource token from the stored origin token and signs the resource with the generated resource token
   *
   * @param resource The resource which will be accessible with the returned token
   * @return A resource token which can only be used to access the specified resource
   */
  signPath(resource: string): string {
    if (this.tokenData) {
      const path = resource.split('/').map(encodeURIComponent).join('/');
      return path + '?BAT=' + (this.tokenData.data + hmac(path + this.tokenData.data, this.tokenData.sig));
    }
    return resource;
  }
}

class GlobalStorage extends TokenStorage {
  private static tokens = {};

  /**
   * Creates a global token storage instance for the given origin
   * A global token storage use a global variable to store the actual origin tokens
   * @param origin
   * @return
   */
  static create(origin: string): Promise<GlobalStorage> {
    return Promise.resolve(new GlobalStorage(origin, GlobalStorage.tokens[origin]));
  }

  /**
   * @inheritDoc
   */
  saveToken(origin: string, token: string, temporary: boolean) {
    if (!temporary) {
      if (token) {
        GlobalStorage.tokens[origin] = token;
      } else {
        delete GlobalStorage.tokens[origin];
      }
    }
  }
}

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
   * @return
   */
  static create(origin: string): Promise<WebStorage> {
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
  TokenStorage.WEB_STORAGE = WebStorage;
}
