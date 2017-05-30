import {Observable, Subscription} from 'rxjs';

export type json = Object|Array<any>;

export interface Class<T> {
    new(...args: Array<any>): T;
}

export let db:baqend;
export default db;


