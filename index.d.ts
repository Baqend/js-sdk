declare type json = Object|Array<any>;

declare interface Class<T> {
    new(...args: Array<any>): T;
}

export let db:baqend;
export default db;


import Lockable = util.Lockable;

export class Acl {
  constructor(metadata?: util.Metadata)
  read: util.Permission;
  write: util.Permission;
  clear(): any;
  isPublicReadAllowed(): boolean;
  setPublicReadAllowed(): any;
  isReadAllowed(userOrRole: model.User|model.Role|string): boolean;
  isReadDenied(userOrRole: model.User|model.Role|string): boolean;
  allowReadAccess(userOrRole: model.User|model.Role|string): Acl;
  denyReadAccess(userOrRole: model.User|model.Role|string): Acl;
  deleteReadAccess(userOrRole: model.User|model.Role|string): Acl;
  isPublicWriteAllowed(): boolean;
  setPublicWriteAllowed(): any;
  isWriteAllowed(userOrRole: model.User|model.Role|string): boolean;
  isWriteDenied(userOrRole: model.User|model.Role|string): boolean;
  allowWriteAccess(userOrRole: model.User|model.Role|string): Acl;
  denyWriteAccess(userOrRole: model.User|model.Role|string): Acl;
  deleteWriteAccess(userOrRole: model.User|model.Role|string): Acl;
  toJSON(): json;
  fromJSON(json: json): any;
}

export interface baqend extends EntityManager {
  connect(hostOrApp: string, secure?: boolean, doneCallback?: () => Promise<any>, failCallback?: () => Promise<any>): Promise<EntityManager>;
}

export class EntityManager extends Lockable {
  constructor(entityManagerFactory: EntityManagerFactory)
  log: util.Logger;
  _entities: Map<String, binding.Entity>;
  entityManagerFactory: EntityManagerFactory;
  metamodel: metamodel.Metamodel;
  code: util.Code;
  modules: util.Modules;
  me: model.User;
  isDeviceRegistered: boolean;
  tokenStorage: util.TokenStorage;
  bloomFilter: caching.BloomFilter;
  bloomFilterRefresh: number;
  isOpen: boolean;
  token: String;
  connected(connector: connector.Connector, connectData: Object, tokenStorage: util.TokenStorage): any;
  getReference(entityClass: Class<binding.Entity>|string, key?: string): any;
  createQueryBuilder(resultClass?: Class<any>): query.Builder<any>;
  clear(): any;
  close(): any;
  contains(entity: binding.Entity): boolean;
  containsById(entity: binding.Entity): boolean;
  detach(entity: binding.Entity): any;
  resolveDepth(entity: binding.Entity, options?: Object): Promise<binding.Entity>;
  load(entityClass: Class<binding.Entity>|string, oid: String, options?: Object): Promise<binding.Entity>;
  insert(entity: binding.Entity, options: Object): Promise<binding.Entity>;
  update(entity: binding.Entity, options: Object): Promise<binding.Entity>;
  save(entity: binding.Entity, options: Object, withoutLock?: boolean): Promise<binding.Entity>;
  optimisticSave(entity: binding.Entity, cb: Function): Promise<binding.Entity>;
  getSubEntities(entity: binding.Entity, depth: boolean|number, resolved?: Array<binding.Entity>, initialEntity?: binding.Entity): Array<binding.Entity>;
  getSubEntitiesByPath(entity: binding.Entity, path: Array<string>): Array<binding.Entity>;
  delete(entity: binding.Entity, options: Object): Promise<binding.Entity>;
  flush(): Promise<any>;
  persist(entity: binding.Entity): any;
  refresh(entity: binding.Entity, options: Object): Promise<binding.Entity>;
  attach(entity: binding.Entity): any;
  validate(entity: binding.Entity): util.ValidationResult;
  addToWhiteList(objectId: string): any;
  addToBlackList(objectId: string): any;
  ensureBloomFilterFreshness(): any;
  mustRevalidate(id: string): boolean;
  ensureCacheHeader(id: string, message: connector.Message, refresh: boolean): any;
  createURL(relativeUrl: string, authorize?: boolean): string;
  List(...args: Array<any>): void;
  Set(collection?: Iterable<any>): void;
  Map(collection?: Iterable<any>): void;
  GeoPoint(latitude?: string|number|Object|Array<number>, longitude?: number): void;
  User: binding.UserFactory;
  Role: binding.EntityFactory<model.Role>;
  Device: binding.DeviceFactory;
  [YourEntityClass: string]: any;
  File: binding.FileFactory;
}

export class EntityManagerFactory extends Lockable {
  constructor(options?: {host?: string, port?: number, secure?: boolean, basePath?: string, schema?: Object, global?: boolean, tokenStorage?: util.TokenStorage, tokenStorageFactory?: util.TokenStorageFactory, bloomFilterRefresh?: number})
  _connector: connector.Connector;
  metamodel: metamodel.Metamodel;
  code: util.Code;
  tokenStorage: util.TokenStorage;
  tokenStorageFactory: util.TokenStorageFactory;
  bloomFilterRefresh: number;
  connect(hostOrApp: string, port?: number, secure?: boolean, basePath?: string): any;
  createMetamodel(): metamodel.Metamodel;
  createEntityManager(useSharedTokenStorage?: boolean): EntityManager;
}

