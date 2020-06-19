'use strict';

import { Permission, TrustedEntity, Metadata } from "./intersection";
import { Json, JsonMap } from "./util";

/**
 * Creates a new Acl object, with an empty rule set for an object
 */
export class Acl {
  /**
   * The read permission of the object
   */
  readonly read: Permission;
  /**
   * The write permission of the object
   */
  readonly write: Permission;

  /**
   * @param metadata the metadata of the object, null for files
   */
  constructor(metadata?: Metadata) {
    this.read = new Permission(metadata);
    this.write = new Permission(metadata);
  }

  /**
   * Removes all acl rules, read and write access is public afterwards
   *
   * @return
   **/
  clear(): void {
    this.read.clear();
    this.write.clear();
  }

  /**
   * Copies permissions from another ACL
   *
   * @param acl The ACL to copy from
   * @return
   */
  copy(acl: Acl): this {
    this.read.copy(acl.read);
    this.write.copy(acl.write);
    return this;
  }

  /**
   * Gets whenever all users and roles have the permission to read the object
   *
   * @return <code>true</code> If public access is allowed
   */
  isPublicReadAllowed(): boolean {
    return this.read.isPublicAllowed();
  }

  /**
   * Sets whenever all users and roles should have the permission to read the object
   *
   * Note: All other allow read rules will be removed.
   *
   * @return
   **/
  setPublicReadAllowed(): void {
    return this.read.setPublicAllowed();
  }

  /**
   * Checks whenever the user or role is explicit allowed to read the object
   *
   * @param userOrRole The user or role to check for
   * @return <code>true</code> if read access is explicitly allowed for the given user or role
   */
  isReadAllowed(userOrRole: TrustedEntity): boolean {
    return this.read.isAllowed(userOrRole);
  }

  /**
   * Checks whenever the user or role is explicit denied to read the object
   *
   * @param userOrRole The user or role to check for
   * @return <code>true</code> if read access is explicitly denied for the given user or role
   */
  isReadDenied(userOrRole: TrustedEntity): boolean {
    return this.read.isDenied(userOrRole);
  }

  /**
   * Allows the given user or rule to read the object
   *
   * @param userOrRole The user or role to allow
   * @return this acl object
   */
  allowReadAccess(...userOrRole: TrustedEntity[]): this {
    this.read.allowAccess(...userOrRole);
    return this;
  }

  /**
   * Denies the given user or rule to read the object
   *
   * @param userOrRole The user or role to deny
   * @return this acl object
   */
  denyReadAccess(...userOrRole: TrustedEntity[]): this {
    this.read.denyAccess(...userOrRole);
    return this;
  }

  /**
   * Deletes any read allow/deny rule for the given user or role
   *
   * @param userOrRole The user or role
   * @return this acl object
   */
  deleteReadAccess(...userOrRole: TrustedEntity[]): this {
    this.read.deleteAccess(...userOrRole);
    return this;
  }

  /**
   * Gets whenever all users and roles have the permission to write the object
   *
   * @return <code>true</code> If public access is allowed
   */
  isPublicWriteAllowed(): boolean {
    return this.write.isPublicAllowed();
  }

  /**
   * Sets whenever all users and roles should have the permission to write the object
   *
   * Note: All other allow write rules will be removed.
   *
   * @return
   **/
  setPublicWriteAllowed(): void {
    return this.write.setPublicAllowed();
  }

  /**
   * Checks whenever the user or role is explicit allowed to write the object
   *
   * @param userOrRole The user or role to check for
   * @return <code>true</code> if write access is explicitly allowed for the given user or role
   */
  isWriteAllowed(userOrRole: TrustedEntity): boolean {
    return this.write.isAllowed(userOrRole);
  }

  /**
   * Checks whenever the user or role is explicit denied to write the object
   *
   * @param userOrRole The user or role to check for
   * @return <code>true</code> if write access is explicitly denied for the given user or role
   */
  isWriteDenied(userOrRole: TrustedEntity): boolean {
    return this.write.isDenied(userOrRole);
  }

  /**
   * Allows the given user or rule to write the object
   *
   * @param userOrRole The user or role to allow
   * @return this acl object
   */
  allowWriteAccess(...userOrRole: TrustedEntity[]): this {
    this.write.allowAccess(...userOrRole);
    return this;
  }

  /**
   * Denies the given user or rule to write the object
   *
   * @param userOrRole The user or role to deny
   * @return this acl object
   */
  denyWriteAccess(...userOrRole: TrustedEntity[]): this {
    this.write.denyAccess(...userOrRole);
    return this;
  }

  /**
   * Deletes any write allow/deny rule for the given user or role
   *
   * @param userOrRole The user or role
   * @return this acl object
   */
  deleteWriteAccess(...userOrRole: TrustedEntity[]): this {
    this.write.deleteAccess(...userOrRole);
    return this;
  }

  /**
   * A JSON representation of the set of rules
   *
   * @return
   */
  toJSON(): JsonMap {
    return {
      read: this.read.toJSON(),
      write: this.write.toJSON(),
    };
  }

  /**
   * Sets the acl rules form JSON
   *
   * @param json The json encoded acls
   * @return
   */
  fromJSON(json: JsonMap): void {
    this.read.fromJSON(json.read as JsonMap || {});
    this.write.fromJSON(json.write as JsonMap || {});
  }
}
