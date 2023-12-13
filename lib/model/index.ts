import * as binding from '../binding';

/**
 * Users are representations of people using the app.
 */
export interface User extends binding.User {}

/**
 * Roles are aggregations of multiple Users with a given purpose.
 */
export interface Role extends binding.Role {}

/**
 * Devices are connected to the app to be contactable.
 */
export interface Device extends binding.Entity {}