export class EntityTransaction {
  constructor(entityManager: EntityManager)
  begin(): any;
  commit(): any;
  getRollbackOnly(): boolean;
  rollback(): any;
  setRollbackOnly(): any;
}

export class GeoPoint {
  constructor(latitude?: string|number|Object|Array<number>, longitude?: number)
  static current(): Promise<GeoPoint>;
  kilometersTo(point: GeoPoint): number;
  milesTo(point: GeoPoint): number;
  radiansTo(point: GeoPoint): number;
  toString(): string;
  toJSON(): json;
  static EARTH_RADIUS_IN_KILOMETERS: number;
  static EARTH_RADIUS_IN_MILES: number;
}

export class GlobalStorage {
  constructor()
  _saveToken(): any;
}

export class WebStorage {
  constructor()
  _saveToken(): any;
}

export namespace binding {

  export class Accessor {
    constructor()
    getValue(object: Object, attribute: metamodel.Attribute): any;
    setValue(object: Object, attribute: metamodel.Attribute, value: any): any;
  }

  export interface DeviceFactory extends EntityFactory<model.Device> {
    register(os: string, token: string, device?: model.Device, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<any>;
    push(pushMessage: util.PushMessage, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<any>;
  }

  export class Enhancer {
    constructor()
    createProxy(superClass: Class<any>): Class<any>;
    getIdentifier(typeConstructor: Class<any>): string;
    setIdentifier(typeConstructor: Class<any>, identifier: string): any;
    enhance(type: metamodel.ManagedType, typeConstructor: Class<any>): any;
    enhancePrototype(proto: Object, type: metamodel.ManagedType): any;
    enhanceProperty(proto: Object, attribute: metamodel.Attribute): any;
  }

  export class Entity extends Managed {
    constructor(properties?: Object)
    id: string;
    key: string;
    version: number;
    acl: Acl;
    ready(doneCallback?: () => Promise<any>): Promise<binding.Entity>;
    attach(db: EntityManager): any;
    save(options?: {force?: boolean, depth?: number|boolean, refresh?: boolean}, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<binding.Entity>;
    insert(options?: {depth?: number|boolean, refresh?: boolean}, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<binding.Entity>;
    update(options?: {force?: boolean, depth?: number|boolean, refresh?: boolean}, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<binding.Entity>;
    load(options?: {depth?: number|boolean, refresh?: boolean}, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<binding.Entity>;
    delete(options?: {force?: boolean, depth?: number|boolean}, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<binding.Entity>;
    optimisticSave(cb: Function, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<binding.Entity>;
    validate(): util.ValidationResult;
    toJSON(excludeMetadata?: boolean): json;
  }

  export interface EntityFactory<T> extends ManagedFactory<T> {
    load(id: string, options?: {depth?: number|boolean, refresh?: boolean, local?: boolean}, doneCallback?: (entity: T) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<T>;
    fromJSON(json: json): T;
    find(): query.Builder<T>;
  }

  export interface Factory<T> {
    new(...args: Array<any>): any;
    newInstance(a?: Array<any>): any;
  }

  export class File {
    constructor(fileOptions: {name?: string, folder?: string, data: string|Blob|File|ArrayBuffer|json, type?: string, mimeType?: string, eTag?: string, lastModified?: string, acl?: Acl})
    id: string;
    url: string;
    name: string;
    folder: string;
    mimeType: string;
    acl: string;
    lastModified: string;
    eTag: string;
    upload(uploadOptions?: {data: string|Blob|File|ArrayBuffer|json, type?: string, mimeType?: string, eTag?: string, lastModified?: string, acl?: Acl, force?: boolean}, doneCallback?: (file: binding.File) => any, failCallback?: (error: error.PersistentError) => any): Promise<binding.File>;
    download(downloadOptions?: {type?: string, refresh?: string}, doneCallback?: (data: string|Blob|File|ArrayBuffer|json) => any, failCallback?: (error: error.PersistentError) => any): Promise<(string|Blob|File|ArrayBuffer|json)>;
    delete(deleteOptions?: {force?: boolean}, doneCallback?: (data: binding.File) => any, failCallback?: (error: error.PersistentError) => any): Promise<binding.File>;
    loadMetadata(options: {refresh?: Object}, doneCallback?: (file: binding.File) => any, failCallback?: (error: error.PersistentError) => any): Promise<binding.File>;
  }

  export interface FileFactory extends Factory<binding.File> {
    create(db: EntityManager): binding.FileFactory;
    newInstance(args?: Array<any>): binding.File;
    saveMetadata(bucket: string, metadata: {loadPermission: util.Permission, insertPermission: util.Permission, updatePermission: util.Permission, deletePermission: util.Permission, queryPermission: util.Permission}): Promise<Object>;
    new(fileOptions: {name?: string, folder?: string, data: string|Blob|File|ArrayBuffer|json, type?: string, mimeType?: string, eTag?: string, lastModified?: string, acl?: Acl}): binding.File;
  }

  export class Managed {
    constructor(properties?: Object)
    static init(instance: binding.Managed, properties?: Object): any;
    static extend(childClass: Class<any>): Class<any>;
    toJSON(): json;
  }

  export interface ManagedFactory<T> extends Factory<T> {
    newInstance(args?: Array<any>): T;
    fromJSON(json: json): T;
    addMethods(methods: ([string, Function])): any;
    addMethod(name: string, fn: Function): any;
    methods: ([string, Function]);
    _managedType: metamodel.ManagedType;
    _db: EntityManager;
    new(properties: ([string, any])): T;
  }

  export class Role extends Entity {
    constructor(properties?: Object)
    hasUser(): boolean;
    addUser(user: model.User): any;
    removeUser(user: model.User): any;
    users: Set<model.User>;
    name: string;
  }

  export class User extends Entity {
    constructor(properties?: Object)
    newPassword(currentPassword: string, password: string, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<model.User>;
    username: string;
    inactive: boolean;
  }

  export interface UserFactory extends EntityFactory<model.User> {
    me: model.User;
    register(user: string|model.User, password: string, loginOption?: boolean|binding.UserFactory.LoginOption, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<model.User>;
    login(username: string, password: string, loginOption?: boolean|binding.UserFactory.LoginOption, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<model.User>;
    logout(doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<any>;
    newPassword(username: string, password: string, newPassword: string, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<model.User>;
    loginWithGoogle(clientID: string, options?: {title?: string, width?: number, height?: number, scope?: string, state?: Object, timeout?: number}, loginOption?: boolean|binding.UserFactory.LoginOption, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<model.User>;
    loginWithFacebook(clientID: string, options?: {title?: string, width?: number, height?: number, scope?: string, state?: Object, timeout?: number}, loginOption?: boolean|binding.UserFactory.LoginOption, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<model.User>;
    loginWithGitHub(clientID: string, options?: {title?: string, width?: number, height?: number, scope?: string, state?: Object, timeout?: number}, loginOption?: boolean|binding.UserFactory.LoginOption, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<model.User>;
    loginWithTwitter(clientID: string, options?: {title?: string, width?: number, height?: number, timeout?: number}, loginOption?: boolean|binding.UserFactory.LoginOption, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<model.User>;
    loginWithLinkedIn(clientID: string, options?: {title?: string, width?: number, height?: number, scope?: string, state?: Object, timeout?: number}, loginOption?: boolean|binding.UserFactory.LoginOption, doneCallback?: (entity: binding.Entity) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<model.User>;
    new(properties: ([string, any])): model.User;
  }

  export namespace UserFactory {
    export enum LoginOption {
      NO_LOGIN = -1,
      SESSION_LOGIN = 0,
      PERSIST_LOGIN = 1
    }
  }
}

export namespace caching {

  export class BloomFilter {
    constructor()
  }
}

export namespace connector {

  export class Connector {
    constructor(host: string, port: number, secure: boolean, basePath: string)
    static create(host: string, port?: number, secure?: boolean, basePath?: string): connector.Connector;
    send(message: connector.Message): Promise<connector.Message>;
    receive(message: connector.Message, resolve: Function, reject: Function, response: Object): any;
    doSend(message: connector.Message, request: Object, receive: Function): any;
    subscribe(topic: string|Object, cb: Function): any;
    unsubscribe(topic: string|Object, cb: Function): any;
    sendOverSocket(msg: {topic: string, token: string}): any;
    createWebSocket(destination: string): WebSocket;
    prepareRequestEntity(message: connector.Message): any;
    prepareResponseEntity(message: connector.Message, response: Object): any;
    static RESPONSE_HEADERS: Array<string>;
    static connectors: Array<connector.Connector>;
    static connections: ([string, connector.Connector]);
  }

  export class IFrameConnector extends XMLHttpConnector {
    constructor()
    static isUsable(host: string, port: number, secure: boolean): boolean;
  }

  export class Message {
    constructor()
    withCredentials: boolean;
    tokenStorage: util.TokenStorage;
    static create(specification: Object): Class<Message>;
    static createExternal(specification: Object, members: Object): Class<Message>;
    header(name: string, value?: string): connector.Message|string;
    entity(data: any, type?: string): connector.Message;
    mimeType(mimeType?: string): connector.Message;
    ifMatch(eTag?: string): connector.Message;
    ifNoneMatch(eTag?: string): connector.Message;
    ifUnmodifiedSince(date?: Date): connector.Message;
    acl(acl?: Acl): connector.Message;
    accept(accept?: string): connector.Message;
    responseType(type: string): connector.Message;
    addQueryString(query: string|Object): any;
    doReceive(response: Object): any;
    spec: Object;
  }

  export class NodeConnector extends Connector {
    constructor()
    parseCookie(header: string): any;
  }

  export class XMLHttpConnector extends Connector {
    constructor()
    static isUsable(host: string, port: number, secure: boolean): boolean;
  }

  export namespace Message {
    export enum StatusCode {
      NOT_MODIFIED = 304,
      BAD_CREDENTIALS = 460,
      BUCKET_NOT_FOUND = 461,
      INVALID_PERMISSION_MODIFICATION = 462,
      INVALID_TYPE_VALUE = 463,
      OBJECT_NOT_FOUND = 404,
      OBJECT_OUT_OF_DATE = 412,
      PERMISSION_DENIED = 466,
      QUERY_DISPOSED = 467,
      QUERY_NOT_SUPPORTED = 468,
      SCHEMA_NOT_COMPATIBLE = 469,
      SCHEMA_STILL_EXISTS = 470,
      SYNTAX_ERROR = 471,
      TRANSACTION_INACTIVE = 472,
      TYPE_ALREADY_EXISTS = 473,
      TYPE_STILL_REFERENCED = 474,
      SCRIPT_ABORTION = 475
    }
  }
}

export namespace util {

  export class Code {
    constructor(metamodel: metamodel.Metamodel)
    entityManagerFactory: EntityManagerFactory;
    functionToString(fn: Function): string;
    stringToFunction(signature: Array<string>, code: string): Function;
    loadModules(): Promise<Array<string>>;
    loadCode(type: metamodel.ManagedType|string, codeType: string, asFunction?: boolean): Promise<(string|Function)>;
    saveCode(type: metamodel.ManagedType|string, codeType: string, fn: string|Function): Promise<(string|Function)>;
    deleteCode(type: metamodel.ManagedType|string, codeType: string): Promise<any>;
  }

  export class Lockable {
    constructor()
    isReady: boolean;
    ready(doneCallback?: () => Promise<any>, failCallback?: () => Promise<any>): Promise<util.Lockable>;
    withLock(callback: () => Promise<any>, critical?: boolean): Promise<util.Lockable>;
  }

  export class Logger {
    constructor()
    level: string;
    log(message: string, ...args: Array<any>): any;
    log(message: string, data?: ([string, any])): any;
    log(level: string, message: string, ...args: Array<any>): any;
    log(level: string, message: string, data?: ([string, any])): any;
    entityManager: EntityManager;
    trace(message: string, ...args: Array<any>): any;
    trace(message: string, data?: ([string, any])): any;
    debug(message: string, ...args: Array<any>): any;
    debug(message: string, data?: ([string, any])): any;
    info(message: string, ...args: Array<any>): any;
    info(message: string, data?: ([string, any])): any;
    warn(message: string, ...args: Array<any>): any;
    warn(message: string, data?: ([string, any])): any;
    error(message: string, ...args: Array<any>): any;
    error(message: string, data?: ([string, any])): any;
  }

  export class Metadata extends Lockable {
    constructor(entity: binding.Entity, type: metamodel.ManagedType)
    id: string;
    version: number;
    type: metamodel.ManagedType;
    acl: Acl;
    static get(managed: binding.Managed): util.Metadata;
    db: EntityManager;
    bucket: string;
    key: string;
    isAttached: boolean;
    isAvailable: boolean;
    isPersistent: boolean;
    isDirty: boolean;
    readAccess(): any;
    writeAccess(): any;
    setUnavailable(): any;
    setPersistent(): any;
    setDirty(): any;
    setRemoved(): any;
    setJsonMetadata(json: Object): any;
    getJson(excludeMetadata?: boolean): json;
  }

  export class Modules {
    constructor(entityManager: EntityManager, connector: connector.Connector)
    _entityManager: EntityManager;
    _connector: connector.Connector;
    get(bucket: string, query: Object|string, options?: {responseType?: string}, doneCallback?: Function, failCallback?: Function): Promise<Object>;
    post(bucket: string, body: string|Blob|File|ArrayBuffer|FormData|json, options?: {requestType?: string, mimeType?: string, responseType?: string}, doneCallback?: Function, failCallback?: Function): Promise<Object>;
  }

  export class Permission {
    constructor(metadata: util.Metadata)
    _rules: ([string, string]);
    _metadata: util.Metadata;
    allRules(): Array<string>;
    clear(): any;
    isPublicAllowed(): boolean;
    setPublicAllowed(): any;
    getRule(userOrRole: model.User|model.Role): string;
    isAllowed(userOrRole: model.User|model.Role): any;
    isDenied(userOrRole: model.User|model.Role): any;
    allowAccess(userOrRole: model.User|model.Role): util.Permission;
    denyAccess(userOrRole: model.User|model.Role): util.Permission;
    deleteAccess(userOrRole: model.User|model.Role): util.Permission;
    toJSON(): json;
    fromJSON(json: json): any;
  }

  export class PushMessage {
    constructor(devices?: Set<binding.Entity>|Array<binding.Entity>, message?: string, subject?: string, sound?: string, badge?: number, data?: Object)
    devices: Set<binding.Entity>;
    message: string;
    subject: string;
    sound: string;
    badge: number;
    data: json;
    addDevice(device: binding.Entity): any;
  }

  export interface TokenStorageFactory {
    create(origin: string): Promise<TokenStorage>;
  }

  export class TokenStorage {
    constructor()
    temporary: boolean;
    _saveToken(origin: string, token: string, temporary: boolean): any;
    update(token: String): any;
    signPath(resource: string): string;
    static GLOBAL: util.TokenStorageFactory;
    static WEB_STORAGE: util.TokenStorageFactory;
  }

  export class ValidationResult {
    constructor()
  }

  export class Validator {
    constructor()
    key: string;
    static compile(managedType: metamodel.ManagedType, validationCode: string): any;
    is(fn: Function): util.Validator;
    is(error: string, fn: Function): util.Validator;
  }

  export namespace Metadata {
    export enum Type {
      UNAVAILABLE = -1,
      PERSISTENT = 0,
      DIRTY = 1
    }
  }
}

export namespace error {

  export class CommunicationError extends PersistentError {
    constructor(httpMessage: connector.Message, response: Object)
  }

  export class EntityExistsError extends PersistentError {
    constructor(entity: string)
  }

  export class IllegalEntityError extends PersistentError {
    constructor(entity: binding.Entity)
  }

  export class PersistentError extends Error {
    constructor(message: string, cause?: Error)
  }

  export class RollbackError extends PersistentError {
    constructor(cause: Error)
  }
}

export namespace message {
  import Message = connector.Message;

  export class ListAllResources extends Message {
    constructor()
  }

  export class ApiVersion extends Message {
    constructor()
  }

  export class Events extends Message {
    constructor()
  }

  export class Specification extends Message {
    constructor()
  }

  export class GetBloomFilter extends Message {
    constructor()
  }

  export class GetOrestesConfig extends Message {
    constructor()
  }

  export class UpdateOrestesConfig extends Message {
    constructor(body: Object)
  }

  export class Connect extends Message {
    constructor()
  }

  export class Status extends Message {
    constructor()
  }

  export class BannedIp extends Message {
    constructor(ip: Object)
  }

  export class Banned extends Message {
    constructor()
  }

  export class Unban extends Message {
    constructor()
  }

  export class UnbanIp extends Message {
    constructor(ip: Object)
  }

  export class GetBucketNames extends Message {
    constructor()
  }

  export class GetBucketIds extends Message {
    constructor(bucket: Object, start: Object, count: Object)
  }

  export class ExportBucket extends Message {
    constructor(bucket: Object)
  }

  export class ImportBucket extends Message {
    constructor(bucket: Object, body: Object)
  }

  export class TruncateBucket extends Message {
    constructor(bucket: Object)
  }

  export class CreateObject extends Message {
    constructor(bucket: Object, body: Object)
  }

  export class GetObject extends Message {
    constructor(bucket: Object, oid: Object)
  }

  export class ReplaceObject extends Message {
    constructor(bucket: Object, oid: Object, body: Object)
  }

  export class DeleteObject extends Message {
    constructor(bucket: Object, oid: Object)
  }

  export class GetAllSchemas extends Message {
    constructor()
  }

  export class UpdateAllSchemas extends Message {
    constructor(body: Object)
  }

  export class ReplaceAllSchemas extends Message {
    constructor(body: Object)
  }

  export class GetSchema extends Message {
    constructor(bucket: Object)
  }

  export class UpdateSchema extends Message {
    constructor(bucket: Object, body: Object)
  }

  export class ReplaceSchema extends Message {
    constructor(bucket: Object, body: Object)
  }

  export class DeleteSchema extends Message {
    constructor(bucket: Object)
  }

  export class AdhocQuery extends Message {
    constructor(bucket: Object, q: Object, eager: Object, start: Object, count: Object, sort: Object)
  }

  export class AdhocQueryPOST extends Message {
    constructor(bucket: Object, start: Object, count: Object, sort: Object, body: Object)
  }

  export class AdhocCountQuery extends Message {
    constructor(bucket: Object, q: Object)
  }

  export class AdhocCountQueryPOST extends Message {
    constructor(bucket: Object, body: Object)
  }

  export class ListQueryResources extends Message {
    constructor()
  }

  export class CreateQuery extends Message {
    constructor(body: Object)
  }

  export class ListThisQueryResources extends Message {
    constructor(qid: Object)
  }

  export class GetQueryCode extends Message {
    constructor(qid: Object)
  }

  export class RunQuery extends Message {
    constructor(start: Object, count: Object, qid: Object)
  }

  export class GetQueryParameters extends Message {
    constructor(qid: Object)
  }

  export class NewTransaction extends Message {
    constructor()
  }

  export class CommitTransaction extends Message {
    constructor(tid: Object, body: Object)
  }

  export class GetObjectInExplicitVersion extends Message {
    constructor(bucket: Object, oid: Object, version: Object)
  }

  export class UpdatePartially extends Message {
    constructor(bucket: Object, oid: Object, body: Object)
  }

  export class UpdateField extends Message {
    constructor(bucket: Object, field: Object, oid: Object, body: Object)
  }

  export class Login extends Message {
    constructor(body: Object)
  }

  export class Register extends Message {
    constructor(body: Object)
  }

  export class Me extends Message {
    constructor()
  }

  export class ValidateUser extends Message {
    constructor()
  }

  export class Logout extends Message {
    constructor()
  }

  export class NewPassword extends Message {
    constructor(body: Object)
  }

  export class Verify extends Message {
    constructor(token: Object)
  }

  export class OAuth2 extends Message {
    constructor(oauth_verifier: Object, code: Object, provider: Object, oauth_token: Object, error_description: Object, state: Object)
  }

  export class OAuth1 extends Message {
    constructor(provider: Object)
  }

  export class GetBaqendCode extends Message {
    constructor(bucket: Object, type: Object)
  }

  export class SetBaqendCode extends Message {
    constructor(bucket: Object, type: Object, body: Object)
  }

  export class DeleteBaqendCode extends Message {
    constructor(bucket: Object, type: Object)
  }

  export class PostBaqendModule extends Message {
    constructor(bucket: Object)
  }

  export class GetBaqendModule extends Message {
    constructor(bucket: Object)
  }

  export class GetAllModules extends Message {
    constructor()
  }

  export class ListFiles extends Message {
    constructor(bucket: Object, path: Object, start: Object, count: Object)
  }

  export class ListBuckets extends Message {
    constructor()
  }

  export class GetFileBucketMetadata extends Message {
    constructor(bucket: Object)
  }

  export class SetFileBucketMetadata extends Message {
    constructor(bucket: Object, body: Object)
  }

  export class DeleteFileBucket extends Message {
    constructor(bucket: Object)
  }

  export class CreateFile extends Message {
    constructor(bucket: Object)
  }

  export class DownloadFile extends Message {
    constructor(bucket: Object, oid: String)
  }

  export class UploadFile extends Message {
    constructor(bucket: Object, oid: String)
  }

  export class GetFileMetadata extends Message {
    constructor(bucket: Object, oid: String)
  }

  export class UpdateFileMetadata extends Message {
    constructor(bucket: Object, oid: String, body: Object)
  }

  export class DeleteFile extends Message {
    constructor(bucket: Object, oid: String)
  }

  export class ListIndexes extends Message {
    constructor(bucket: Object)
  }

  export class CreateDropIndex extends Message {
    constructor(bucket: Object, body: Object)
  }

  export class DropAllIndexes extends Message {
    constructor(bucket: Object)
  }

  export class DeviceRegister extends Message {
    constructor(body: Object)
  }

  export class DevicePush extends Message {
    constructor(body: Object)
  }

  export class DeviceRegistered extends Message {
    constructor()
  }

  export class UploadAPNSCertificate extends Message {
    constructor()
  }

  export class GCMAKey extends Message {
    constructor(body: Object)
  }
}

export namespace metamodel {
  import Lockable = util.Lockable;

  export class Attribute {
    constructor(name: string, isMetadata?: boolean)
    isMetadata: boolean;
    isId: boolean;
    isVersion: boolean;
    isAcl: boolean;
    name: string;
    order: number;
    accessor: binding.Accessor;
    declaringType: metamodel.ManagedType;
    persistentAttributeType: number;
    isAssociation: boolean;
    isCollection: boolean;
    init(declaringType: metamodel.ManagedType, order: number): any;
    getValue(entity: Object): any;
    setValue(entity: Object, value: any): any;
    getJsonValue(state: util.Metadata, object: any): any;
    setJsonValue(state: util.Metadata, object: any, jsonValue: any): any;
    toJSON(): json;
  }

  export class BasicType extends Type {
    constructor(ref: string, typeConstructor: Class<any>, noResolving?: boolean)
    noResolving: boolean;
    persistenceType: number;
  }

  export class CollectionAttribute extends PluralAttribute {
    constructor(name: string, elementType: metamodel.Type)
  }

  export class DbIndex {
    constructor(keys: string|Object|Array<string>, unique?: boolean)
    drop: boolean;
    toJSON(): json;
    static ASC: string;
    static DESC: string;
    static GEO: string;
    static fromJSON(json: json): any;
  }

  export class EmbeddableType extends ManagedType {
    constructor()
    createProxyClass(): any;
    createObjectFactory(db: EntityManager): binding.ManagedFactory<any>;
  }

  export class EntityType extends ManagedType {
    constructor(ref: string, superType: metamodel.EntityType, typeConstructor: Class<binding.Entity>)
    declaredId: metamodel.SingularAttribute;
    declaredVersion: metamodel.SingularAttribute;
    declaredAcl: metamodel.SingularAttribute;
    superType: metamodel.EntityType;
    loadPermission: util.Permission;
    updatePermission: util.Permission;
    deletePermission: util.Permission;
    queryPermission: util.Permission;
    schemaSubclassPermission: util.Permission;
    insertPermission: util.Permission;
    id: metamodel.SingularAttribute;
    version: metamodel.SingularAttribute;
    acl: metamodel.SingularAttribute;
    createProxyClass(): any;
    createObjectFactory(): binding.EntityFactory<binding.Entity>;
  }

  export class ListAttribute extends PluralAttribute {
    constructor(name: string, elementType: metamodel.Type)
    setJsonValue(): any;
    toJSON(): json;
  }

  export class ManagedType extends Type {
    constructor(ref: string, typeConstructor: Class<binding.Managed>)
    _enhancer: binding.Enhancer;
    declaredAttributes: Array<metamodel.Attribute>;
    schemaAddPermission: util.Permission;
    schemaReplacePermission: util.Permission;
    validationCode: Function;
    typeConstructor: Class<binding.Managed>;
    init(enhancer: binding.Enhancer): any;
    createProxyClass(): Class<any>;
    createObjectFactory(db: EntityManager): binding.ManagedFactory<any>;
    create(): Object;
    attributes(): Iterator<metamodel.Attribute>;
    addAttribute(attr: metamodel.Attribute, order?: number): any;
    removeAttribute(name: string): any;
    getAttribute(name: string): metamodel.Attribute;
    getDeclaredAttribute(val: string|number): metamodel.Attribute;
    toJSON(): json;
    references(): Iterator<EntityType>;
  }

  export class MapAttribute extends PluralAttribute {
    constructor(name: string, keyType: metamodel.Type, elementType: metamodel.Type)
    keyType: metamodel.Type;
    toJSON(): json;
  }

  export class Metamodel extends Lockable {
    constructor()
    isInitialized: boolean;
    entityManagerFactory: EntityManagerFactory;
    entities: Array<metamodel.EntityType>;
    embeddables: Array<metamodel.EmbeddableType>;
    baseTypes: Array<metamodel.BasicType>;
    init(jsonMetamodel?: Object): any;
    _getRef(arg: Class<binding.Managed>|string): string;
    entity(typeConstructor: Class<binding.Entity>|string): metamodel.EntityType;
    baseType(typeConstructor: Class<any>|string): metamodel.BasicType;
    embeddable(typeConstructor: Class<binding.Managed>|string): metamodel.EmbeddableType;
    managedType(typeConstructor: Class<binding.Managed>|string): metamodel.Type;
    addType(type: metamodel.Type): metamodel.Type;
    load(): Promise<metamodel.Metamodel>;
    save(managedType?: metamodel.ManagedType): Promise<metamodel.Metamodel>;
    update(data: json): Promise<metamodel.Metamodel>;
    toJSON(): json;
    fromJSON(json: json): any;
    createIndex(bucket: string, index: metamodel.DbIndex): Promise<any>;
    dropIndex(bucket: string, index: metamodel.DbIndex): Promise<any>;
    dropAllIndexes(bucket: string): Promise<any>;
    getIndexes(bucket: string): Promise<Array<metamodel.DbIndex>>;
  }

  export class ModelBuilder {
    constructor(metamodel: metamodel.Metamodel)
    models: ([string, metamodel.ManagedType]);
    modelDescriptors: ([string, Object]);
    getModel(ref: string): metamodel.ManagedType;
    buildModels(modelDescriptors: Array<Object>): ([string, metamodel.ManagedType]);
    buildModel(ref: string): metamodel.ManagedType;
    buildAttributes(model: metamodel.EntityType): any;
    buildAttribute(model: metamodel.EntityType, name: string, ref: string): metamodel.Attribute;
  }

  export class PluralAttribute extends Attribute {
    constructor(name: string, elementType: metamodel.Type)
    elementType: metamodel.Type;
    typeConstructor: Class<any>;
  }

  export class SetAttribute extends PluralAttribute {
    constructor(name: string, elementType: metamodel.Type)
    setJsonValue(): any;
    toJSON(): json;
  }

  export class SingularAttribute extends Attribute {
    constructor(name: string, type: metamodel.Type, isMetadata?: boolean)
    type: metamodel.Type;
  }

  export class Type {
    constructor(ref: string, typeConstructor: Class<any>)
    ref: string;
    name: string;
    persistenceType: number;
    isBasic: boolean;
    isEmbeddable: boolean;
    isEntity: boolean;
    isMappedSuperclass: boolean;
    fromJsonValue(state: util.Metadata, jsonValue: json, currentValue?: any): any;
    toJsonValue(state: util.Metadata, object: any): json;
  }

  export namespace EntityType {

    export class Object extends EntityType {
      constructor()
    }

    export namespace Object {

      export class ObjectType {
        constructor()
      }
    }
  }

  export namespace Attribute {
    export enum PersistentAttributeType {
      BASIC = 0,
      ELEMENT_COLLECTION = 1,
      EMBEDDED = 2,
      MANY_TO_MANY = 3,
      MANY_TO_ONE = 4,
      ONE_TO_MANY = 5,
      ONE_TO_ONE = 6
    }
  }

  export namespace PluralAttribute {
    export enum CollectionType {
      COLLECTION = 0,
      LIST = 1,
      MAP = 2,
      SET = 3
    }
  }

  export namespace Type {
    export enum PersistenceType {
      BASIC = 0,
      EMBEDDABLE = 1,
      ENTITY = 2,
      MAPPED_SUPERCLASS = 3
    }
  }
}

export namespace model {
  import User = binding.User;
  import Role = binding.Role;
  import Entity = binding.Entity;

  export interface User extends User {}

  export interface Role extends Role {}

  export interface Device extends Entity {}
}

export namespace query {

  export class Builder<T> extends Query<T> {
    constructor(entityManager: EntityManager, resultClass: Class<T>)
    and(...args: Array<query.Query<T>|Array<query.Query<T>>>): query.Query<T>;
    or(...args: Array<query.Query<T>|Array<query.Query<T>>>): query.Query<T>;
    nor(...args: Array<query.Query<T>|Array<query.Query<T>>>): query.Query<T>;
    where(conditions: json): query.Filter<T>;
    equal(field: string, value: any): query.Filter<T>;
    notEqual(field: string, value: any): query.Filter<T>;
    greaterThan(field: string, value: number|string|Date): query.Filter<T>;
    greaterThanOrEqualTo(field: string, value: number|string|Date): query.Filter<T>;
    lessThan(field: string, value: number|string|Date): query.Filter<T>;
    lessThanOrEqualTo(field: string, value: number|string|Date): query.Filter<T>;
    between(field: string, lessValue: number|string|Date, greaterValue: number|string|Date): query.Filter<T>;
    in(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
    notIn(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
    isNull(field: string): query.Filter<T>;
    isNotNull(field: string): query.Filter<T>;
    containsAll(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
    mod(field: string, divisor: number, remainder: number): query.Filter<T>;
    matches(field: string, regExp: string|RegExp): query.Filter<T>;
    size(field: string, size: number): query.Filter<T>;
    near(field: string, geoPoint: GeoPoint, maxDistance: number): query.Filter<T>;
    withinPolygon(field: string, ...geoPoints: Array<GeoPoint|Array<GeoPoint>>): query.Filter<T>;
    lt(field: string, value: number|string|Date): query.Filter<T>;
    le(field: string, value: number|string|Date): query.Filter<T>;
    gt(field: string, value: number|string|Date): query.Filter<T>;
    ge(field: string, value: number|string|Date): query.Filter<T>;
    containsAny(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
  }

  export class Condition<T> {
    constructor()
    where(conditions: json): query.Filter<T>;
    equal(field: string, value: any): query.Filter<T>;
    notEqual(field: string, value: any): query.Filter<T>;
    greaterThan(field: string, value: number|string|Date): query.Filter<T>;
    greaterThanOrEqualTo(field: string, value: number|string|Date): query.Filter<T>;
    lessThan(field: string, value: number|string|Date): query.Filter<T>;
    lessThanOrEqualTo(field: string, value: number|string|Date): query.Filter<T>;
    between(field: string, lessValue: number|string|Date, greaterValue: number|string|Date): query.Filter<T>;
    in(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
    notIn(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
    isNull(field: string): query.Filter<T>;
    isNotNull(field: string): query.Filter<T>;
    containsAll(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
    mod(field: string, divisor: number, remainder: number): query.Filter<T>;
    matches(field: string, regExp: string|RegExp): query.Filter<T>;
    size(field: string, size: number): query.Filter<T>;
    near(field: string, geoPoint: GeoPoint, maxDistance: number): query.Filter<T>;
    withinPolygon(field: string, ...geoPoints: Array<GeoPoint|Array<GeoPoint>>): query.Filter<T>;
    lt(field: string, value: number|string|Date): query.Filter<T>;
    le(field: string, value: number|string|Date): query.Filter<T>;
    gt(field: string, value: number|string|Date): query.Filter<T>;
    ge(field: string, value: number|string|Date): query.Filter<T>;
    containsAny(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
  }

  export class Filter<T> extends Node<T> {
    constructor(entityManager: EntityManager, resultClass: Class<T>)
    where(conditions: json): query.Filter<T>;
    equal(field: string, value: any): query.Filter<T>;
    notEqual(field: string, value: any): query.Filter<T>;
    greaterThan(field: string, value: number|string|Date): query.Filter<T>;
    greaterThanOrEqualTo(field: string, value: number|string|Date): query.Filter<T>;
    lessThan(field: string, value: number|string|Date): query.Filter<T>;
    lessThanOrEqualTo(field: string, value: number|string|Date): query.Filter<T>;
    between(field: string, lessValue: number|string|Date, greaterValue: number|string|Date): query.Filter<T>;
    in(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
    notIn(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
    isNull(field: string): query.Filter<T>;
    isNotNull(field: string): query.Filter<T>;
    containsAll(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
    mod(field: string, divisor: number, remainder: number): query.Filter<T>;
    matches(field: string, regExp: string|RegExp): query.Filter<T>;
    size(field: string, size: number): query.Filter<T>;
    near(field: string, geoPoint: GeoPoint, maxDistance: number): query.Filter<T>;
    withinPolygon(field: string, ...geoPoints: Array<GeoPoint|Array<GeoPoint>>): query.Filter<T>;
    lt(field: string, value: number|string|Date): query.Filter<T>;
    le(field: string, value: number|string|Date): query.Filter<T>;
    gt(field: string, value: number|string|Date): query.Filter<T>;
    ge(field: string, value: number|string|Date): query.Filter<T>;
    containsAny(field: string, ...args: Array<any|Array<any>>): query.Filter<T>;
  }

  export class Node<T> extends Query<T> {
    constructor(entityManager: EntityManager, resultClass: Class<T>)
  }

  export class Operator<T> extends Node<T> {
    constructor(entityManager: EntityManager, resultClass: Class<T>, operator: string, childs: Array<query.Node<T>>)
  }

  export class Query<T> {
    constructor()
    ascending(field: string): query.Query<T>;
    descending(field: string): query.Query<T>;
    sort(sort: Object): query.Query<T>;
    offset(offset: number): query.Query<T>;
    limit(limit: number): query.Query<T>;
    resultList(options?: {depth?: number|boolean}, doneCallback?: (result: Array<T>) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<Array<T>>;
    resultList(doneCallback?: (result: Array<T>) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<Array<T>>;
    singleResult(options?: {depth?: number|boolean}, doneCallback?: (entity: T) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<T>;
    singleResult(doneCallback?: (entity: T) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<T>;
    stream(fetchQuery: boolean): query.Stream<T>;
    count(doneCallback?: (count: number) => Promise<any>|any, failCallback?: (error: error.PersistentError) => Promise<any>|any): Promise<number>;
  }

  export class Stream<T> {
    constructor(entityManager: EntityManager, bucket: string, query: string, fetchQuery: boolean, sort: number, limit: number)
  }
}