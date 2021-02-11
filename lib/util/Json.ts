export type Json = boolean | number | string | null | JsonArray | JsonMap;
export interface JsonMap { [key: string]: Json; }
export interface JsonArray extends Array<Json> {}

export type JsonSerializable = {
  toJSON(): JsonLike
};

export type JsonLike = boolean | number | string | null | JsonSerializable | Array<JsonLike> | { [P in any]: JsonLike };
