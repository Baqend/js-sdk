export type Json = boolean | number | string | null | JsonArray | JsonMap;
export interface JsonMap {  [key: string]: Json; }
export interface JsonArray extends Array<Json> {}