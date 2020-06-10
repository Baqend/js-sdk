'use strict';

import { enumerable } from "../util/enumerable";
import { Entity } from "./Entity";
import { model } from "../model";
import { JsonMap } from "../util";

export class User extends Entity {
  /**
   * The users username or email address
   */
  public username : string | null = null;

  /**
   * Indicates if the user is currently inactive, which disallow user login
   */
  public inactive : boolean | null = null;

  /**
   * Change the password of the given user
   *
   * @param currentPassword Current password of the user
   * @param password New password of the user
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  @enumerable(false)
  newPassword(currentPassword: string, password: string, doneCallback?, failCallback?): Promise<model.User> {
    return this._metadata.db.newPassword(this.username, currentPassword, password).then(doneCallback, failCallback);
  }

  /**
   * Change the username of the current user
   *
   * @param newUsername New username for the current user
   * @param password The password of the current user
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  @enumerable(false)
  changeUsername(newUsername: string, password: string, doneCallback?, failCallback?): Promise<any> {
    return this._metadata.db.changeUsername(this.username, newUsername, password).then(doneCallback, failCallback);
  }

  /**
   * Requests a perpetual token for the user
   *
   * Only users with the admin role are allowed to request an API token.
   *
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return
   */
  @enumerable(false)
  requestAPIToken(doneCallback?, failCallback?): Promise<JsonMap> {
    return this._metadata.db.requestAPIToken(this.constructor, this).then(doneCallback, failCallback);
  }
}
