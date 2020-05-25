'use strict';

import { model } from "../model";
import { User } from "./User";
import { Entity } from "./Entity";
import { enumerable } from "../util/enumerable";

export class Role extends Entity {
  /**
   * A set of users which have this role
   */
  public users: Set<model.User> | null = null;

  /**
   * The name of the role
   */
  public name: string | null = null;

  /**
   * Test if the given user has this role
   * @param user The user to check
   * @return <code>true</code> if the given user has this role,
   * otherwise <code>false</code>
   */
  @enumerable(false)
  hasUser(user: model.User): boolean {
    return !!this.users && this.users.has(user);
  }

  /**
   * Add the given user to this role
   * @param user The user to add
   */
  @enumerable(false)
  addUser(user: model.User): void {
    if (user instanceof User) {
      if (!this.users) {
        this.users = new Set();
      }

      this.users.add(user);
    } else {
      throw new Error('Only user instances can be added to a role.');
    }
  }

  /**
   * Remove the given user from this role
   * @param user The user to remove
   */
  @enumerable(false)
  removeUser(user: model.User): void {
    if (user instanceof User) {
      if (this.users) {
        this.users.delete(user);
      }
    } else {
      throw new Error('Only user instances can be removed from a role.');
    }
  }
}