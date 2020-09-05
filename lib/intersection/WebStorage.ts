import { TokenStorage } from './TokenStorage';

/**
 * @ignore
 */
export class WebStorage extends TokenStorage {
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
    let token = localStorage.getItem(`BAT:${origin}`);

    if (!token && typeof sessionStorage !== 'undefined') {
      token = sessionStorage.getItem(`BAT:${origin}`);
      temporary = !!token;
    }

    return Promise.resolve(new WebStorage(origin, token, temporary));
  }

  /**
   * @inheritDoc
   */
  saveToken(origin: string, token: string | null, temporary: boolean) {
    const webStorage = temporary ? sessionStorage : localStorage;
    if (token) {
      webStorage.setItem(`BAT:${origin}`, token);
    } else {
      webStorage.removeItem(`BAT:${origin}`);
    }
  }
}

if (WebStorage.isAvailable()) {
  TokenStorage.WEB_STORAGE = WebStorage;
}
