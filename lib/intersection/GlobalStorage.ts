import { TokenStorage } from './TokenStorage';

export class GlobalStorage extends TokenStorage {
  private static tokens: { [origin: string]: string } = {};

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
