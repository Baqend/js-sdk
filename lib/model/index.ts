import * as binding from '../binding';

/**
 * Users are representations of people using the app.
 */
export type User = binding.User

/**
 * Roles are aggregations of multiple Users with a given purpose.
 */
export type Role = binding.Role

/**
 * Devices are connected to the app to be contactable.
 */
export type Device = binding.Entity
