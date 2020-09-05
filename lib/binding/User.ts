import { enumerable } from '../util/enumerable';
import { Entity } from './Entity';
import type * as model from '../model';
import { Class, JsonMap } from '../util';

export class User extends Entity {
  /**
   * The users username or email address
   */
  public username? : string | null;

  /**
   * Indicates if the user is currently inactive, which disallow user login
   */
  public inactive? : boolean | null;

  /**
   * Change the password of the given user
   *
   * @param currentPassword Current password of the user
   * @param password New password of the user
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  @enumerable(false)
  newPassword(currentPassword: string, password: string, doneCallback?: any, failCallback?: any): Promise<model.User> {
    return this._metadata.db.newPassword(this.username!!, currentPassword, password).then(doneCallback, failCallback);
  }

  /**
   * Change the username of the current user
   *
   * @param newUsername New username for the current user
   * @param password The password of the current user
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  @enumerable(false)
  changeUsername(newUsername: string, password: string, doneCallback?: any, failCallback?: any): Promise<any> {
    return this._metadata.db.changeUsername(this.username!!, newUsername, password).then(doneCallback, failCallback);
  }

  /**
   * Requests a perpetual token for the user
   *
   * Only users with the admin role are allowed to request an API token.
   *
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  @enumerable(false)
  requestAPIToken(doneCallback?: any, failCallback?: any): Promise<JsonMap> {
    return this._metadata.db.requestAPIToken(this.constructor as Class<model.User>, this)
      .then(doneCallback, failCallback);
  }
}
