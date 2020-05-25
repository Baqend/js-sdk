'use strict';

import { deprecated } from "./deprecated";
import { Metadata } from "./Metadata";
import { model } from "../model";
import { JsonMap } from "./Json";

export type TrustedEntity = model.User | model.Role | string;

/**
 * An aggregation of access rules for given object metadata.
 */
export class Permission {
  static readonly BASE_PERMISSIONS = ['load', 'update', 'delete', 'query', 'insert'];

  public rules: {[ref: string]: string} = {};
  private _metadata: Metadata | null;

  /**
   * Creates a new Permission object, with an empty rule set
   * @param {Metadata=} metadata The metadata of the object
   */
  constructor(metadata?: Metadata) {
    this._metadata = metadata || null;
  }

  /**
   * Returns a list of user and role references of all rules
   * @return {Array<string>} a list of references
   */
  allRules() {
    return Object.keys(this.rules);
  }

  /**
   * Removes all rules from this permission object
   * @return {void}
   */
  clear() {
    if (this._metadata) {
      this._metadata.writeAccess();
    }

    this.rules = {};
  }

  /**
   * Copies permissions from another permission object
   * @param {Permission} permission The permission to copy from
   * @return {Permission}
   */
  copy(permission) {
    if (this._metadata) {
      this._metadata.writeAccess();
    }

    this.rules = { ...permission.rules };
    return this;
  }

  /**
   * Gets whenever all users and roles have the permission to perform the operation
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicAllowed(): boolean {
    if ('*' in this.rules) {
      return false;
    }

    return !this.allRules().some(ref => this.rules[ref] === 'allow');
  }

  /**
   * Sets whenever all users and roles should have the permission to perform the operation
   *
   * Note: All other allow rules will be removed.
   *
   * @return {void}
   */
  setPublicAllowed() {
    if (this._metadata) {
      this._metadata.writeAccess();
    }

    this.allRules().forEach((ref) => {
      if (this.rules[ref] === 'allow') {
        delete this.rules[ref];
      }
    });
  }

  /**
   * Returns the actual rule of the given user or role.
   * @param userOrRole The user or role to check for
   * @return {string} The actual access rule or undefined if no rule was found
   */
  getRule(userOrRole: TrustedEntity) {
    return this.rules[this.ref(userOrRole)];
  }

  /**
   * Checks whenever the user or role is explicit allowed to perform the operation.
   *
   * @param userOrRole The user or role to check for
   * @return {boolean} <code>true</code> If the given user or role is allowed
   */
  isAllowed(userOrRole: TrustedEntity) {
    return this.rules[this.ref(userOrRole)] === 'allow';
  }

  /**
   * Checks whenever the user or role is explicit denied to perform the operation.
   *
   * @param userOrRole The user or role to check for
   * @return {boolean} <code>true</code> If the given user or role is denied
   */
  isDenied(userOrRole: TrustedEntity) {
    return this.rules[this.ref(userOrRole)] === 'deny';
  }

  /**
   * Allows the given users or rules to perform the operation
   * @param userOrRole The users or roles to allow
   * @return {Permission} this permission object
   */
  allowAccess(...userOrRole: TrustedEntity[]) {
    if (this._metadata) {
      this._metadata.writeAccess();
    }

    for (let i = 0; i < userOrRole.length; i += 1) {
      this.rules[this.ref(userOrRole[i])] = 'allow';
    }

    return this;
  }

  /**
   * Denies the given users or rules to perform the operation
   * @param userOrRole The users or roles to deny
   * @return {Permission} this permission object
   */
  denyAccess(...userOrRole: TrustedEntity[]) {
    if (this._metadata) {
      this._metadata.writeAccess();
    }

    for (let i = 0; i < userOrRole.length; i += 1) {
      this.rules[this.ref(userOrRole[i])] = 'deny';
    }

    return this;
  }

  /**
   * Deletes any allow/deny rules for the given users or roles
   * @param userOrRole The users or roles to delete rules for
   * @return {Permission} this permission object
   */
  deleteAccess(...userOrRole: TrustedEntity[]) {
    if (this._metadata) {
      this._metadata.writeAccess();
    }

    for (let i = 0; i < userOrRole.length; i += 1) {
      delete this.rules[this.ref(userOrRole[i])];
    }

    return this;
  }

  /**
   * A Json representation of the set of rules
   * @return {json}
   */
  toJSON(): JsonMap {
    return { ...this.rules };
  }

  /**
   * Sets the permission rules from json
   * @param json The permission json representation
   * @return
   */
  fromJSON(json: JsonMap) {
    this.rules = json as {[ref: string]: string};
  }

  /**
   * Creates a permission from the given rules.
   * @param json The rules.
   * @return The permission.
   */
  static fromJSON(json: JsonMap): Permission {
    const permission = new this();
    permission.fromJSON(json);
    return permission;
  }

  /**
   * Resolves user and role references and validate given references
   * @param userOrRole The user, role or reference
   * @return {string} The resolved and validated reference
   */
  private ref(userOrRole: TrustedEntity): string {
    const ref = typeof userOrRole === 'string' ? userOrRole : userOrRole.id!;

    if (ref.indexOf('/db/User/') === 0 || ref.indexOf('/db/Role/') === 0) {
      return ref;
    }

    throw new TypeError('The given object isn\'t a user, role or a valid reference.');
  }
}

deprecated(Permission.prototype, '_rules', 'rules');

