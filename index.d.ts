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

/**
 * Creates a new Acl object, with an empty rule set for an object
 */
export class Acl {
  constructor(metadata?: util.Metadata);
  readonly read: util.Permission;
  readonly write: util.Permission;
  /** Removes all acl rules, read and write access is public afterwards */
  clear(): void;
  /** Copies permissions from another ACL */
  copy(acl: Acl): Acl;
  /** Gets whenever all users and roles have the permission to read the object */
  isPublicReadAllowed(): boolean;
  /** Sets whenever all users and roles should have the permission to read the objectNote: All other allow read rules will be removed. */
  setPublicReadAllowed(): void;
  /** Checks whenever the user or role is explicit allowed to read the object */
  isReadAllowed(userOrRole: model.User | model.Role | string): boolean;
  /** Checks whenever the user or role is explicit denied to read the object */
  isReadDenied(userOrRole: model.User | model.Role | string): boolean;
  /** Allows the given user or rule to read the object */
  allowReadAccess(...userOrRole: (model.User | model.Role | string)[]): Acl;
  /** Denies the given user or rule to read the object */
  denyReadAccess(...userOrRole: (model.User | model.Role | string)[]): Acl;
  /** Deletes any read allow/deny rule for the given user or role */
  deleteReadAccess(...userOrRole: (model.User | model.Role | string)[]): Acl;
  /** Gets whenever all users and roles have the permission to write the object */
  isPublicWriteAllowed(): boolean;
  /** Sets whenever all users and roles should have the permission to write the objectNote: All other allow write rules will be removed. */
  setPublicWriteAllowed(): void;
  /** Checks whenever the user or role is explicit allowed to write the object */
  isWriteAllowed(userOrRole: model.User | model.Role | string): boolean;
  /** Checks whenever the user or role is explicit denied to write the object */
  isWriteDenied(userOrRole: model.User | model.Role | string): boolean;
  /** Allows the given user or rule to write the object */
  allowWriteAccess(...userOrRole: (model.User | model.Role | string)[]): Acl;
  /** Denies the given user or rule to write the object */
  denyWriteAccess(...userOrRole: (model.User | model.Role | string)[]): Acl;
  /** Deletes any write allow/deny rule for the given user or role */
  deleteWriteAccess(...userOrRole: (model.User | model.Role | string)[]): Acl;
  /** A JSON representation of the set of rules */
  toJSON(): json;
  /** Sets the acl rules form JSON */
  fromJSON(json: json): void;
}

export interface baqend extends EntityManager {
  /** Configures the DB with additional config options */
  configure(options: { tokenStorage?: util.TokenStorage, tokenStorageFactory?: util.TokenStorageFactory, staleness?: number }): baqend;
  /** Connects the DB with the server and calls the callback on success */
  connect(hostOrApp: string, secure?: boolean, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: Error) => Promise<any> | any): Promise<EntityManager>;
}

export class EntityManager extends util.Lockable {
  constructor(entityManagerFactory: EntityManagerFactory);
  readonly isOpen: boolean;
  token: string;
  readonly isCachingDisabled: boolean;
  readonly isDeviceRegistered: boolean;
  readonly log: util.Logger;
  readonly entityManagerFactory: EntityManagerFactory;
  readonly metamodel: metamodel.Metamodel;
  readonly code: util.Code;
  readonly modules: util.Modules;
  readonly me: model.User | null;
  readonly deviceMe: model.Device | null;
  readonly tokenStorage: util.TokenStorage;
  readonly bloomFilter: caching.BloomFilter;
  readonly bloomFilterRefresh: number;
  /** Connects this entityManager, used for synchronous and asynchronous initialization */
  connected(connector: connector.Connector, connectData: object, tokenStorage: util.TokenStorage): void;
  /** Get an instance whose state may be lazily fetchedIf the requested instance does not exist in the database, theEntityNotFoundError is thrown when the instance state is first accessed.The application should not expect that the instance state will be available upon detachment,unless it was accessed by the application while the entity manager was open. */
  getReference(entityClass: Class<binding.Entity> | string, key?: string): binding.Entity;
  /** Creates an instance of {@link query.Builder<T>} for query creation and executionThe query results are instances of the resultClass argument. */
  createQueryBuilder<T>(resultClass?: Class<T>): query.Builder<T>;
  /** Clear the persistence context, causing all managed entities to become detachedChanges made to entities that have not been flushed to the database will not be persisted. */
  clear(): void;
  /** Close an application-managed entity managerAfter the close method has been invoked, all methods on the EntityManager instanceand any Query and TypedQuery objects obtained from it will throw the IllegalStateErrorexcept for transaction, and isOpen (which will return false). If this methodis called when the entity manager is associated with an active transaction,the persistence context remains managed until the transaction completes. */
  close(): void;
  /** Check if the instance is a managed entity instance belonging to the current persistence context */
  contains(entity: binding.Entity): boolean;
  /** Check if an object with the id from the given entity is already attached */
  containsById(entity: binding.Entity): boolean;
  /** Remove the given entity from the persistence context, causing a managed entity to become detachedUnflushed changes made to the entity if any (including removal of the entity),will not be synchronized to the database. Entities which previously referenced the detached entity will continueto reference it. */
  detach(entity: binding.Entity): Promise<binding.Entity>;
  /** Resolve the depth by loading the referenced objects of the given entity */
  resolveDepth(entity: binding.Entity, options?: object): Promise<binding.Entity>;
  /** Search for an entity of the specified oidIf the entity instance is contained in the persistence context, it is returned from there. */
  load(entityClass: Class<binding.Entity> | string, oid: String, options?: object): Promise<binding.Entity>;
  insert(entity: binding.Entity, options: object): Promise<binding.Entity>;
  update(entity: binding.Entity, options: object): Promise<binding.Entity>;
  save(entity: binding.Entity, options: object, withoutLock?: boolean): Promise<binding.Entity>;
  optimisticSave(entity: binding.Entity, cb: Function): Promise<binding.Entity>;
  /** Returns all referenced sub entities for the given depth and root entity */
  getSubEntities(entity: binding.Entity, depth: boolean | number, resolved?: binding.Entity[], initialEntity?: binding.Entity): binding.Entity[];
  /** Returns all referenced one level sub entities for the given path */
  getSubEntitiesByPath(entity: binding.Entity, path: string[]): binding.Entity[];
  /** Delete the entity instance. */
  delete(entity: binding.Entity, options: object): Promise<binding.Entity>;
  /** Synchronize the persistence context to the underlying database. */
  flush(): Promise<any>;
  /** Make an instance managed and persistent. */
  persist(entity: binding.Entity): void;
  /** Refresh the state of the instance from the database, overwriting changes made to the entity, if any. */
  refresh(entity: binding.Entity, options: object): Promise<binding.Entity>;
  /** Attach the instance to this database context, if it is not already attached */
  attach(entity: binding.Entity): void;
  /** Opens a new window use for OAuth logins */
  openOAuthWindow(url: string, targetOrTitle: string, options: object): void;
  registerDevice(devicetype: string, subscription: object, device: model.Device): Promise<model.Device>;
  /** The given entity will be checked by the validation code of the entity type. */
  validate(entity: binding.Entity): util.ValidationResult;
  /** Adds the given object id to the cacheWhiteList if needed. */
  addToWhiteList(objectId: string): void;
  /** Adds the given object id to the cacheBlackList if needed. */
  addToBlackList(objectId: string): void;
  /** Checks the freshness of the bloom filter and does a reload if necessary */
  ensureBloomFilterFreshness(): void;
  /** Checks for a given id, if revalidation is required, the resource is stale or caching was disabled */
  mustRevalidate(id: string): boolean;
  ensureCacheHeader(id: string, message: connector.Message, refresh: boolean): void;
  /** Creates a absolute url for the given relative one */
  createURL(relativePath: string, authorize?: boolean): string;
  /** Requests a perpetual token for the given userOnly users with the admin role are allowed to request an API token. */
  requestAPIToken(entityClass: Class<binding.Entity> | Class<binding.Managed>, user: binding.User | String): Promise<any>;
  /** Revoke all created tokens for the given userThis method will revoke all previously issued tokens and the user must login again. */
  revokeAllTokens(entityClass: Class<binding.Entity> | Class<binding.Managed>, user: binding.User | String): Promise<any>;
  /** Constructor for a new List collection */
  List<U>(...args: U[]): U[];
  /** Constructor for a new Set collection */
  Set<U>(collection?: Iterable<U>): Set<U>;
  /** Constructor for a new Map collection */
  Map(collection?: Iterable<any>): Map<any, any>;
  /** Constructor for a new GeoPoint */
  GeoPoint(latitude?: string | number | number[], longitude?: number): GeoPoint;
  User: binding.UserFactory;
  Role: binding.EntityFactory<model.Role>;
  Device: binding.DeviceFactory;
  [YourEntityClass: string]: any;
  File: binding.FileFactory;
}

/**
 * Creates a new EntityManagerFactory connected to the given destination
 */
export class EntityManagerFactory extends util.Lockable {
  constructor(options?: string | { host?: string, port?: number, secure?: boolean, basePath?: string, schema?: object, tokenStorage?: util.TokenStorage, tokenStorageFactory?: util.TokenStorageFactory, staleness?: number });
  connection: connector.Connector;
  metamodel: metamodel.Metamodel;
  code: util.Code;
  tokenStorageFactory: util.TokenStorageFactory;
  /** Apply additional configurations to this EntityManagerFactory */
  configure(options: { tokenStorage?: util.TokenStorage, tokenStorageFactory?: util.TokenStorageFactory, staleness?: number }): void;
  tokenStorage: util.TokenStorage;
  staleness: number;
  /** Connects this EntityManager to the given destination */
  connect(hostOrApp: string, port?: number, secure?: boolean, basePath?: string): Promise<this>;
  /** Connects this EntityManager to the given destination */
  connect(hostOrApp: string, secure?: boolean): Promise<this>;
  /** Creates a new Metamodel instance, which is not connected */
  createMetamodel(): metamodel.Metamodel;
  /** Create a new application-managed EntityManager. */
  createEntityManager(useSharedTokenStorage?: boolean): EntityManager;
}

/**
 * Creates a new GeoPoint instanceFrom latitude and longitudeFrom a json objectOr an tuple of latitude and longitude
 */
export class GeoPoint {
  constructor(latitude?: string | number | number[], longitude?: number);
  /** Creates a GeoPoint with the user's current location, if available. */
  static current(): Promise<GeoPoint>;
  longitude: number;
  latitude: number;
  /** Returns the distance from this GeoPoint to another in kilometers. */
  kilometersTo(point: GeoPoint): number;
  /** Returns the distance from this GeoPoint to another in miles. */
  milesTo(point: GeoPoint): number;
  /** Computes the arc, in radian, between two WGS-84 positions.The haversine formula implementation is taken from:{@link http://www.movable-type.co.uk/scripts/latlong.html}Returns the distance from this GeoPoint to another in radians. */
  radiansTo(point: GeoPoint): number;
  /** A String representation in latitude, longitude format */
  toString(): string;
  /** Returns a JSON representation of the GeoPoint */
  toJSON(): json;
  static DEG_TO_RAD: number;
  static EARTH_RADIUS_IN_KILOMETERS: number;
  static EARTH_RADIUS_IN_MILES: number;
}

