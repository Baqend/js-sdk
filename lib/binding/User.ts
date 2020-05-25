'use strict';

import { enumerable } from "../util/enumerable";
import { Entity } from "./Entity";

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
   * @param {string} currentPassword Current password of the user
   * @param {string} password New password of the user
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   */
  @enumerable(false)
  newPassword(currentPassword, password, doneCallback, failCallback) {
    return this._metadata.db.newPassword(this.username, currentPassword, password).then(doneCallback, failCallback);
  }

  /**
   * Change the username of the current user
   *
   * @param {string} newUsername New username for the current user
   * @param {string} password The password of the current user
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  @enumerable(false)
  changeUsername(newUsername, password, doneCallback, failCallback) {
    return this._metadata.db.changeUsername(this.username, newUsername, password).then(doneCallback, failCallback);
  }

  /**
   * Requests a perpetual token for the user
   *
   * Only users with the admin role are allowed to request an API token.
   *
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  @enumerable(false)
  requestAPIToken(doneCallback, failCallback) {
    return this._metadata.db.requestAPIToken(this.constructor, this).then(doneCallback, failCallback);
  }
}
