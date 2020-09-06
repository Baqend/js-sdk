import { db } from './baqend';

export * as binding from './binding';
export * as connector from './connector';
export * as error from './error';
export * as message from './message';
export * as metamodel from './metamodel';
export * as util from './util';
export * as intersection from './intersection';
export * as caching from './caching';
export * as query from './query';
export * as partialupdate from './partialupdate';
export * as model from './model';

export { EntityManagerFactory, ConnectData } from './EntityManagerFactory';
export { EntityManager } from './EntityManager';
export { Acl } from './Acl';
export { GeoPoint } from './GeoPoint';
export { db, baqend } from './baqend';
export { connect, configure } from './deperecated-exports';

const SetType = Set;
const MapType = Map;
const ListType = Array;

export { SetType as Set, ListType as List, MapType as Map };

// Use one global default export of this module
// eslint-disable-next-line import/no-default-export
export default db;
