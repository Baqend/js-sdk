import { Observable, Subscription } from 'rxjs';

/**
 * The global JSON type.
 */
export type json = object | any[];

/**
 * A generic class type.
 */
export interface Class<T> {
    new(...args: Array<any>): T;
}

/**
 * The global DB object to use.
 */
export const db: baqend;

export default db;
