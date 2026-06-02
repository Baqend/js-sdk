import type * as model from '../model';
import type { JsonMap } from '../util';

export type TrustedEntity = model.User | model.Role | string;
export type BasePermission = ['load', 'update', 'delete', 'query', 'insert'];

/**
 * An aggregation of access rules for given object metadata.
 */
export class Permission {
  static readonly BASE_PERMISSIONS: BasePermission = ['load', 'update', 'delete', 'query', 'insert'];

  public rules: { [ref: string]: string } = {};

  /**
   * Returns a list of user and role references of all rules
   * @return a list of references
   */
  allRules(): string[] {
    return Object.keys(this.rules);
  }

  /**
   * Removes all rules from this permission object
   * @return
   */
  clear(): void {
    this.rules = {};
  }

  /**
   * Copies permissions from another permission object
   * @param permission The permission to copy from
   * @return
   */
  copy(permission: Permission): Permission {
    this.rules = { ...permission.rules };
    return this;
  }

  /**
   * Gets whenever all users and roles have the permission to perform the operation
   *
   * Public access is expressed explicitly by the wildcard allow rule
   * (`{'*': 'allow'}`). For backwards compatibility an empty rule set (no
   * allow rules at all) is still treated as public, matching object/file
   * instance ACLs and pre-migration server payloads. A wildcard deny rule
   * (`{'*': 'deny'}`) or any specific allow rule means access is not public.
   *
   * @return <code>true</code> If public access is allowed
   */
  isPublicAllowed(): boolean {
    if (this.rules['*'] === 'deny') {
      return false;
    }

    if (this.rules['*'] === 'allow') {
      return true;
    }

    return !this.allRules().some((ref) => this.rules[ref] === 'allow');
  }

  /**
   * Sets whenever all users and roles should have the permission to perform the operation
   *
   * Public access is represented explicitly as a wildcard allow rule
   * (`{'*': 'allow'}`) so it can be distinguished from an unconfigured
   * permission (empty rules) over the wire. Any other allow rules become
   * redundant and are removed; existing deny rules are kept.
   *
   * @return
   */
  setPublicAllowed(): void {
    this.allRules().forEach((ref) => {
      if (ref !== '*' && this.rules[ref] === 'allow') {
        delete this.rules[ref];
      }
    });
    this.rules['*'] = 'allow';
  }

  /**
   * Revokes public access by removing the wildcard allow rule.
   *
   * This is the inverse of {@link setPublicAllowed}. Only the public wildcard
   * allow rule (`{'*': 'allow'}`) is removed; a wildcard deny rule
   * (`{'*': 'deny'}`) and all user/role specific rules are left untouched. If no
   * allow rules remain afterwards the permission serializes as omitted, so the
   * server applies its default unless access is granted to specific users/roles.
   *
   * @return
   */
  revokePublic(): void {
    if (this.rules['*'] === 'allow') {
      delete this.rules['*'];
    }
  }

  /**
   * Returns the actual rule of the given user or role.
   * @param userOrRole The user or role to check for
   * @return The actual access rule or undefined if no rule was found
   */
  getRule(userOrRole: TrustedEntity): string {
    return this.rules[this.ref(userOrRole)];
  }

  /**
   * Checks whenever the user or role is explicit allowed to perform the operation.
   *
   * @param userOrRole The user or role to check for
   * @return <code>true</code> If the given user or role is allowed
   */
  isAllowed(userOrRole: TrustedEntity): boolean {
    return this.rules[this.ref(userOrRole)] === 'allow';
  }

  /**
   * Checks whenever the user or role is explicit denied to perform the operation.
   *
   * @param userOrRole The user or role to check for
   * @return <code>true</code> If the given user or role is denied
   */
  isDenied(userOrRole: TrustedEntity): boolean {
    return this.rules[this.ref(userOrRole)] === 'deny';
  }

  /**
   * Allows the given users or rules to perform the operation
   * @param userOrRole The users or roles to allow
   * @return this permission object
   */
  allowAccess(...userOrRole: TrustedEntity[]): Permission {
    for (let i = 0; i < userOrRole.length; i += 1) {
      this.rules[this.ref(userOrRole[i])] = 'allow';
    }

    return this;
  }

  /**
   * Denies the given users or rules to perform the operation
   * @param userOrRole The users or roles to deny
   * @return this permission object
   */
  denyAccess(...userOrRole: TrustedEntity[]): Permission {
    for (let i = 0; i < userOrRole.length; i += 1) {
      this.rules[this.ref(userOrRole[i])] = 'deny';
    }

    return this;
  }

  /**
   * Deletes any allow/deny rules for the given users or roles
   * @param userOrRole The users or roles to delete rules for
   * @return this permission object
   */
  deleteAccess(...userOrRole: TrustedEntity[]): Permission {
    for (let i = 0; i < userOrRole.length; i += 1) {
      delete this.rules[this.ref(userOrRole[i])];
    }

    return this;
  }

  /**
   * A Json representation of the set of rules
   * @return A Json representation of the rules, or `undefined` when no rules
   *         are set so the key can be omitted from serialized schema JSON and
   *         server-side defaults take effect
   */
  toJSON(): JsonMap | undefined {
    if (Object.keys(this.rules).length === 0) {
      return undefined;
    }
    return { ...this.rules };
  }

  /**
   * Sets the permission rules from json
   * @param json The permission json representation
   * @return
   */
  fromJSON(json: JsonMap) {
    this.rules = { ...json } as { [ref: string]: string };
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
   * @return The resolved and validated reference
   */
  private ref(userOrRole: TrustedEntity): string {
    const ref = typeof userOrRole === 'string' ? userOrRole : userOrRole.id!;

    if (ref.indexOf('/db/User/') === 0 || ref.indexOf('/db/Role/') === 0) {
      return ref;
    }

    throw new TypeError('The given object isn\'t a user, role or a valid reference.');
  }
}
