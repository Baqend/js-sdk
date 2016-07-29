declare type json = Object|Array<any>;

declare interface Class<T> {
    new(...args: Array<any>): T;
}

export let db:baqend;
export default db;


