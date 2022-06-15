export type Version = { ETag:string, body:string };
export const versionCache = new Map<string, Version>();