/**
 * An event for a real-time query.
 */
export class RealtimeEvent<T> {
  constructor();
  target: query.Node<T>;
  data: T;
  operation: string;
  matchType: string;
  initial: boolean;
  index: number;
  date: Date;
}

export namespace binding {

  /**
   * Adds a trailing slash to a string if it is missing
   */
  export function trailingSlashIt(str: string): string;

  export class Accessor {
    constructor();
    getValue(object: object, attribute: metamodel.Attribute): any;
    setValue(object: object, attribute: metamodel.Attribute, value: any): void;
  }

  export interface DeviceFactory extends binding.EntityFactory<model.Device> {
    readonly me: model.Device;
    readonly isRegistered: boolean;
    /** Loads the Public VAPID Key which can be used to subscribe a Browser for Web Push notifications */
    loadWebPushKey(): Promise<ArrayBuffer>;
    /** Register a new device with the given device token and OS. */
    register(os: string, tokenOrSubscription: string | Subscription, doneCallback: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.Device>;
    /** Register a new device with the given device token and OS. */
    register(os: string, tokenOrSubscription: string | PushSubscription, device?: model.Device, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.Device>;
    /** Uses the info from the given {util.PushMessage} message to send an push notification. */
    push(pushMessage: util.PushMessage, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<any>;
    /** Push message will be used to send a push notification to a set of devices */
    PushMessage(devices?: Set<binding.Entity> | binding.Entity[], message?: string, subject?: string, sound?: string, badge?: number, data?: object): util.PushMessage;
  }

  export class Enhancer {
    constructor();
    createProxy(superClass: Class<any>): Class<any>;
    static getBaqendType(typeConstructor: Class<any>): metamodel.ManagedType;
    static getIdentifier(typeConstructor: Class<any>): string;
    static setIdentifier(typeConstructor: Class<any>, identifier: string): void;
    enhance(type: metamodel.ManagedType, typeConstructor: Class<any>): void;
    /** Enhance the prototype of the type */
    enhancePrototype(proto: object, type: metamodel.ManagedType): void;
    enhanceProperty(proto: object, attribute: metamodel.Attribute): void;
  }

  export class Entity extends binding.Managed {
    constructor();
    id: string;
    key: string;
    readonly version: number;
    readonly acl: Acl;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    /** Waits on the previously requested operation on this object completes */
    ready(doneCallback?: (entity: this) => Promise<any> | any): Promise<this>;
    /** Attach this object to the given db */
    attach(db: EntityManager): void;
    /** Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist. */
    save(options?: { force?: boolean, depth?: number | boolean, refresh?: boolean }, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<this>;
    /** Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist. */
    insert(options?: { depth?: number | boolean, refresh?: boolean }, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<this>;
    /** Updates an existing objectUpdates the object if it exists and raise an error if the object doesn't exist. */
    update(options?: { force?: boolean, depth?: number | boolean, refresh?: boolean }, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<this>;
    /** Resolves the referenced object in the specified depthOnly unresolved objects will be loaded unless the refresh option is specified.Removed objects will be marked as removed. */
    load(options?: { depth?: number | boolean, refresh?: boolean }, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<this>;
    /** Deletes an existing object */
    delete(options?: { force?: boolean, depth?: number | boolean }, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<this>;
    /** Saves the object and repeats the operation if the object is out of dateIn each pass the callback will be called. Ths first parameter of the callback is the entity and the second oneis a function to abort the process. */
    optimisticSave(cb: Function, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<this>;
    /** Validates the entity by using the validation code of the entity type */
    validate(): util.ValidationResult;
    /** Starts a partial update on this entity */
    partialUpdate(operations?: json): partialupdate.EntityPartialUpdateBuilder<this>;
    /** Get all objects which refer to this object */
    getReferencing(options?: { classes?: string[] }): Promise<binding.Entity>;
    /** Converts the object to an JSON-Object */
    toJSON(options?: boolean | { excludeMetadata?: boolean, depth?: number | boolean }): json;
  }

  export interface EntityFactory<T> extends binding.ManagedFactory<T> {
    /** Creates a new instance of the factory type */
    newInstance(args?: any[]): T;
    /** Loads the instance for the given id, or null if the id does not exists. */
    load(id: string, options?: { depth?: number | boolean, refresh?: boolean, local?: boolean }, doneCallback?: (entity: T) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<T>;
    /** Gets an unloaded reference for the given id. */
    ref(id: string): T;
    /** Creates a new instance and sets the DatabaseObject to the given json */
    fromJSON(json: json): T;
    /** Creates a new query for this class */
    find(): query.Builder<T>;
    /** Creates a new partial update for this class */
    partialUpdate(id: string, partialUpdate?: json): partialupdate.EntityPartialUpdateBuilder<T>;
  }

  /**
   * This factory creates instances of type T, by invoking the {@link #new()} methodor by instantiating this factory directly
   */
  export interface Factory<T> {
    /** Creates a new instance of the factory type */
    new(...args: any[]): T;
    /** Creates a new instance of the factory type */
    newInstance(args?: any[]): T;
  }

  /**
   * Creates a file object, which represents one specific file reference.This File object can afterwards be used to up- and download the file contents or to retrieves and change the filesmetadata.The file data can be uploaded and downloaded as: <table class="table">  <tr>    <th>type</th>    <th>JavaScript type</th>    <th>Description</th>  </tr>  <tr>    <td>'arraybuffer'</td>    <td>ArrayBuffer</td>    <td>The content is represented as a fixed-length raw binary data buffer</td>  </tr>  <tr>    <td>'blob'</th>    <td>Blob</td>    <td>The content is represented as a simple blob</td>  </tr>  <tr>    <td>'json'</td>    <td>object|array|string</td>    <td>The file content is represented as json</td>  </tr>  <tr>    <td>'text'</td>    <td>string</td>    <td>The file content is represented through the string</td>  </tr>  <tr>    <td>'base64'</td>    <td>string</td>    <td>The file content as base64 encoded string</td>  </tr>  <tr>    <td>'data-url'</td>    <td>string</td>    <td>A data url which represents the file content</td>  </tr></table>
   */
  export class File {
    constructor(fileOptions: string | { id?: string, name?: string, parent?: string, path?: string, data: string | Blob | File | ArrayBuffer | json, type?: string, mimeType?: string, size?: number, eTag?: string, lastModified: string | Date, acl?: Acl, headers?: { [key: string]: string } });
    readonly id: string;
    readonly url: string;
    readonly name: string;
    readonly mimeType: string;
    readonly acl: Acl;
    readonly lastModified?: Date;
    readonly createdAt?: Date;
    readonly eTag: string;
    readonly headers: { [key: string]: string };
    readonly size: number;
    readonly bucket: string;
    readonly key: string;
    readonly path: string;
    readonly parent: string;
    readonly isMetadataLoaded: boolean;
    readonly isFolder: boolean;
    /** Parses an E-Tag header */
    static parseETag(eTag?: string): string;
    /** Uploads the file content which was provided in the constructor or by uploadOptions.data */
    upload(uploadOptions?: { data?: string | Blob | File | ArrayBuffer | json, type?: string, mimeType?: string, eTag?: string, lastModified?: string, acl?: Acl, headers?: { [key: string]: string }, force?: boolean, progress?: (event: ProgressEvent) => any }, doneCallback?: (file: binding.File) => any, failCallback?: (error: error.PersistentError) => any): Promise<binding.File>;
    /** Download a file and providing it in the requested type */
    download(downloadOptions?: { type?: string, refresh?: string }, doneCallback?: (data: string | Blob | File | ArrayBuffer | json) => any, failCallback?: (error: error.PersistentError) => any): Promise<(string|Blob|File|ArrayBuffer|json)>;
    /** Deletes a file */
    delete(deleteOptions?: { force?: boolean }, doneCallback?: (data: binding.File) => any, failCallback?: (error: error.PersistentError) => any): Promise<(binding.File|Array<binding.File>)>;
    /** Makes the given message a conditional request based on the file metadata */
    conditional(msg: connector.Message, options: { force?: boolean }): void;
    /** Gets the file metadata of a file */
    loadMetadata(options?: { refresh?: boolean }, doneCallback?: (file: binding.File) => any, failCallback?: (error: error.PersistentError) => any): Promise<binding.File>;
    /** Updates the matadata of this file. */
    saveMetadata(options?: { force?: boolean }, doneCallback?: (file: binding.File) => any, failCallback?: (error: error.PersistentError) => any): Promise<binding.File>;
    /** Deserialize the given JSON file metadata back to this file instanceIf the JSON object contains an ID, it must match with this file ID, otherwise an exception is thrown. */
    fromJSON(json: json): void;
    /** Serialize the file metadata of this object to json */
    toJSON(): json;
    /** Checks whenever metadata are already loaded of the file, throws an error otherwise */
    checkAvailable(): void;
  }

  export interface FileFactory extends binding.Factory<binding.File> {
    /** Creates a new FileFactory for the given type */
    create(db: EntityManager): binding.FileFactory;
    /** Creates a new file */
    newInstance(args?: any[]): binding.File;
    /** Deserialize the file metadata from a json object back to a new file instance */
    fromJSON(json: json): binding.File;
    /** Updates the metadata of the root file directory formally the file "bucket" */
    saveMetadata(bucket: string, metadata: { [key: string]: util.Permission } | { load?: util.Permission, insert?: util.Permission, update?: util.Permission, delete?: util.Permission, query?: util.Permission }, doneCallback?: (bucketMetadata: { [key: string]: util.Permission }) => any, failCallback?: (error: error.PersistentError) => any): Promise<void>;
    /** Gets the metadata of the root folder (formally the file "bucket") */
    loadMetadata(bucket: string, options?: { refresh?: object }, doneCallback?: (bucketMetadata: { [key: string]: util.Permission }) => any, failCallback?: (error: error.PersistentError) => any): Promise<{ [key: string]: util.Permission }>;
    /** Lists all the buckets. */
    listBuckets(doneCallback?: (files: binding.File[]) => any, failCallback?: (error: error.PersistentError) => any): Promise<binding.File[]>;
    /** Lists the files (and folders) in the given folder. */
    listFiles(folderOrPath: binding.File | string, start: binding.File, count: number, doneCallback?: (files: binding.File[]) => any, failCallback?: (error: error.PersistentError) => any): Promise<binding.File[]>;
    /** Creates a new file object which represents the file at the given IDData provided to the constructor will be uploaded by invoking {@link upload()}. */
    new(fileOptions: string | { name?: string, parent?: string, data: string | Blob | File | ArrayBuffer | json, type?: string, mimeType?: string, eTag?: string, lastModified?: string, acl?: Acl, headers?: { [key: string]: string } }): binding.File;
  }

  /**
   * The default constructor, copy all given properties to this object
   */
  export class Managed {
    constructor(properties?: { [key: string]: any });
    /** Initialize the given instance */
    static init(instance: binding.Managed, properties?: { [key: string]: any }): void;
    /** Creates a subclass of this class */
    static extend(childClass: Class<any>): Class<any>;
    /** Create a temporary state object for a managed object */
    static createState(type: metamodel.ManagedType, db?: EntityManager): util.State;
    /** Returns this object identifier or the baqend type of this object */
    toString(): string;
    /** Converts the managed object to an JSON-Object. */
    toJSON(): json;
  }

  export interface ManagedFactory<T> extends binding.Factory<T> {
    /** Creates a new instance and sets the Managed Object to the given json */
    fromJSON(json: json): T;
    /** Adds methods to instances of this factories type */
    addMethods(methods: { [key: string]: Function }): void;
    /** Add a method to instances of this factories type */
    addMethod(name: string, fn: Function): void;
    methods: { [key: string]: Function };
    readonly managedType: metamodel.ManagedType;
    readonly db: EntityManager;
    /** Creates a new instance of the of this type */
    new(properties: { [key: string]: any }): T;
  }

  export class Role extends binding.Entity {
    constructor();
    /** Test if the given user has this role */
    hasUser(user: model.User): boolean;
    /** Add the given user to this role */
    addUser(user: model.User): void;
    /** Remove the given user from this role */
    removeUser(user: model.User): void;
    users: Set<model.User>;
    name: string;
  }

  export class User extends binding.Entity {
    constructor();
    /** Change the password of the given user */
    newPassword(currentPassword: string, password: string, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Change the username of the current user */
    changeUsername(newUsername: string, password: string, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<any>;
    /** Requests a perpetual token for the userOnly users with the admin role are allowed to request an API token. */
    requestAPIToken(doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<any>;
    username: string;
    inactive: boolean;
  }

  export interface UserFactory extends binding.EntityFactory<model.User> {
    readonly me: model.User;
    /** Register a new user with the given username and password, if the username is not used by an another user. */
    register(user: string | model.User, password: string, loginOption?: boolean | binding.UserFactory.LoginOption, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Log in the user with the given username and password and starts a user session */
    login(username: string, password: string, loginOption?: boolean | binding.UserFactory.LoginOption, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Log in the user assiciated with the given token and starts a user session. */
    loginWithToken(token: string, loginOption?: boolean | binding.UserFactory.LoginOption, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Log out the current logged in user and ends the active user session */
    logout(doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<any>;
    /** Change the password of the given user */
    newPassword(username: string, password: string, newPassword: string, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Sends an email with a link to reset the password for the given usernameThe username must be a valid email address. */
    resetPassword(username: string, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<any>;
    /** Sends an email with a link to change the current usernameThe user is identified by their current username and password.The username must be a valid email address. */
    changeUsername(username: string, newUsername: string, password: string, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<any>;
    /** Requests a perpetual token for the given userOnly users with the admin role are allowed to request an API token. */
    requestAPIToken(user: binding.User | String, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<any>;
    /** Revoke all created tokens for the given userThis method will revoke all previously issued tokens and the user must login again. */
    revokeAllTokens(user: binding.User | String, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<any>;
    /** Change the password of a user, which will be identified by the given token from the reset password e-mail */
    newPassword(token: string, newPassword: string, loginOption?: boolean | binding.UserFactory.LoginOption, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Logs the user in with Google via OAuthPrompts the user for the Google login in a new window. Before using OAuth you need to setup your applicationon the provider website, add the redirect uri: <code>https://example.net/db/User/OAuth/google</code> and copy theclient id and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user islogged in. */
    loginWithGoogle(clientID: string, options?: { title?: string, width?: number, height?: number, scope?: string, state?: object, timeout?: number, redirect?: string }, loginOption?: boolean | binding.UserFactory.LoginOption, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Logs the user in with Facebook via OAuthPrompts the user for the Facebook login in a new window. Before using OAuth you need to setup your applicationon the provider website, add the redirect uri: https://example.net/db/User/OAuth/facebook and copy the client idand the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in. */
    loginWithFacebook(clientID: string, options?: { title?: string, width?: number, height?: number, scope?: string, state?: object, timeout?: number, redirect?: string }, loginOption?: boolean | binding.UserFactory.LoginOption, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Logs the user in with GitHub via OAuthPrompts the user for the GitHub login in a new window. Before using OAuth you need to setup your applicationon the provider website, add the redirect uri: https://example.net/db/User/OAuth/github and copy the client idand the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in. */
    loginWithGitHub(clientID: string, options?: { title?: string, width?: number, height?: number, scope?: string, state?: object, timeout?: number, redirect?: string }, loginOption?: boolean | binding.UserFactory.LoginOption, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Logs the user in with Twitter via OAuthPrompts the user for the Twitter login in a new window. Before using OAuth you need to setup your applicationon the provider website, add the redirect uri: https://example.net/db/User/OAuth/twitter and copy the client idand the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in. */
    loginWithTwitter(clientID: string, options?: { title?: string, width?: number, height?: number, timeout?: number, redirect?: string }, loginOption?: boolean | binding.UserFactory.LoginOption, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Logs the user in with LinkedIn via OAuthPrompts the user for the LinkedIn login in a new window. Before using OAuth you need to setup your applicationon the provider website, add the redirect uri: https://example.net/db/User/OAuth/linkedin and copy the client idand the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in. */
    loginWithLinkedIn(clientID: string, options?: { title?: string, width?: number, height?: number, scope?: string, state?: object, timeout?: number, redirect?: string }, loginOption?: boolean | binding.UserFactory.LoginOption, doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<model.User>;
    /** Creates a new user object */
    new(properties: { [key: string]: any }): model.User;
  }

  export namespace UserFactory {

    export enum LoginOption {
      NO_LOGIN = -1,
      SESSION_LOGIN = 0,
      PERSIST_LOGIN = 1,
    }
  }
}

export namespace caching {

  /**
   * A Bloom Filter is a client-side kept cache sketch of the server cache
   */
  export class BloomFilter {
    constructor(bloomFilter: { m: number, h: number, b: string });
    readonly bytes: string;
    readonly bits: number;
    readonly hashes: number;
    readonly creation: number;
    /** Returns whether this Bloom filter contains the given element. */
    contains(element: string): boolean;
  }
}

export namespace connector {

  export class Connector {
    constructor(host: string, port: number, secure: boolean, basePath: string);
    static create(host: string, port?: number, secure?: boolean, basePath?: string): connector.Connector;
    readonly host: string;
    readonly port: number;
    readonly secure: boolean;
    readonly basePath: string;
    readonly origin: string;
    send(message: connector.Message): Promise<connector.Message>;
    prepareRequest(message: connector.Message): void;
    /** Convert the message entity to the sendable representation */
    toFormat(message: connector.Message): void;
    prepareResponse(message: connector.Message, response: object): Promise<any>;
    /** Convert received data to the requested response entity type */
    fromFormat(response: object, entity: any, type: string): any;
    static RESPONSE_HEADERS: string[];
    static connectors: connector.Connector[];
    static connections: { [key: string]: connector.Connector };
  }

  export class FetchConnector extends connector.Connector {
    constructor();
    /** Indicates if this connector implementation is usable for the given host and port */
    static isUsable(): boolean;
  }

  export class IFrameConnector extends connector.XMLHttpConnector {
    constructor();
    /** Indicates if this connector implementation is usable for the given host and port */
    static isUsable(host: string, port: number, secure: boolean): boolean;
  }

  export class Message {
    constructor();
    /** Creates a new message class with the given message specification */
    static create(specification: object): Class<Message>;
    /** Creates a new message class with the given message specification and a full path */
    static createExternal(specification: object, members: object): Class<Message>;
    withCredentials: boolean;
    tokenStorage: util.TokenStorage;
    progressCallback: (event: ProgressEvent) => any;
    /** Gets the value of a the specified request header */
    header(name: string): string;
    /** Sets the value of a the specified request header */
    header(name: string, value: string): this;
    /** Sets the entity type */
    entity(data: any, type?: 'json' | 'text' | 'blob' | 'buffer' | 'arraybuffer' | 'data-url' | 'form'): this;
    /** Get the mimeType */
    mimeType(): string;
    /** Sets the mimeType */
    mimeType(mimeType: string): this;
    /** Gets the contentLength */
    contentLength(): number;
    /** Sets the contentLength */
    contentLength(contentLength: number): this;
    /** Gets the request conditional If-Match header */
    ifMatch(): string;
    /** Sets the request conditional If-Match header */
    ifMatch(eTag: string): this;
    /** Gets the request a ETag based conditional header */
    ifNoneMatch(): string;
    /** Sets the request a ETag based conditional header */
    ifNoneMatch(eTag: string): this;
    /** Gets the request date based conditional header */
    ifUnmodifiedSince(): string;
    /** Sets the request date based conditional header */
    ifUnmodifiedSince(date: Date): this;
    /** Indicates that the request should not be served by a local cache */
    noCache(): this;
    /** Gets the cache control header */
    cacheControl(): string;
    /** Sets the cache control header */
    cacheControl(value: string): this;
    /** Gets the ACL of a file into the Baqend-Acl header */
    acl(): string;
    /** Sets and encodes the ACL of a file into the Baqend-Acl header */
    acl(acl: Acl): this;
    /** Gets and encodes the custom headers of a file into the Baqend-Custom-Headers header */
    customHeaders(): string;
    /** Sets and encodes the custom headers of a file into the Baqend-Custom-Headers header */
    customHeaders(customHeaders: any): this;
    /** Gets the request accept header */
    accept(): string;
    /** Sets the request accept header */
    accept(accept: string): this;
    /** Gets the response type which should be returned */
    responseType(): string;
    /** Sets the response type which should be returned */
    responseType(type: string): this;
    /** Gets the progress callback */
    progress(): (event: ProgressEvent) => any;
    /** Sets the progress callback */
    progress(callback: (event: ProgressEvent) => any): this;
    /** Adds the given string to the request pathIf the parameter is an object, it will be serialized as a query string. */
    addQueryString(query: string | { [key: string]: string }): this;
    /** Handle the receive */
    doReceive(response: object): void;
    spec: object;
  }

  export class NodeConnector extends connector.Connector {
    constructor();
    /** Parse the cookie header */
    parseCookie(header: string): string | null;
  }

  export class XMLHttpConnector extends connector.Connector {
    constructor();
    /** Indicates if this connector implementation is usable for the given host and port */
    static isUsable(host: string, port: number, secure: boolean): boolean;
  }

  export class ObservableStream extends Observable<connector.ChannelMessage> {
    constructor();
    /** Sends a message */
    send(The: connector.ChannelMessage): any;
  }

  export interface ChannelMessage {
    id: string;
    type: string;
    date: Date;
  }

  export class WebSocketConnector {
    constructor(url: String);
    static create(connector: connector.Connector, url?: String): connector.WebSocketConnector;
    openStream(tokenStorage: util.TokenStorage, id: string): connector.ObservableStream;
    static websockets: connector.Connector[];
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
      SCRIPT_ABORTION = 475,
    }
  }
}

export namespace error {

  export class CommunicationError extends error.PersistentError {
    constructor(httpMessage: connector.Message, response: object);
    name: string;
    reason: string;
    status: number;
  }

  export class EntityExistsError extends error.PersistentError {
    constructor(entity: string);
    entity: binding.Entity;
  }

  export class IllegalEntityError extends error.PersistentError {
    constructor(entity: binding.Entity);
    entity: binding.Entity;
  }

  export class PersistentError extends Error {
    constructor(message: string, cause?: Error);
  }

  export class RollbackError extends error.PersistentError {
    constructor(cause: Error);
  }
}

export namespace message {

  /**
   * Get the list of all available subresources
   */
  export class ListAllResources extends connector.Message {
    constructor();
  }

  /**
   * Get the API version of the Orestes-Server
   */
  export class ApiVersion extends connector.Message {
    constructor();
  }

  /**
   * The Swagger specification of the Orestes-Server
   */
  export class Specification extends connector.Message {
    constructor();
  }

  /**
   * Returns all changed objects
   */
  export class GetBloomFilter extends connector.Message {
    constructor();
  }

  /**
   * Clears the Bloom filter (TTLs and stale entries)
   */
  export class DeleteBloomFilter extends connector.Message {
    constructor();
  }

  /**
   * Get the current Orestes config
   */
  export class GetOrestesConfig extends connector.Message {
    constructor();
  }

  /**
   * Updates the current Orestes config
   */
  export class UpdateOrestesConfig extends connector.Message {
    constructor(body: json);
  }

  /**
   * Connects a browser to this server
   */
  export class Connect extends connector.Message {
    constructor();
  }

  /**
   * Gets the status of the server health
   */
  export class Status extends connector.Message {
    constructor();
  }

  /**
   * Gets the event Endpoint
   */
  export class EventsUrl extends connector.Message {
    constructor();
  }

  /**
   * Determines whether the IP has exceeded its rate limit
   */
  export class BannedIp extends connector.Message {
    constructor(ip: string);
  }

  /**
   * Always returns banned status for proper CDN handling
   */
  export class Banned extends connector.Message {
    constructor();
  }

  /**
   * Clears all rate-limiting information for all IPs
   */
  export class Unban extends connector.Message {
    constructor();
  }

  /**
   * Clears rate-limiting information for given IPs
   */
  export class UnbanIp extends connector.Message {
    constructor(ip: string);
  }

  /**
   * List all bucket namesList all buckets
   */
  export class GetBucketNames extends connector.Message {
    constructor();
  }

  /**
   * List objects in bucketList all object ids of the given bucket
   */
  export class GetBucketIds extends connector.Message {
    constructor(bucket: string, start: number, count: number);
  }

  /**
   * Dump objects of bucketExports the complete data set of the bucket
   */
  export class ExportBucket extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Upload all objects to the bucketImports the complete data set. For large uploads, this call will always return the status code 200.If failures occur, they will be returned in the response body.
   */
  export class ImportBucket extends connector.Message {
    constructor(bucket: string, body: json);
  }

  /**
   * Delete all objects in bucketDelete all objects in the given bucket
   */
  export class TruncateBucket extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Create objectCreate the given object.The created object will get a unique id.
   */
  export class CreateObject extends connector.Message {
    constructor(bucket: string, body: json);
  }

  /**
   * Get objectReturns the specified object. Each object has one unique identifier and therefore only one URL.
   */
  export class GetObject extends connector.Message {
    constructor(bucket: string, oid: string);
  }

  /**
   * Replace objectReplace the current object with the updated one.To update a specific version of the object a version can be provided in the If-Match header.The update will only be accepted, if the current version matches the provided one, otherwise the updatewill be rejected.The * wildcard matches any existing object but prevents an insertion if the object does not exist.
   */
  export class ReplaceObject extends connector.Message {
    constructor(bucket: string, oid: string, body: json);
  }

  /**
   * Delete objectDeletes the object. The If-Match Header can be used to specify an expected version. The object willonly be deleted if the version matches the provided one. The * wildcard can be used to match any existingversion but results in an error if the object does not exist.
   */
  export class DeleteObject extends connector.Message {
    constructor(bucket: string, oid: string);
  }

  /**
   * Get all available class schemasGets the complete schema
   */
  export class GetAllSchemas extends connector.Message {
    constructor();
  }

  /**
   * Create new class schemas and update existing class schemasUpdates the complete schema, merge all changes, reject the schema update if the schema changes aren't compatible
   */
  export class UpdateAllSchemas extends connector.Message {
    constructor(body: json);
  }

  /**
   * Replace all currently created schemas with the new onesReplace the complete schema, with the new one.
   */
  export class ReplaceAllSchemas extends connector.Message {
    constructor(body: json);
  }

  /**
   * Get the class schemaReturns the schema definition of the classThe class definition contains a link to its parent class and all persistable fields with there types of the class
   */
  export class GetSchema extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Update the class schemaModify the schema definition of the class by adding all missing fields
   */
  export class UpdateSchema extends connector.Message {
    constructor(bucket: string, body: json);
  }

  /**
   * Replace the class schemaReplace the schema definition of the class
   */
  export class ReplaceSchema extends connector.Message {
    constructor(bucket: string, body: json);
  }

  /**
   * Delete the class schemaDelete the schema definition of the class
   */
  export class DeleteSchema extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Executes a basic ad-hoc queryExecutes the given query and returns a list of matching objects.
   */
  export class AdhocQuery extends connector.Message {
    constructor(bucket: string, q: string, eager: boolean, hinted: boolean, start: number, count: number, sort: string);
  }

  /**
   * Executes a basic ad-hoc queryExecutes the given query and returns a list of matching objects.
   */
  export class AdhocQueryPOST extends connector.Message {
    constructor(bucket: string, start: number, count: number, sort: string, body: string);
  }

  /**
   * Executes a count queryExecutes the given query and returns the number of objects that match the query
   */
  export class AdhocCountQuery extends connector.Message {
    constructor(bucket: string, q: string);
  }

  /**
   * Executes a count queryExecutes the given query and returns the number of objects that match the query
   */
  export class AdhocCountQueryPOST extends connector.Message {
    constructor(bucket: string, body: string);
  }

  /**
   * List all Query subresources
   */
  export class ListQueryResources extends connector.Message {
    constructor();
  }

  /**
   * Creates a prepared query
   */
  export class CreateQuery extends connector.Message {
    constructor(body: json);
  }

  /**
   * List all subresources of a query
   */
  export class ListThisQueryResources extends connector.Message {
    constructor(qid: string);
  }

  /**
   * Get the query string
   */
  export class GetQueryCode extends connector.Message {
    constructor(qid: string);
  }

  /**
   * Executes a prepared query
   */
  export class RunQuery extends connector.Message {
    constructor(start: number, count: number, qid: string);
  }

  /**
   * Get the declared query parameters
   */
  export class GetQueryParameters extends connector.Message {
    constructor(qid: string);
  }

  /**
   * Starts a new Transaction
   */
  export class NewTransaction extends connector.Message {
    constructor();
  }

  /**
   * Commits the transactionIf the transaction can be completed a list of all changed objects with their updated versions are returned.
   */
  export class CommitTransaction extends connector.Message {
    constructor(tid: string, body: json);
  }

  /**
   * Update the objectExecutes the partial updates on the object.To update an object an explicit version must be provided in the If-Match header.If the version is not equal to the current object version the update will be aborted.The version identifier Any (*) can be used to skip the version validation and thereforethe update will always be applied.
   */
  export class UpdatePartially extends connector.Message {
    constructor(bucket: string, oid: string, body: json);
  }

  /**
   * Update the object fieldExecutes the partial update on a object field.To update an object an explicit version must be provided in the If-Match header.If the version is not equal to the current object version the update will be aborted.The version identifier Any (*) can be used to skip the version validation and thereforethe update will always be applied.
   */
  export class UpdateField extends connector.Message {
    constructor(bucket: string, field: string, oid: string, body: json);
  }

  /**
   * Method to login a userLog in a user by it's credentials
   */
  export class Login extends connector.Message {
    constructor(body: json);
  }

  /**
   * Method to register a userRegister and creates a new user
   */
  export class Register extends connector.Message {
    constructor(body: json);
  }

  /**
   * Method to load the current user objectGets the user object of the currently logged in user
   */
  export class Me extends connector.Message {
    constructor();
  }

  /**
   * Method to validate a user tokenValidates if a given token is still valid
   */
  export class ValidateUser extends connector.Message {
    constructor();
  }

  /**
   * Method to remove token cookieLog out a user by removing the cookie token
   */
  export class Logout extends connector.Message {
    constructor();
  }

  /**
   * Method to change the password
   */
  export class NewPassword extends connector.Message {
    constructor(body: json);
  }

  /**
   * Method to request a new password
   */
  export class ResetPassword extends connector.Message {
    constructor(body: json);
  }

  /**
   * Method to verify user by a given token
   */
  export class Verify extends connector.Message {
    constructor(token: string);
  }

  /**
   * Method to request a change of the username
   */
  export class ChangeUsername extends connector.Message {
    constructor(body: json);
  }

  /**
   * Method to verify a username by a given token
   */
  export class VerifyUsername extends connector.Message {
    constructor(token: string);
  }

  /**
   * Method to register or login using an OAuth provider.This resource is should be invoked by the provider with a redirect after the user granted permission.
   */
  export class OAuth2 extends connector.Message {
    constructor(oauth_verifier: string, code: string, provider: string, oauth_token: string, error_description: string, state: string);
  }

  /**
   * Method to invoke a OAuth-1.0 login/registerThe resource requests a request-token and redirects the user to the provider page to log-in and grant permission foryour application.
   */
  export class OAuth1 extends connector.Message {
    constructor(provider: string);
  }

  /**
   * Generate a token without lifetimeMethod to generate a token without lifetime
   */
  export class UserToken extends connector.Message {
    constructor(oid: string);
  }

  /**
   * Revoke all tokensMethod to revoke all previously created tokens
   */
  export class RevokeUserToken extends connector.Message {
    constructor(oid: string);
  }

  /**
   * Gets the code of the the given bucket and type
   */
  export class GetBaqendCode extends connector.Message {
    constructor(bucket: string, type: string);
  }

  /**
   * Sets the code of the bucket and type
   */
  export class SetBaqendCode extends connector.Message {
    constructor(bucket: string, type: string, body: string);
  }

  /**
   * Delete the code of the given bucket and type
   */
  export class DeleteBaqendCode extends connector.Message {
    constructor(bucket: string, type: string);
  }

  /**
   * Calls the module of the specific bucket
   */
  export class PostBaqendModule extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Calls the module of the specific bucket
   */
  export class GetBaqendModule extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * List all available modules
   */
  export class GetAllModules extends connector.Message {
    constructor();
  }

  /**
   * Get all file ID's in the given folderRetrieve meta-information about all accessible Files and folders in a specified folder.
   */
  export class ListFiles extends connector.Message {
    constructor(bucket: string, path: string, deep: boolean, start: string, count: number);
  }

  /**
   * Get all bucketsGets all buckets.
   */
  export class ListBuckets extends connector.Message {
    constructor();
  }

  /**
   * Download a bucket archiveDownloads an archive containing the bucket contents.
   */
  export class DownloadArchive extends connector.Message {
    constructor(archive: string);
  }

  /**
   * Upload a patch bucket archiveUploads an archive; files contained within that archive will be replaced within the bucket.
   */
  export class UploadPatchArchive extends connector.Message {
    constructor(archive: string, body: string);
  }

  /**
   * Retrieve the bucket MetadataThe bucket metadata object contains the bucketAcl.
   */
  export class GetFileBucketMetadata extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Set the Bucket MetadataCreates or replaces the bucket Metadata to control permission access to all included Files.
   */
  export class SetFileBucketMetadata extends connector.Message {
    constructor(bucket: string, body: json);
  }

  /**
   * Delete all files of a file BucketDeletes the bucket and all its content.
   */
  export class DeleteFileBucket extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Creates a new file with a random UUIDCreates a file with a random ID, only Insert permissions are required.
   */
  export class CreateFile extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Download a fileDownloads a file by its ID.
   */
  export class DownloadFile extends connector.Message {
    constructor(bucket: string, oid: string);
  }

  /**
   * Upload a new fileUploads and replace an existing file with a new one.The If-Match or If-Unmodified-Since header can be used to make a conditional update
   */
  export class UploadFile extends connector.Message {
    constructor(bucket: string, oid: string);
  }

  /**
   * Get the file metadataGets the file Acl and metadata.
   */
  export class GetFileMetadata extends connector.Message {
    constructor(bucket: string, oid: string);
  }

  /**
   * Update File MetadataUpdates the file Metadata.
   */
  export class UpdateFileMetadata extends connector.Message {
    constructor(bucket: string, oid: string, body: json);
  }

  /**
   * Delete a fileDeletes a file or a folder with all its contents.The If-Match or If-Unmodified-Since header can be used to make a conditional deletion
   */
  export class DeleteFile extends connector.Message {
    constructor(bucket: string, oid: string);
  }

  /**
   * Creates the manifestCreates the manifest with the given data
   */
  export class CreateManifest extends connector.Message {
    constructor(body: json);
  }

  /**
   * Downloads (and clones) an external assetDownloads an external file.
   */
  export class DownloadAsset extends connector.Message {
    constructor(url: string);
  }

  /**
   * Checks and purges assetsChecks and purges assets for the SpeedKit.
   */
  export class RevalidateAssets extends connector.Message {
    constructor(body: json);
  }

  /**
   * Gets the statusGet the current status of the revalidation
   */
  export class GetRevalidationStatus extends connector.Message {
    constructor(id: string);
  }

  /**
   * List bucket indexesList all indexes of the given bucket
   */
  export class ListIndexes extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Create or drop bucket indexCreate or drop a index for the given bucket
   */
  export class CreateDropIndex extends connector.Message {
    constructor(bucket: string, body: json);
  }

  /**
   * Drop all indexesDrop all indexes on the given bucket
   */
  export class DropAllIndexes extends connector.Message {
    constructor(bucket: string);
  }

  /**
   * Method to register a new deviceRegisters a new devices
   */
  export class DeviceRegister extends connector.Message {
    constructor(body: json);
  }

  /**
   * Method to push a message to devicesPushes a message to devices
   */
  export class DevicePush extends connector.Message {
    constructor(body: json);
  }

  /**
   * Check if device is registeredChecks if the device is already registered
   */
  export class DeviceRegistered extends connector.Message {
    constructor();
  }

  /**
   * Generate VAPID KeysGenerate VAPID Keys for web push
   */
  export class VAPIDKeys extends connector.Message {
    constructor();
  }

  /**
   * Get VAPID Public KeyGet VAPID Public Key for web push
   */
  export class VAPIDPublicKey extends connector.Message {
    constructor();
  }

  /**
   * Set GCM-API-KeySets the GCM/FCM API-Key for Android Push
   */
  export class GCMAKey extends connector.Message {
    constructor(body: string);
  }

  /**
   * Upload APNS certificateUpload APNS certificate for IOS Push
   */
  export class UploadAPNSCertificate extends connector.Message {
    constructor();
  }
}

export namespace metamodel {

  export class Attribute {
    constructor(name: string, isMetadata?: boolean);
    /** Returns the previously attached state of the given object or collection */
    static getAttachedState(obj: any[] | Set<any> | Map<any, any>): any[] | null;
    /** Attach the the given state on the object or collection, in a meaner that it isn't enumerable */
    static attachState(obj: any[] | Set<any> | Map<any, any>, state: any[]): void;
    /** Returns the previously attached size of the given collection */
    static getAttachedSize(collection: Set<any> | Map<any, any>): number;
    /** Attach the the given size on the collection, in a meaner that it isn't enumerable */
    static attachSize(collection: Set<any> | Map<any, any>, size: any[]): void;
    readonly persistentAttributeType: Attribute.PersistentAttributeType;
    readonly isAssociation: boolean;
    readonly isCollection: boolean;
    isMetadata: boolean;
    isId: boolean;
    isVersion: boolean;
    isAcl: boolean;
    name: string;
    order: number;
    accessor: binding.Accessor;
    declaringType: metamodel.ManagedType;
    metadata: { [key: string]: string } | null;
    init(declaringType: metamodel.ManagedType, order: number): void;
    getValue(entity: object): any;
    setValue(entity: object, value: any): void;
    /** Retrieves whether this type has specific metadata */
    hasMetadata(key: string): boolean;
    /** Gets some metadata of this type */
    getMetadata(key: string): null | string;
    /** Gets this attribute value form the object as json */
    getJsonValue(state: util.State, object: any, options: object): any;
    /** Sets this attribute value from json to the object */
    setJsonValue(state: util.State, object: any, jsonValue: any, options: object): void;
    /** Converts this attribute field to json */
    toJSON(): json;
  }

  /**
   * Creates a new instance of a native db type
   */
  export class BasicType extends metamodel.Type {
    constructor(ref: string, typeConstructor: Class<any>, noResolving?: boolean);
    noResolving: boolean;
  }

  export class CollectionAttribute extends metamodel.PluralAttribute {
    constructor(name: string, elementType: metamodel.Type);
  }

  /**
   * Creates a new index instance which is needed to create andatabase index.
   */
  export class DbIndex {
    constructor(keys: string | { [key: string]: string } | { [key: string]: string }[], unique?: boolean);
    keys: { [key: string]: string }[];
    drop: boolean;
    /** Indicates if this index is for the given field or includes it in a compound index */
    hasKey(name: string): boolean;
    readonly isCompound: boolean;
    readonly isUnique: boolean;
    /** Returns a JSON representation of the Index object */
    toJSON(): json;
    static ASC: string;
    static DESC: string;
    static GEO: string;
    /** Returns DbIndex Object created from the given JSON */
    static fromJSON(json: json): metamodel.DbIndex;
  }

  export class EmbeddableType extends metamodel.ManagedType {
    constructor(ref: string, typeConstructor?: Class<binding.Entity>);
  }

  export class EntityType extends metamodel.ManagedType {
    constructor(ref: string, superType: metamodel.EntityType, typeConstructor?: Class<binding.Entity>);
    id: metamodel.SingularAttribute;
    version: metamodel.SingularAttribute;
    acl: metamodel.SingularAttribute;
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
    /** Gets all on this class referencing attributes */
    getReferencing(db: EntityManager, options?: { classes?: string[] }): Map<metamodel.ManagedType, Set<string>>;
    fromJsonValue(state: util.State, jsonObject: json, currentObject: any, options?: { persisting?: boolean, onlyMetadata?: boolean }): any;
    /** Converts the given object to json */
    toJsonValue(state: util.State, object: any, options?: { excludeMetadata?: boolean, depth?: number | boolean, persisting?: boolean }): json;
  }

  export class ListAttribute extends metamodel.PluralAttribute {
    constructor(name: string, elementType: metamodel.Type);
  }

  export class ManagedType extends metamodel.Type {
    constructor(ref: string, typeConstructor?: Class<binding.Managed>);
    validationCode: Function;
    typeConstructor: Class<binding.Managed>;
    enhancer: binding.Enhancer;
    declaredAttributes: metamodel.Attribute[];
    schemaAddPermission: util.Permission;
    schemaReplacePermission: util.Permission;
    metadata: { [key: string]: string } | null;
    /** Initialize this type */
    init(enhancer: binding.Enhancer): void;
    /** Creates an ProxyClass for this type */
    createProxyClass(): Class<any>;
    /** Creates an ObjectFactory for this type and the given EntityManager */
    createObjectFactory(db: EntityManager): binding.ManagedFactory<any>;
    /** Creates a new instance of the managed type, without invoking any constructorsThis method is used to create object instances which are loaded form the backend. */
    create(): object;
    /** An iterator which returns all attributes declared by this type and inherited form all super types */
    attributes(): Iterator<metamodel.Attribute>;
    /** Adds an attribute to this type */
    addAttribute(attr: metamodel.Attribute, order?: number): void;
    /** Removes an attribute from this type */
    removeAttribute(name: string): void;
    getAttribute(name: string): metamodel.Attribute;
    getDeclaredAttribute(val: string | number): metamodel.Attribute;
    /** Converts ths type schema to json */
    toJSON(): json;
    /** Returns iterator to get all referenced entities */
    references(): Iterator<'json' | 'text' | 'blob' | 'buffer' | 'arraybuffer' | 'data-url' | 'form'>;
    /** Retrieves whether this type has specific metadata */
    hasMetadata(key: string): boolean;
    /** Gets some metadata of this type */
    getMetadata(key: string): null | string;
  }

  export class MapAttribute extends metamodel.PluralAttribute {
    constructor(name: string, keyType: metamodel.Type, elementType: metamodel.Type, flags?: object);
    keyType: metamodel.Type;
  }

  /**
   * Constructs a new metamodel instance which represents the complete schema of one baqend app
   */
  export class Metamodel extends util.Lockable {
    constructor(entityManagerFactory?: EntityManagerFactory);
    isInitialized: boolean;
    entityManagerFactory: EntityManagerFactory;
    entities: { [key: string]: metamodel.EntityType };
    embeddables: { [key: string]: metamodel.EmbeddableType };
    baseTypes: { [key: string]: metamodel.BasicType };
    enhancer: binding.Enhancer;
    /** Prepare the Metamodel for custom schema creation */
    init(jsonMetamodel?: object): void;
    getRef(arg: Class<binding.Managed> | string): string;
    /** Return the metamodel entity type representing the entity. */
    entity(typeConstructor: Class<binding.Entity> | string): metamodel.EntityType;
    /** Return the metamodel basic type representing the native class. */
    baseType(typeConstructor: Class<any> | string): metamodel.BasicType;
    /** Return the metamodel embeddable type representing the embeddable class. */
    embeddable(typeConstructor: Class<binding.Managed> | string): metamodel.EmbeddableType;
    /** Return the metamodel managed type representing the entity, mapped superclass, or embeddable class. */
    managedType(typeConstructor: Class<binding.Managed> | string): metamodel.Type;
    addType(type: metamodel.Type): metamodel.Type;
    /** Load all schema data from the server */
    load(): Promise<metamodel.Metamodel>;
    /** Store all local schema data on the server, or the provided oneNote: The schema must be initialized, by init or load */
    save(managedType?: metamodel.ManagedType): Promise<metamodel.Metamodel>;
    /** Update the metamodel with the schemaThe provided data object will be forwarded to the UpdateAllSchemas resource.The underlying schema of this Metamodel object will be replaced by the result. */
    update(data: json): Promise<metamodel.Metamodel>;
    /** Get the current schema types as json */
    toJSON(): json;
    /** Replace the current schema by the provided one in json */
    fromJSON(json: json): void;
    /** Creates an index */
    createIndex(bucket: string, index: metamodel.DbIndex): Promise<any>;
    /** Drops an index */
    dropIndex(bucket: string, index: metamodel.DbIndex): Promise<any>;
    /** Drops all indexes */
    dropAllIndexes(bucket: string): Promise<any>;
    /** Loads all indexes for the given bucket */
    getIndexes(bucket: string): Promise<metamodel.DbIndex[]>;
  }

  export class ModelBuilder {
    constructor();
    models: { [key: string]: metamodel.ManagedType };
    modelDescriptors: { [key: string]: object };
    getModel(ref: string): metamodel.ManagedType;
    buildModels(modelDescriptors: object[]): { [key: string]: metamodel.ManagedType };
    buildModel(ref: string): metamodel.ManagedType;
    buildAttributes(model: metamodel.EntityType): void;
    buildAttribute(field: { name: string, type: string, order: number, metadata: { [key: string]: any } }): metamodel.Attribute;
  }

  export class PluralAttribute extends metamodel.Attribute {
    constructor(name: string, elementType: metamodel.Type);
    readonly collectionType: PluralAttribute.CollectionType;
    elementType: metamodel.Type;
    typeConstructor: Class<any>;
  }

  export class SetAttribute extends metamodel.PluralAttribute {
    constructor(name: string, elementType: metamodel.Type, flags?: object);
  }

  export class SingularAttribute extends metamodel.Attribute {
    constructor(name: string, type: metamodel.Type, isMetadata?: boolean);
    typeConstructor: Class<any>;
    type: metamodel.Type;
  }

  export class Type {
    constructor(ref: string, typeConstructor?: Class<any>);
    readonly persistenceType: number;
    readonly isBasic: boolean;
    readonly isEmbeddable: boolean;
    readonly isEntity: boolean;
    readonly isMappedSuperclass: boolean;
    ref: string;
    name: string;
    /** Merge the json data into the current object instance and returns the merged object */
    fromJsonValue(state: util.State, jsonValue: json, currentValue: any, options: { onlyMetadata?: boolean }): any;
    /** Converts the given object to json */
    toJsonValue(state: util.State, object: any, options: { excludeMetadata?: boolean, depth?: number | boolean }): json;
  }

  export namespace EntityType {

    export class Object extends metamodel.EntityType {
      constructor();
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
      ONE_TO_ONE = 6,
    }
  }

  export namespace PluralAttribute {

    export enum CollectionType {
      COLLECTION = 0,
      LIST = 1,
      MAP = 2,
      SET = 3,
    }
  }

  export namespace Type {

    export enum PersistenceType {
      BASIC = 0,
      EMBEDDABLE = 1,
      ENTITY = 2,
      MAPPED_SUPERCLASS = 3,
    }
  }
}

export namespace model {

  /**
   * Users are representations of people using the app.
   */
  export interface User extends binding.User {
  }

  /**
   * Roles are aggregations of multiple Users with a given purpose.
   */
  export interface Role extends binding.Role {
  }

  /**
   * Devices are connected to the app to be contactable.
   */
  export interface Device extends binding.Entity {
  }
}

export namespace partialupdate {

  export class EntityPartialUpdateBuilder<T> extends partialupdate.PartialUpdateBuilder<T> {
    constructor(entity: binding.Entity, operations: json);
    entity: binding.Entity;
  }

  export class PartialUpdateBuilder<T> {
    constructor(operations: json);
    operations: UpdateOperation[];
    /** Sets a field to a given value */
    set(field: string, value: any): this;
    /** Increments a field by a given value */
    inc(field: string, by?: number): this;
    /** Decrements a field by a given value */
    dec(field: string, by?: number): this;
    /** Multiplies a field by a given number */
    mul(field: string, multiplicator: number): this;
    /** Divides a field by a given number */
    div(field: string, divisor: number): this;
    /** Sets the highest possible value of a field */
    min(field: string, value: number): this;
    /** Sets the smallest possible value of a field */
    max(field: string, value: number): this;
    /** Removes an item from an array or map */
    remove(field: string, item: any): this;
    /** Puts an item from an array or map */
    put(field: string, key: string, value?: any): this;
    /** Pushes an item into a list */
    push(field: string, item: any): this;
    /** Unshifts an item into a list */
    unshift(field: string, item: any): this;
    /** Pops the last item out of a list */
    pop(field: string): this;
    /** Shifts the first item out of a list */
    shift(field: string): this;
    /** Adds an item to a set */
    add(field: string, item: any): this;
    /** Replaces an item at a given index */
    replace(path: string, index: number, item: any): this;
    /** Sets a datetime field to the current moment */
    currentDate(field: string): this;
    /** Performs a bitwise AND on a path */
    and(path: string, bitmask: number): this;
    /** Performs a bitwise OR on a path */
    or(path: string, bitmask: number): this;
    /** Performs a bitwise XOR on a path */
    xor(path: string, bitmask: number): this;
    /** Renames a field */
    rename(oldPath: string, newPath: string): this;
    /** Returns a JSON representation of this partial update */
    toJSON(): json;
    /** Executes the partial update */
    execute(): Promise<T>;
    /** Increments a field by a given value */
    increment(field: string, by?: number): this;
    /** Decrements a field by a given value */
    decrement(field: string, by?: number): this;
    /** Multiplies a field by a given number */
    multiply(field: string, multiplicator: number): this;
    /** Divides a field by a given number */
    divide(field: string, divisor: number): this;
    /** Sets the highest possible value of a field */
    atMost(field: string, value: number): this;
    /** Sets the smallest possible value of a field */
    atLeast(field: string, value: number): this;
    /** Sets a datetime field to the current moment */
    toNow(field: string): this;
  }

  export class UpdateOperation {
    constructor(operationName: string, path: string, value?: any);
  }
}

export namespace query {

  /**
   * The Query Builder allows creating filtered and combined queries
   */
  export class Builder<T> extends query.Query<T> implements query.Condition<T> {
    constructor();
    /** Joins the conditions by an logical AND */
    and(...args: (query.Query<T> | query.Query<T>[])[]): query.Operator<T>;
    /** Joins the conditions by an logical OR */
    or(...args: (query.Query<T> | query.Query<T>[])[]): query.Operator<T>;
    /** Joins the conditions by an logical NOR */
    nor(...args: (query.Query<T> | query.Query<T>[])[]): query.Operator<T>;
    /** Adds a filter to this query */
    addFilter(field: string, filter: string, value: any): query.Filter<T>;
    /** An object that contains filter rules which will be merged with the current filters of this query */
    where(conditions: json): query.Filter<T>;
    /** Adds a equal filter to the field. All other other filters on the field will be discarded */
    equal(field: string, value: any): query.Filter<T>;
    /** Adds a not equal filter to the field */
    notEqual(field: string, value: any): query.Filter<T>;
    /** Adds a greater than filter to the field */
    greaterThan(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a greater than or equal to filter to the field */
    greaterThanOrEqualTo(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a less than filter to the field */
    lessThan(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a less than or equal to filter to the field */
    lessThanOrEqualTo(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a between filter to the field. This is a shorthand for an less than and greater than filter. */
    between(field: string, greaterValue: number | string | Date | binding.Entity, lessValue: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a “in” filter to the fieldThe field value must be equal to one of the given values. */
    in(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a “not in” filter to the fieldThe field value must not be equal to any of the given values. */
    notIn(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a “is null” filter to the fieldThe field value must be null. */
    isNull(field: string): query.Filter<T>;
    /** Adds a “is not null” filter to the fieldThe field value must not be null. */
    isNotNull(field: string): query.Filter<T>;
    /** Adds a contains all filter to the collection fieldThe collection must contain all the given values. */
    containsAll(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a modulo filter to the fieldThe field value divided by divisor must be equal to the remainder. */
    mod(field: string, divisor: number, remainder: number): query.Filter<T>;
    /** Adds a regular expression filter to the fieldThe field value must matches the regular expression.<p>Note: Only anchored expressions (Expressions that starts with an ^) and the multiline flag are supported.</p> */
    matches(field: string, regExp: string | RegExp): query.Filter<T>;
    /** Adds a size filter to the collection fieldThe collection must have exactly size members. */
    size(field: string, size: number): query.Filter<T>;
    /** Adds a geopoint based near filter to the GeoPoint fieldThe GeoPoint must be within the maximum distanceto the given GeoPoint. Returns from nearest to farthest. */
    near(field: string, geoPoint: GeoPoint, maxDistance: number): query.Filter<T>;
    /** Adds a GeoPoint based polygon filter to the GeoPoint fieldThe GeoPoint must be contained within the given polygon. */
    withinPolygon(field: string, ...geoPoints: (GeoPoint | GeoPoint[])[]): query.Filter<T>;
    /** Adds a equal filter to the fieldAll other other filters on the field will be discarded. */
    eq(field: string, value: any): query.Filter<T>;
    /** Adds a not equal filter to the field */
    ne(field: string, value: any): query.Filter<T>;
    /** Adds a less than filter to the fieldShorthand for {@link query.Condition#lessThan}. */
    lt(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a less than or equal to filter to the fieldShorthand for {@link query.Condition#lessThanOrEqualTo}. */
    le(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a greater than filter to the fieldShorthand for {@link query.Condition#greaterThan}. */
    gt(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a greater than or equal to filter to the fieldShorthand for {@link query.Condition#greaterThanOrEqualTo}. */
    ge(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** The collection must contains one of the given valuesAdds a contains any filter to the collection field.Alias for {@link query.Condition#in}. */
    containsAny(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a filter to this query */
    addFilter(field: string, filter: string, value: any): query.Filter<T>;
  }

  /**
   * The Condition interface defines all existing query filters
   */
  export interface Condition<T> {
    /** An object that contains filter rules which will be merged with the current filters of this query */
    where(conditions: json): query.Filter<T>;
    /** Adds a equal filter to the field. All other other filters on the field will be discarded */
    equal(field: string, value: any): query.Filter<T>;
    /** Adds a not equal filter to the field */
    notEqual(field: string, value: any): query.Filter<T>;
    /** Adds a greater than filter to the field */
    greaterThan(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a greater than or equal to filter to the field */
    greaterThanOrEqualTo(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a less than filter to the field */
    lessThan(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a less than or equal to filter to the field */
    lessThanOrEqualTo(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a between filter to the field. This is a shorthand for an less than and greater than filter. */
    between(field: string, greaterValue: number | string | Date | binding.Entity, lessValue: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a “in” filter to the fieldThe field value must be equal to one of the given values. */
    in(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a “not in” filter to the fieldThe field value must not be equal to any of the given values. */
    notIn(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a “is null” filter to the fieldThe field value must be null. */
    isNull(field: string): query.Filter<T>;
    /** Adds a “is not null” filter to the fieldThe field value must not be null. */
    isNotNull(field: string): query.Filter<T>;
    /** Adds a contains all filter to the collection fieldThe collection must contain all the given values. */
    containsAll(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a modulo filter to the fieldThe field value divided by divisor must be equal to the remainder. */
    mod(field: string, divisor: number, remainder: number): query.Filter<T>;
    /** Adds a regular expression filter to the fieldThe field value must matches the regular expression.<p>Note: Only anchored expressions (Expressions that starts with an ^) and the multiline flag are supported.</p> */
    matches(field: string, regExp: string | RegExp): query.Filter<T>;
    /** Adds a size filter to the collection fieldThe collection must have exactly size members. */
    size(field: string, size: number): query.Filter<T>;
    /** Adds a geopoint based near filter to the GeoPoint fieldThe GeoPoint must be within the maximum distanceto the given GeoPoint. Returns from nearest to farthest. */
    near(field: string, geoPoint: GeoPoint, maxDistance: number): query.Filter<T>;
    /** Adds a GeoPoint based polygon filter to the GeoPoint fieldThe GeoPoint must be contained within the given polygon. */
    withinPolygon(field: string, ...geoPoints: (GeoPoint | GeoPoint[])[]): query.Filter<T>;
    /** Adds a equal filter to the fieldAll other other filters on the field will be discarded. */
    eq(field: string, value: any): query.Filter<T>;
    /** Adds a not equal filter to the field */
    ne(field: string, value: any): query.Filter<T>;
    /** Adds a less than filter to the fieldShorthand for {@link query.Condition#lessThan}. */
    lt(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a less than or equal to filter to the fieldShorthand for {@link query.Condition#lessThanOrEqualTo}. */
    le(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a greater than filter to the fieldShorthand for {@link query.Condition#greaterThan}. */
    gt(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a greater than or equal to filter to the fieldShorthand for {@link query.Condition#greaterThanOrEqualTo}. */
    ge(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** The collection must contains one of the given valuesAdds a contains any filter to the collection field.Alias for {@link query.Condition#in}. */
    containsAny(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a filter to this query */
    addFilter(field: string, filter: string, value: any): query.Filter<T>;
  }

  /**
   * A Filter saves the state for a filtered query
   */
  export class Filter<T> extends query.Node<T> implements query.Condition<T> {
    constructor(entityManager: EntityManager, resultClass: Class<T>);
    readonly filter: { [key: string]: any };
    /** Adds a filter to this query */
    addFilter(field: string, filter: string, value: any): query.Filter<T>;
    /** An object that contains filter rules which will be merged with the current filters of this query */
    where(conditions: json): query.Filter<T>;
    /** Adds a equal filter to the field. All other other filters on the field will be discarded */
    equal(field: string, value: any): query.Filter<T>;
    /** Adds a not equal filter to the field */
    notEqual(field: string, value: any): query.Filter<T>;
    /** Adds a greater than filter to the field */
    greaterThan(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a greater than or equal to filter to the field */
    greaterThanOrEqualTo(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a less than filter to the field */
    lessThan(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a less than or equal to filter to the field */
    lessThanOrEqualTo(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a between filter to the field. This is a shorthand for an less than and greater than filter. */
    between(field: string, greaterValue: number | string | Date | binding.Entity, lessValue: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a “in” filter to the fieldThe field value must be equal to one of the given values. */
    in(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a “not in” filter to the fieldThe field value must not be equal to any of the given values. */
    notIn(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a “is null” filter to the fieldThe field value must be null. */
    isNull(field: string): query.Filter<T>;
    /** Adds a “is not null” filter to the fieldThe field value must not be null. */
    isNotNull(field: string): query.Filter<T>;
    /** Adds a contains all filter to the collection fieldThe collection must contain all the given values. */
    containsAll(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a modulo filter to the fieldThe field value divided by divisor must be equal to the remainder. */
    mod(field: string, divisor: number, remainder: number): query.Filter<T>;
    /** Adds a regular expression filter to the fieldThe field value must matches the regular expression.<p>Note: Only anchored expressions (Expressions that starts with an ^) and the multiline flag are supported.</p> */
    matches(field: string, regExp: string | RegExp): query.Filter<T>;
    /** Adds a size filter to the collection fieldThe collection must have exactly size members. */
    size(field: string, size: number): query.Filter<T>;
    /** Adds a geopoint based near filter to the GeoPoint fieldThe GeoPoint must be within the maximum distanceto the given GeoPoint. Returns from nearest to farthest. */
    near(field: string, geoPoint: GeoPoint, maxDistance: number): query.Filter<T>;
    /** Adds a GeoPoint based polygon filter to the GeoPoint fieldThe GeoPoint must be contained within the given polygon. */
    withinPolygon(field: string, ...geoPoints: (GeoPoint | GeoPoint[])[]): query.Filter<T>;
    /** Adds a equal filter to the fieldAll other other filters on the field will be discarded. */
    eq(field: string, value: any): query.Filter<T>;
    /** Adds a not equal filter to the field */
    ne(field: string, value: any): query.Filter<T>;
    /** Adds a less than filter to the fieldShorthand for {@link query.Condition#lessThan}. */
    lt(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a less than or equal to filter to the fieldShorthand for {@link query.Condition#lessThanOrEqualTo}. */
    le(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a greater than filter to the fieldShorthand for {@link query.Condition#greaterThan}. */
    gt(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** Adds a greater than or equal to filter to the fieldShorthand for {@link query.Condition#greaterThanOrEqualTo}. */
    ge(field: string, value: number | string | Date | binding.Entity): query.Filter<T>;
    /** The collection must contains one of the given valuesAdds a contains any filter to the collection field.Alias for {@link query.Condition#in}. */
    containsAny(field: string, ...args: (any | any[])[]): query.Filter<T>;
    /** Adds a filter to this query */
    addFilter(field: string, filter: string, value: any): query.Filter<T>;
  }

  /**
   * A Query Node saves the state of the query being built
   */
  export class Node<T> extends query.Query<T> {
    constructor(entityManager: EntityManager, resultClass: Class<T>);
    readonly firstResult: number;
    readonly maxResults: number;
    readonly order: { [key: string]: number };
  }

  /**
   * An Operator saves the state of a combined query
   */
  export class Operator<T> extends query.Node<T> {
    constructor(entityManager: EntityManager, resultClass: Class<T>, operator: string, childs: query.Node<T>[]);
    readonly operator: string;
    readonly childs: query.Node<T>[];
  }

  /**
   * An abstract Query which allows retrieving results
   */
  export class Query<T> {
    constructor();
    readonly entityManager: EntityManager;
    readonly resultClass: Class<T>;
    /** Add an ascending sort for the specified field to this query */
    ascending(field: string): this;
    /** Add an decending sort for the specified field to this query */
    descending(field: string): this;
    /** Sets the sort of the query and discard all existing paramaters */
    sort(sort: { [key: string]: number }): this;
    /** Sets the offset of the query, i.e. how many elements should be skipped */
    offset(offset: number): this;
    /** Sets the limit of this query, i.e hox many objects should be returnd */
    limit(limit: number): this;
    /** Execute the query and return the query results as a ListNote: All local unsaved changes on matching objects, will be discarded. */
    resultList(options?: { depth?: number | boolean }, doneCallback?: (result: T[]) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<T[]>;
    /** Execute the query and return the query results as a ListNote: All local unsaved changes on matching objects, will be discarded. */
    resultList(doneCallback?: (result: T[]) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<T[]>;
    /** Execute the query that returns a single resultNote: All local unsaved changes on the matched object, will be discarded. */
    singleResult(options?: { depth?: number | boolean }, doneCallback?: (entity: T) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<T | null>;
    /** Execute the query that returns a single resultNote: All local unsaved changes on the matched object, will be discarded. */
    singleResult(doneCallback?: (entity: T) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<T | null>;
    /** Returns an observable that receives change events for a real-time queryMultiple subscriptions can be created on top of this observable:<pre><code>var query = DB.Todo.find();var options = { ... };var stream = query.eventStream(options);var sub = stream.subscribe(onNext, onError, onComplete);var otherSub = stream.subscribe(otherOnNext, otherOnError, otherOnComplete);</code></pre> */
    eventStream(options?: { initial?: boolean, matchTypes?: string | string[], operations?: string | string[] }): Observable<RealtimeEvent<T>>;
    /** Returns a subscription that handles change events for a real-time query.The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the streamobject first and then subscribe to the stream (see the other signature {@link #eventStream(options)}). */
    eventStream(options?: { initial?: boolean, matchTypes?: string | string[], operations?: string | string[] }, onNext?: (event: RealtimeEvent<T>) => any, onError?: (error: error.PersistentError) => Promise<any> | any, onComplete?: Function): Subscription;
    /** Returns a subscription that handles change events for a real-time query.The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the streamobject first and then subscribe to the stream (see the other signature {@link #eventStream(options)}). */
    eventStream(onNext?: (event: RealtimeEvent<T>) => any, onError?: (error: error.PersistentError) => Promise<any> | any, onComplete?: Function): Subscription;
    /** Returns an observable that receives the complete real-time query resultThe full result is received initially (i.e. on subscription) and on every change.var query = DB.Todo.find();var stream = query.resultStream();var sub = stream.subscribe(onNext, onError, onComplete);var otherSub = stream.subscribe(otherOnNext, otherOnError, otherOnComplete);</code></pre> */
    resultStream(options?: { reconnects?: number }): Observable<T[]>;
    /** Returns a subscription that handles the complete real-time query resultThe full result is received initially (i.e. on subscription) and on every change.The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the streamobject first and then subscribe to the stream (see the other signature {@link #resultStream(options)}). */
    resultStream(options?: { reconnects?: number }, onNext?: (result: T[]) => any, onError?: (error: error.PersistentError) => Promise<any> | any, onComplete?: Function): Subscription;
    /** Returns a subscription that handles the complete real-time query resultThe full result is received initially (i.e. on subscription) and on every change.The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the streamobject first and then subscribe to the stream (see the other signature {@link #resultStream(options)}).As the real-time query will reconnect infinitely often, there is no onComplete callback. (In other words, theobservable will never complete.) */
    resultStream(onNext?: (result: T[]) => any, onError?: (error: error.PersistentError) => Promise<any> | any): Subscription;
    /** Execute the query that returns the matching objects count. */
    count(doneCallback?: (count: number) => Promise<any> | any, failCallback?: (error: error.PersistentError) => Promise<any> | any): Promise<number>;
  }

  export class Stream {
    constructor();
    /** Creates a live updating object stream for a query */
    static createStream<T>(entityManager: EntityManager, query: string | { query: string, bucket: string, sort?: string, limit?: number, offset?: number, initial?: boolean }, options: Partial<{ initial: boolean, matchTypes: string[], operations: string[], reconnects: number }>): Observable<RealtimeEvent<T>>;
    /** Creates a live updating result stream for a query */
    static createStreamResult<T>(entityManager: EntityManager, query: string | { query: string, bucket: string, sort?: string, limit?: number, offset?: number }, options: Partial<{ initial: boolean, matchTypes: string[], operations: string[], reconnects: number }>): Observable<T[]>;
    /** Parses the StreamOptions */
    static parseOptions(options?: Partial<{ initial: boolean, matchTypes: string[], operations: string[], reconnects: number }>): { initial: boolean, matchTypes: string[], operations: string[], reconnects: number };
  }
}

export namespace util {

  /**
   * Converts Base64-encoded data to string.
   */
  export function atob(input: string): string;

  /**
   * Calculates a Keyed-Hash Message Authentication Code (HMAC) from a message and a key.
   */
  export function hmac(message: string, key: string): string;

  /**
   * Generates a new Universally Unique Identifier (UUID) version 4.
   */
  export function uuid(): string;

  /**
   * Representation of a Code which runs on Baqend.
   */
  export class Code {
    constructor(metamodel: metamodel.Metamodel, entityManagerFactory: EntityManagerFactory);
    metamodel: metamodel.Metamodel;
    entityManagerFactory: EntityManagerFactory;
    /** Converts the given function to a string */
    functionToString(fn: Function): string;
    /** Converts the given string to a module wrapper function */
    stringToFunction(signature: string[], code: string): Function;
    /** Loads a list of all available modules without handlers */
    loadModules(): Promise<string[]>;
    /** Loads Baqend code which will be identified by the given bucket and code type */
    loadCode(type: metamodel.ManagedType | string, codeType: string, asFunction: true): Promise<Function>;
    /** Loads Baqend code which will be identified by the given bucket and code type */
    loadCode(type: metamodel.ManagedType | string, codeType: string, asFunction?: false): Promise<string>;
    /** Saves Baqend code which will be identified by the given bucket and code type */
    saveCode(type: metamodel.ManagedType | string, codeType: string, fn: string): Promise<string>;
    /** Saves Baqend code which will be identified by the given bucket and code type */
    saveCode(type: metamodel.ManagedType | string, codeType: string, fn: Function): Promise<Function>;
    /** Deletes Baqend code identified by the given bucket and code type */
    deleteCode(type: metamodel.ManagedType | string, codeType: string): Promise<any>;
  }

  /**
   * This base class provides an lock interface to execute exclusive operations
   */
  export class Lockable {
    constructor();
    isReady: boolean;
    /** Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled */
    ready(doneCallback?: (entity: this) => Promise<any> | any, failCallback?: (error: Error) => Promise<any> | any): Promise<this>;
    /** Try to aquire an exclusive lock and executes the given callback. */
    withLock<T>(callback: Function, critical?: boolean): Promise<T>;
  }

  /**
   * A Logger to store log notes when running the app.
   */
  export class Logger {
    constructor();
    /** Creates a Logger instance for the given EntityManager */
    static create(entityManager: EntityManager): util.Logger;
    level: string;
    /** Logs a message in the default level 'info' */
    log(message: string, ...args: any[]): void;
    /** Logs a message in the default level 'info' */
    log(message: string, data?: { [key: string]: any }): void;
    /** Logs a message with the given log level */
    log(level: string, message: string, ...args: any[]): void;
    /** Logs a message with the given log level */
    log(level: string, message: string, data?: { [key: string]: any }): Promise<any> | null;
    entityManager: EntityManager;
    /** Log message at trace level */
    trace(message: string, ...args: any[]): Promise<any> | null;
    /** Log message at trace level */
    trace(message: string, data?: { [key: string]: any }): Promise<any> | null;
    /** Log message at debug level */
    debug(message: string, ...args: any[]): Promise<any> | null;
    /** Log message at debug level */
    debug(message: string, data?: { [key: string]: any }): Promise<any> | null;
    /** Log message at info level */
    info(message: string, ...args: any[]): Promise<any> | null;
    /** Log message at info level */
    info(message: string, data?: { [key: string]: any }): Promise<any> | null;
    /** Log message at warn level */
    warn(message: string, ...args: any[]): Promise<any> | null;
    /** Log message at warn level */
    warn(message: string, data?: { [key: string]: any }): Promise<any> | null;
    /** Log message at error level */
    error(message: string, ...args: any[]): Promise<any> | null;
    /** Log message at error level */
    error(message: string, data?: { [key: string]: any }): Promise<any> | null;
  }

  /**
   * The Metadata instance tracks the state of an object and checks if the object state was changed since lastload/update. The metadata keeps therefore the state of:- in which state the object currently is- which db managed the instance- the metadata of the object (id, version, bucket)- which is the owning object (root object) of an embedded object{@link util.Metadata#get(object)} can be used on any managed object to retrieve the metadata of the root object
   */
  export class Metadata extends util.Lockable implements util.State {
    constructor(type: metamodel.ManagedType);
    /** Creates a metadata instance for the given type and object instance */
    static create(type: metamodel.EntityType): util.Metadata;
    /** Returns the metadata of the managed object */
    static get(managed: binding.Managed): util.Metadata;
    readonly bucket: string;
    readonly key: string;
    readonly isAttached: boolean;
    readonly isAvailable: boolean;
    readonly isPersistent: boolean;
    readonly isDirty: boolean;
    id: string;
    version: number;
    acl: Acl;
    /** Enable/Disable state change tracking of this object */
    enable(newStateTrackingState: boolean): void;
    /** Throws the corresponding error if a property is accessed before the owning object is loaded */
    throwUnloadedPropertyAccess(): void;
    /** Indicates that the associated object isn't available */
    setUnavailable(): void;
    /** Indicates that the associated object is not staleAn object is stale if it correlates the database state and is not modified by the user. */
    setPersistent(): void;
    /** Indicates the the object is modified by the user */
    setDirty(): void;
    /** Indicates the the object is removed */
    setRemoved(): void;
    type: metamodel.ManagedType;
    db: EntityManager | null;
    setDirty(): void;
  }

  /**
   * An executor of Modules running on Baqend.
   */
  export class Modules {
    constructor(entityManager: EntityManager);
    entityManager: EntityManager;
    /** Calls the module, which is identified by the given bucketThe optional query parameter will be attached as GET-parameters. */
    get(bucket: string, query?: { [key: string]: string } | string, options?: { responseType?: string }, doneCallback?: Function, failCallback?: Function): Promise<any>;
    /** Calls the module, which is identified by the given bucket */
    post(bucket: string, body?: string | Blob | File | ArrayBuffer | FormData | json, options?: { requestType?: string, mimeType?: string, responseType?: string }, doneCallback?: Function, failCallback?: Function): Promise<any>;
  }

  /**
   * An aggregation of access rules for given object metadata.
   */
  export class Permission {
    constructor(metadata?: util.Metadata);
    rules: { [key: string]: string };
    _metadata: util.Metadata;
    /** Returns a list of user and role references of all rules */
    allRules(): string[];
    /** Removes all rules from this permission object */
    clear(): void;
    /** Copies permissions from another permission object */
    copy(permission: util.Permission): util.Permission;
    /** Gets whenever all users and roles have the permission to perform the operation */
    isPublicAllowed(): boolean;
    /** Sets whenever all users and roles should have the permission to perform the operationNote: All other allow rules will be removed. */
    setPublicAllowed(): void;
    /** Returns the actual rule of the given user or role. */
    getRule(userOrRole: model.User | model.Role | string): string;
    /** Checks whenever the user or role is explicit allowed to perform the operation. */
    isAllowed(userOrRole: model.User | model.Role | string): boolean;
    /** Checks whenever the user or role is explicit denied to perform the operation. */
    isDenied(userOrRole: model.User | model.Role | string): boolean;
    /** Allows the given users or rules to perform the operation */
    allowAccess(...userOrRole: (model.User | model.Role | string)[]): util.Permission;
    /** Denies the given users or rules to perform the operation */
    denyAccess(...userOrRole: (model.User | model.Role | string)[]): util.Permission;
    /** Deletes any allow/deny rules for the given users or roles */
    deleteAccess(...userOrRole: (model.User | model.Role | string)[]): util.Permission;
    /** A Json representation of the set of rules */
    toJSON(): json;
    /** Sets the permission rules from json */
    fromJSON(json: json): void;
    /** Creates a permission from the given rules. */
    static fromJSON(json: json): util.Permission;
  }

  /**
   * PushMessages are used to send a push notification to a set of devices
   */
  export class PushMessage {
    constructor(devices?: Iterable<binding.Entity>, message?: string, subject?: string, options?: string | { icon?: string, badge?: string | number, nativeBadge?: number, webBadge?: string, image?: string, actions?: object, dir?: string, sound?: string, tag?: string, vibrate?: number[], renotify?: boolean, requireInteraction?: boolean, silent?: boolean, data?: any }, badge?: string | number, data?: any);
    readonly devices: Set<model.Device>;
    readonly message: string;
    readonly subject: string;
    /** Adds a new object to the set of devices */
    addDevice(device: binding.Entity): void;
    /** Converts the push message to JSON */
    toJSON(): json;
  }

  export interface State {
    type: metamodel.ManagedType;
    db: EntityManager | null;
    setDirty(): void;
  }

  export interface TokenStorageFactory {
    /** Creates a new tokenStorage which persist tokens for the given origin */
    create(origin: string): Promise<TokenStorage>;
  }

  export class TokenStorage {
    constructor(origin: string, token: string, temporary?: boolean);
    /** Parse a token string in its components */
    static parse(token: string): object;
    temporary: boolean;
    /** Use the underlying storage implementation to save the token */
    saveToken(origin: string, token: string, temporary: boolean): void;
    /** @deprecated Use TokenStorage#saveToken instead */
    _saveToken(origin: string, token: string, temporary: boolean): void;
    /** Update the token for the givin origin, the operation may be asynchronous */
    update(token: String): void;
    /** Derives a resource token from the stored origin token and signs the resource with the generated resource token */
    signPath(resource: string): string;
    static GLOBAL: util.TokenStorageFactory;
    static WEB_STORAGE: util.TokenStorageFactory;
  }

  export class ValidationResult {
    constructor();
  }

  export class Validator {
    constructor();
    /** Compiles the given validation code for the managedType */
    static compile(managedType: metamodel.ManagedType, validationCode: string): void;
    /** Executes the given validation function to validate the value.The value will be passed as the first parameter to the validation function andthe library {@link https://github.com/chriso/validator.js} as the second one.If the function returns true the value is valid, otherwise it's invalid. */
    is(fn: Function): util.Validator;
    /** Executes the given validation function to validate the value.The value will be passed as the first parameter to the validation function andthe library {@link https://github.com/chriso/validator.js} as the second one.If the function returns true the value is valid, otherwise it's invalid. */
    is(error: string, fn: Function): util.Validator;
    key: string;
  }

  export namespace Metadata {

    export enum Type {
      UNAVAILABLE = -1,
      PERSISTENT = 0,
      DIRTY = 1,
    }
  }
}