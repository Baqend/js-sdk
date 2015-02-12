/*!
* The Baqend JavaScript SDK 0.9.0
* http://baqend.com
*
* Copyright (c) 2015 Baqend GmbH
*
* Includes:
* jahcode - http://jahcode.com/
* Copyright (c) 2011-2013 Florian Buecklers
*
* lie - https://github.com/calvinmetcalf/lie
* Copyright (c) 2014 Calvin Metcalf
*
* node-uuid - http://github.com/broofa/node-uuid
* Copyright (c) 2010-2012 Robert Kieffer
*
* validator - http://github.com/chriso/validator.js
* Copyright (c) 2015 Chris O'Hara <cohara87@gmail.com>
*
* Released under the MIT license
*
* Date: Thu, 12 Feb 2015 18:37:57 GMT
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DB=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var uuid = require('node-uuid');

var message = require('./message');
var error = require('./error');

var EntityTransaction = require('./EntityTransaction');
var Query = require('./Query');
var TypedQuery = require('./TypedQuery');
var Validator = require('./util/Validator');
var ValidationResult = require('./util/ValidationResult');
var Lockable = require('./util/Lockable');
var Metadata = require('./util/Metadata');
var StatusCode = require('./connector/Message').StatusCode;

/**
 * @class baqend.EntityManager
 * @extends baqend.util.Lockable
 *
 * @param {baqend.EntityManagerFactory} entityManagerFactory The factory which of this entityManager instance
 * @param {Boolean=} global <code>true</code> to use the global authorization mechanism via cookies,
 *                          <code>false</code> to use token base authorization
 */
var EntityManager = module.exports = Object.inherit(Lockable, /** @lends baqend.EntityManager.prototype */ {

  Collection: require('./collection').Collection,
  List: require('./collection').List,
  Set: require('./collection').Set,
  Map: require('./collection').Map,

  GeoPoint: require('./GeoPoint'),

  /**
   * @type baqend.EntityManagerFactory
   */
  entityManagerFactory: null,

  /**
   * @type baqend.metamodel.Metamodel
   */
  metamodel: null,

  /**
   * @type baqend.metamodel.Code
   */
  code: null,

  /**
   * The connector used for baqend requests
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * All managed and cached entity instances
   * @type object<String,baqend.binding.Entity>
   */
  _entities: null,

  /**
   * Determine whether the entity manager is open.
   * true until the entity manager has been closed
   * @type Boolean
   */
  get isOpen() {
    return !!this._connector;
  },

  /**
   * The authentication token used in secured requests
   * @type String
   */
  token: null,

  /**
   * The current logged in user object
   * @type baqend.binding.User
   */
  me: null,

  /**
   * An User factory for user objects.
   * The User factory can be called to create new instances of users or can be used to register/login/logout users.
   * @type baqend.binding.UserFactory
   */
  User: null,

  /**
   * Returns true if this EntityManager is the global one, otherwise false.
   * @returns {boolean} isGlobal
   */
  isGlobal: false,

  /**
   * Calls the baqend code, which is identified by the given bucket.
   * The object parameter will be used as the "this" object.
   *
   * @param {String} bucket Name of the baqend code
   * @param {Object=} obj Input of the baqend code function
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<Object>}
   */
  run: function(bucket, obj, doneCallback, failCallback) {
      if(Function.isInstance(obj)) {
        failCallback = doneCallback;
        doneCallback = obj;
        obj = null;
      }
      return this.code.callCode(bucket, obj, this.token, this).then(doneCallback, failCallback);
  },

  initialize: function(entityManagerFactory, global) {
    this.entityManagerFactory = entityManagerFactory;
    this.metamodel = entityManagerFactory.metamodel;
    this.code = entityManagerFactory.code;
    this.isGlobal = !!global;

    this.lock();
  },

  /**
   * Connects this entityManager, used for synchronous and asynchronous inistialization
   * @param {baqend.connector.Connector} connector
   */
  connected: function(connector) {
    this._connector = connector;
    this._entities = {};

    this._createObjectFactory(this.metamodel.embeddables);
    this._createObjectFactory(this.metamodel.entities);

    this.transaction = new EntityTransaction(this);

    if (this.isGlobal) {
      var msg = new message.Me();
      msg.withAuthorizationToken();
      return this._userRequest(msg).then(function() {
        this.unlock();
      }.bind(this));
    } else {
      this.unlock();
    }
  },

  /**
   * @param {baqend.metamodel.ManagedType[]} types
   * @return {baqend.binding.ManagedFactory}
   * @private
   */
  _createObjectFactory: function(types) {
    Object.keys(types).forEach(function(ref) {
      var type = this.metamodel.managedType(ref);
      var name = type.name;

      if (this[name]) {
        type.typeConstructor = this[name];
        Object.defineProperty(this, name, {
          value: type.createObjectFactory(this)
        });
      } else {
        Object.defineProperty(this, name, {
          get: function() {
            Object.defineProperty(this, name, {
              value: type.createObjectFactory(this)
            });

            return this[name];
          },
          set: function(typeConstructor) {
            type.typeConstructor = typeConstructor;
          },
          configurable: true
        });
      }
    }, this);
  },

  _send: function(message) {
    message.withAuthorizationToken(this.token);
    return this._connector.send(message).then(function() {
      var token = message.getAuthorizationToken();
      if (token)
        this.token = token;

      return message;
    }.bind(this));
  },

  /**
   * Get an instance, whose state may be lazily fetched. If the requested instance does not exist
   * in the database, the EntityNotFoundError is thrown when the instance state is first accessed.
   * The application should not expect that the instance state will be available upon detachment,
   * unless it was accessed by the application while the entity manager was open.
   *
   * @param {(Function|String)} entityClass
   * @param {String=} id
   */
  getReference: function(entityClass, id) {
    if (String.isInstance(entityClass)) {
      if (!id) {
        // /db/class/id
        var index = entityClass.lastIndexOf('/');
        id = decodeURIComponent(entityClass.substring(index + 1));
        entityClass = entityClass.substring(0, index);
      }
    }

    var type = this.metamodel.entity(entityClass);

    var entity = this._entities[type.ref + '/' + encodeURIComponent(id)];
    if (!entity) {
      entity = type.create();
      var metadata = Metadata.get(entity);
      metadata.id = id;
      metadata.setUnavailable();

      this._attach(entity);
    }

    return entity;
  },

  /**
   * Create an instance of Query or TypedQuery for executing a query language statement.
   * if the optional resultClass argument is provided, the select list of the query must contain
   * only a single item, which must be assignable to the type specified by the resultClass argument.
   *
   * @param {String|Object} qlString - a query string or object
   * @param {String|Function=} resultClass - the optional type of the query result
   */
  createQuery: function(qlString, resultClass) {
    if (String.isInstance(qlString)) {
      return new TypedQuery(this, qlString, resultClass);
    }
  },

  /**
   * Creates an instance of Query.Builder for query creation and execution. The Query results are instances of the
   * resultClass argument.
   * @param {Function=} resultClass - the type of the query result
   * @return {baqend.Query.Builder} A query builder to create one ore more queries for the specified class
   */
  createQueryBuilder: function(resultClass) {
    return new Query.Builder(this, resultClass);
  },

  /**
   * Clear the persistence context, causing all managed entities to become detached.
   * Changes made to entities that have not been flushed to the database will not be persisted.
   */
  clear: function() {
    // TODO: reimplement this
    return this.yield().then(function() {
      for (var ref in this._entities) {
        this.removeReference(this._entities[ref]);
      }
    }.bind(this));
  },

  /**
   * Close an application-managed entity manager. After the close method has been invoked,
   * all methods on the EntityManager instance and any Query and TypedQuery objects obtained from it
   * will throw the IllegalStateError except for transaction, and isOpen (which will return false).
   * If this method is called when the entity manager is associated with an active transaction,
   * the persistence context remains managed until the transaction completes.
   */
  close: function(doneCallback, failCallback) {
    this._connector = null;

    return this.clear(doneCallback, failCallback);
  },

  /**
   * Check if the instance is a managed entity instance belonging to the current persistence context.
   * @param {baqend.binding.Entity} entity - entity instance
   * @returns {Boolean} boolean indicating if entity is in persistence context
   */
  contains: function(entity) {
    var metadata = Metadata.get(entity);
    return !!metadata && this._entities[metadata.ref] === entity;
  },

  /**
   * Check if an object with the id from the given entity is already attached.
   * @param {baqend.binding.Entity} entity - entity instance
   * @returns {Boolean} boolean indicating if entity with same id is attached
   */
  containsById: function(entity) {
    var type = this.metamodel.entity(entity.constructor);
    var ref = type.ref + '/' + entity.id;
    return !!this._entities[ref];
  },

  /**
   * Remove the given entity from the persistence context, causing a managed entity to become detached.
   * Unflushed changes made to the entity if any (including removal of the entity),
   * will not be synchronized to the database. Entities which previously referenced the detached entity will continue to reference it.
   * @param {baqend.binding.Entity} entity - entity instance
   */
  detach: function(entity) {
    return entity.withLock(function() {
      this.removeReference(entity);
      return entity;
    });
  },

  /**
   * Find by object ID. Search for an entity of the specified oid.
   * If the entity instance is contained in the persistence context, it is returned from there.
   * @param {(Function|String)} entityClass - entity class
   * @param {String} oid - Object ID
   * @param {boolean} refresh
   * @param {boolean|Number} depth
   * @param {Array=} resolved
   * @return {Promise<baqend.binding.Entity>}
   */
  find: function(entityClass, oid, refresh, depth, resolved) {
    resolved = resolved || [];
    var entity = this.getReference(entityClass, oid);
    var state = Metadata.get(entity);

      var tid = 0;

      //TODO: implement transactional changed case
      //if (this.transaction.isChanged(ref))
      //  tid = this.transaction.tid;

    var msg = new message.GetObject(state.bucket, state.id);

    //msg.setCacheControl('max-age=0,no-cache');

    if (state.version || refresh) {
      // force a refresh with a unused eTag
      msg.setIfNoneMatch(refresh? '': state.version);
    }

    return this._send(msg).then(function(msg) {
      if (msg.response.statusCode != StatusCode.NOT_MODIFIED) {
        state.setDatabaseObject(msg.response.entity);
      }

      state.setPersistent();

      var subPromise = [];
      if(depth) {
        this.getSubEntities(entity, 1).forEach(function(subEntity) {
          if(!~resolved.indexOf(subEntity)) {
            resolved.push(subEntity);
            var metadata = Metadata.get(subEntity);
            subPromise.push(this.find(subEntity.constructor, metadata.id, refresh, depth === true ? depth : depth-1, resolved));
          }
        }.bind(this));
      }

      return Promise.all(subPromise).then(function() {
        return entity;
      });
    }.bind(this), function(e) {
      if (e.statusCode == StatusCode.OBJECT_NOT_FOUND) {
        this.removeReference(entity);
        state.setRemoved();
        return null;
      } else {
        throw e;
      }
    }.bind(this));
  },

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Object} options
   * @return {Promise<baqend.binding.Entity>}
   */
  insert: function(entity, options) {
    options = options || {};
    var isNew;

    return this._save(entity, options.refresh, options.depth, function(state) {
      if (state.version)
        throw new Error('Existing objects can\'t be inserted.');

      isNew = !state.id;

      return new message.CreateObject(state.bucket, state.getDatabaseObject());
    }).then(function(val) {
      if (isNew)
        this._attach(entity);

      return val;
    }.bind(this));
  },

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Object} options
   * @return {Promise<baqend.binding.Entity>}
   */
  update: function(entity, options) {
    options = options || {};

    return this._save(entity, options.refresh, options.depth, function(state) {
      if(!state.version)
        throw new Error("New objects can't be inserted.");

      if (options.force) {
        var msg = new message.ReplaceObject(state.bucket, state.id, state.getDatabaseObject(true));
        msg.setIfMatch('*');
        return msg;
      } else {
        msg = new message.ReplaceObject(state.bucket, state.id, state.getDatabaseObject(false));
        msg.setIfMatch(state.version);
        return msg;
      }
    });
  },

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Object} options The save options
   * @return {Promise<baqend.binding.Entity>}
   */
  save: function(entity, options) {
    options = options || {};

    return this._save(entity, options.refresh, options.depth, function(state) {
      if (options.force) {
        if (!state.id)
          throw new Error("New special objects can't be forcedly saved.");

        return new message.ReplaceObject(state.bucket, state.id, state.getDatabaseObject(true));
      } else if (state.version) {
        var msg = new message.ReplaceObject(state.bucket, state.id, state.getDatabaseObject(false));
        msg.setIfMatch(state.version);
        return msg;
      } else {
        return new message.CreateObject(state.bucket, state.getDatabaseObject());
      }
    });
  },

  /**
   * Save the object state
   * @param {baqend.binding.Entity} entity
   * @param {Boolean} refresh
   * @param {Number|Boolean} depth
   * @param {Function} msgFactory
   * @return {Promise.<baqend.binding.Entity>}
   * @private
   */
  _save: function(entity, refresh, depth, msgFactory) {
    this.attach(entity);

    return entity.withLock(function() {
      var state = Metadata.get(entity);
      var refPromises = [];
      this.getSubEntities(entity, depth).forEach(function(sub) {
        refPromises.push(this._save(sub, refresh, 0, msgFactory));
      }.bind(this));

      if (state.isDirty) {
        if(!refresh) {
          state.setPersistent();
        }

        var sendPromise = this._send(msgFactory(state)).then(function(msg) {
          if(refresh) {
            state.setDatabaseObject(msg.response.entity);
            state.setPersistent();
          } else {
            state.setDatabaseObjectInfo(msg.response.entity._objectInfo);
          }
          return entity;
        }.bind(this), function(e) {
          if (e.statusCode == StatusCode.OBJECT_NOT_FOUND) {
            this.removeReference(entity);
            state.setRemoved();
            return null;
          } else {
            state.setDirty();
            throw e;
          }
        }.bind(this));

        refPromises.unshift(sendPromise);
      } else {
        refPromises.unshift(Promise.resolve(entity));
      }
      return Promise.all(refPromises).then(function() {
        return entity
      });
    }.bind(this));
  },

  /**
   * Returns all referenced sub entities for the given depth and root entity
   * @param {baqend.binding.Entity} entity
   * @param {Boolean|Number} depth
   * @param {baqend.binding.Entity[]} [resolved]
   * @param {baqend.binding.Entity=} initialEntity
   * @returns {baqend.binding.Entity[]}
   */
  getSubEntities: function(entity, depth, resolved, initialEntity) {
    resolved = resolved || [];
    if(!depth) {
      return resolved;
    }
    initialEntity = initialEntity || entity;

    var state = Metadata.get(entity);
    for (var iter = state.type.references(), item = iter.next(); !item.done; item = iter.next()) {
      this.getSubEntitiesByPath(entity, item.value.path).forEach(function(subEntity) {
        if(!~resolved.indexOf(subEntity) && subEntity != initialEntity) {
          resolved.push(subEntity);
          resolved = this.getSubEntities(subEntity, depth === true ? depth : depth-1, resolved, initialEntity);
        }
      }.bind(this));
    }

    return resolved;
  },

  /**
   * Returns all referenced one level sub entities for the given path
   * @param {baqend.binding.Entity} entity
   * @param {Array} path
   * @returns {baqend.binding.Entity[]}
   */
  getSubEntitiesByPath: function(entity, path) {
    var subEntities = [entity];

    path.forEach(function(attributeName) {

      var tmpSubEntities = [];
      subEntities.forEach(function(subEntity) {
        var curEntity = subEntity[attributeName];
        if(!curEntity)
          return;

        var attribute = this.metamodel.managedType(subEntity.constructor).getAttribute(attributeName);
        if(attribute.isCollection) {
          for (var colIter = curEntity.items(), colItem = colIter.next(); !colItem.done; colItem = colIter.next()) {
            tmpSubEntities.push(colItem.value);
            attribute.keyType && attribute.keyType.isEntity && tmpSubEntities.push(colItem.index);
          }
        } else {
          tmpSubEntities.push(curEntity);
        }
      }.bind(this));
      subEntities = tmpSubEntities;

    }.bind(this));

    return subEntities;
  },

  /**
   * Remove the entity instance.
   * @param {baqend.binding.Entity} entity
   * @param {Object} options The remove options
   * @return {Promise<baqend.binding.Entity>}
   */
  remove: function(entity, options) {
    options = options || {};

    this.attach(entity);

    return entity.withLock(function() {
      var state = Metadata.get(entity);
      var refPromises = [];
      this.getSubEntities(entity, options.depth).forEach(function(sub) {
        refPromises.push(this.remove(sub, options.force));
      }.bind(this));

      if(!state.version && !options.force)
        throw new error.IllegalEntityError(entity);

      var msg = new message.DeleteObject(state.bucket, state.id, state.getDatabaseObjectInfo(options.force));

      if (!options.force)
        msg.setIfMatch(state.version);

      var sendPromise = this._send(msg).then(function() {
        this.removeReference(entity);
        state.setRemoved();
        return entity;
      }.bind(this));

      refPromises.unshift(sendPromise);

      return Promise.all(refPromises).then(function() {
        return entity;
      });
    }.bind(this));
  },

  /**
   * Synchronize the persistence context to the underlying database.
   *
   * @returns {baqend.Promise}
   */
  flush: function(doneCallback, failCallback) {
    // TODO: implement this
  },

  /**
   * Make an instance managed and persistent.
   * @param {baqend.binding.Entity} entity - entity instance
   */
  persist: function(entity) {
    entity.attach(this);
  },

  /**
   * Refresh the state of the instance from the database, overwriting changes made to the entity, if any.
   * @param {baqend.binding.Entity} entity - entity instance
   * @param {Object} options The save options
   * @return {Promise<baqend.binding.Entity>}
   */
  refresh: function(entity, options) {
    options = options || {};

    return this.find(entity.constructor, entity._metadata.id, true, options.depth);
  },

  /**
   * Attach the instance to this database context, if it is not already attached
   * @param {baqend.binding.Entity} entity The entity to attach
   */
  attach: function(entity) {
    if (!this.contains(entity)) {
      var type = this.metamodel.entity(classOf(entity));
      if (!type)
        throw new error.IllegalEntityError(entity);

      if(this.containsById(entity))
        throw new error.EntityExistsError(entity);

      this._attach(entity);
    }
  },

  _attach: function(entity) {
    var metadata = Metadata.get(entity);
    if (metadata.isAttached) {
      if (metadata.db != this) {
        throw new error.EntityExistsError(entity);
      }
    } else {
      metadata.db = this;
    }

    if (!metadata.id) {
      if (metadata.type.name != 'User' && metadata.type.name != 'Role') {
        metadata.id = uuid.v4();
      }
    }

    if (metadata.id) {
      this._entities[metadata.ref] = entity;
    }
  },

  removeReference: function(entity) {
    var state = Metadata.get(entity);
    if (!state)
      throw new error.IllegalEntityError(entity);

    delete this._entities[state.ref];
  },

  register: function(username, password) {
    if (this.me)
      throw new Error('User is already logged in.');

    return this.withLock(function() {
      var msg = new message.Register({
        loginId: username,
        password: password,
        global: this.isGlobal
      });

      return this._userRequest(msg);
    }.bind(this));
  },

  login: function(username, password) {
    if (this.me)
      throw new Error('User is already logged in.');

    return this.withLock(function() {
      var msg = new message.Login({
        loginId: username,
        password: password,
        global: this.isGlobal
      });

      return this._userRequest(msg);
    }.bind(this));
  },

  logout: function() {
    return this.withLock(function() {
      var logout = function() {
        this.me = null;
        this.token = null;
      }.bind(this);
      return this.isGlobal ? this._send(new message.Logout()).then(logout) : Promise.resolve(logout());
    }.bind(this));
  },

  renew: function() {
    return this.withLock(function() {
      var msg = new message.Me();
      msg.withAuthorizationToken(this.token);
      return this._userRequest(msg);
    }.bind(this));
  },

  _userRequest: function(msg) {
    return this._send(msg).then(function() {
      var token = msg.getAuthorizationToken();
      if (token)
        this.token = token;

      var id = msg.response.entity._objectInfo.id;
      var user = this.getReference('User', id);
      var metadata = Metadata.get(user);
      metadata.setDatabaseObject(msg.response.entity);
      metadata.setPersistent();
      return this.me = user;
    }.bind(this), function(e) {
      if (e.statusCode == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    });
  },

  /**
   * The given entity will be checked by the validation code of the entity type.
   *
   * @param {baqend.binding.Entity} entity
   * @returns {baqend.util.ValidationResult} result
   */
  validate: function(entity) {
    var type = Metadata.get(entity).type;
    var validationCode = type.validationCode;
    var values = [];
    var result = new ValidationResult();
    for (var iter = type.attributes(), item = iter.next(); !item.done; item = iter.next()) {
      var validate = new Validator(item.value.name, entity);
      values.push(validate);
      result.fields[validate.key] = validate;
    }
    if(validationCode) {
      validationCode.apply({}, values);
    }
    return result;
  }

  /**
   * An Object factory for embeddable objects,
   * that can be accessed by the type name of the embeddable type.
   * An object factory can be called to create new instances of the type.
   * @name [<i>MyEmbeddableClass</i>]
   * @memberOf baqend.EntityManager.prototype
   * @type {baqend.binding.ManagedFactory}
   */

  /**
   * An Object factory for entity objects,
   * that can be accessed by the type name of the entity type.
   * An object factory can be called to create new instances of the type.
   * @name [<i>MyEntityClass</i>]
   * @memberOf baqend.EntityManager.prototype
   * @type {baqend.binding.EntityFactory}
   */
});
},{"./EntityTransaction":3,"./GeoPoint":4,"./Query":5,"./TypedQuery":6,"./collection":17,"./connector/Message":20,"./error":30,"./message":32,"./util/Lockable":52,"./util/Metadata":53,"./util/ValidationResult":55,"./util/Validator":56,"node-uuid":79}],2:[function(require,module,exports){
var message = require('./message');
var metamodel = require('./metamodel');

var Lockable = require('./util/Lockable');
var Code = require('./util/Code');
var Connector = require('./connector/Connector');
var EntityManager = require('./EntityManager');

/**
 * @class baqend.EntityManagerFactory
 * @extends baqend.util.Lockable
 *
 * Creates a new EntityManagerFactory connected to the given destination
 * @param {String|Object} [options] The baqend destination to connect with, or an options object
 * @param {String} [options.host] The baqend destination to connect with
 * @param {Number} [options.port=80|443] The optional baqend destination port to connect with
 * @param {Number} [options.secure=false] <code>true</code> To use a secure ssl encrypted connection
 * @param {Object} [options.schema=null] The serialized schema as json used to initialize the metamodel
 * @param {Boolean} [options.global=false] <code>true</code> To create the emf for the global DB
 */
var EntityManagerFactory = module.exports = Object.inherit(Lockable, /** @lends baqend.EntityManagerFactory.prototype */ {

  /**
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @type baqend.metamodel.Metamodel
   */
  metamodel: null,

  /**
   * @type baqend.util.Code
   */
  code: null,

  initialize: function(options) {
    options = String.isInstance(options)? {host: options}: options || {};

    this.lock();
    if (options.host) {
      this.connect(options.host, options.port, options.secure);
    }

    this.metamodel = this.createMetamodel(options.global);
    this.code = this.createCode();

    if (options.schema) {
      this.metamodel.init(options.schema);
    }
  },

  /**
   * Connects this EntityManager to the given destination
   * @param {String} host The host to connect with
   * @param {Number} [port] The port to connect to
   * @param {Boolean} [secure] <code>true</code> To use a secure connection
   */
  connect: function(host, port, secure) {
    this._connector = Connector.create(host, port, secure);
    this.unlock();
  },

  /**
   * Creates a new Metamodel instance, connected to the same destination as this EntityManagerFactory is connected to
   * @return {baqend.metamodel.Metamodel} A new Metamodel instance
   */
  createMetamodel: function(global) {
    var model = global? metamodel: new metamodel.Metamodel();
    if (this.isReady) {
      model.connected(this._connector);
    } else {
      this.ready().then(function(emf) {
        model.connected(emf._connector);
      });
    }
    return model;
  },

  /**
   * Creates a new Code instance, connected to the same destination as this EntityManagerFactory is connected to
   * @return {baqend.util.Code} A new Code instance
   */
  createCode: function() {
    var code = new Code();
    if (this.isReady) {
      code.connected(this._connector);
    } else {
      this.ready().then(function(emf) {
        code.connected(emf._connector);
      });
    }
    return code;
  },

  /**
   * Create a new application-managed EntityManager.
   *
   * @param {Boolean=} global <code>true</code> To use the global authorization
   *
   * @returns {baqend.EntityManagerFactory} a new entityManager
   */
  createEntityManager: function(global) {
    var em = new EntityManager(this, global);

    if (this.isReady && this.metamodel.isInitialized) {
      em.connected(this._connector);
    } else {
      this.ready().then(function() {
        return this.metamodel.init();
      }.bind(this)).then(function() {
        em.connected(this._connector);
      }.bind(this));
    }

    return em;
  }
});
},{"./EntityManager":1,"./connector/Connector":18,"./message":32,"./metamodel":48,"./util/Code":51,"./util/Lockable":52}],3:[function(require,module,exports){
var message = require('./message');
var error = require('./error');

/**
 * @class baqend.EntityTransaction
 */
var EntityTransaction = module.exports = Object.inherit(/** @lends baqend.EntityTransaction.prototype */ {

	/**
	 * Indicate whether a resource transaction is in progress. 
	 * @returns {Boolean} indicating whether transaction is in progress 
 	 */
	get isActive() {
    return Boolean(this.tid);
	},
	
	/**
	 * @param {baqend.EntityManager} entityManager
	 */
	initialize: function(entityManager) {
		this._connector = entityManager.connector;
		this.entityManager = entityManager;
		
		this.tid = null;
		this.rollbackOnly = false;
		
		this.readSet = null;
		this.changeSet = null;
	},
	
	/**
	 * Start a resource transaction.
	 */
	begin: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			var result = this.send(new message.PostTransaction()).done(function(msg) {
				this.tid = msg.tid;

				this.rollbackOnly = false;
				this.readSet = {};
				this.changeSet = {};
			});
			
			return this.wait(result);
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Commit the current resource transaction, writing any unflushed changes to the database. 
	 */
	commit: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			if (this.getRollbackOnly()) {
				return this.rollback().then(function() {
					throw new error.RollbackError();
				});
			} else {
				return this.wait(this.entityManager.flush()).then(function() {
					var readSet = [];
					for (var ref in this.readSet) {
						readSet.push({
							"oid": ref,
							"version": this.readSet[ref]
						});
					}
					
					var result = this.send(new message.PutTransactionCommitted(this.tid, readSet));
					
					return this.wait(result).then(function(msg) {
						this.tid = null;
						this.readSet = null;
						this.changeSet = null;
						
						var oids = msg.oids;
						for (var oid in oids) {
							var version = oids[oid];
							var entity = this.entityManager.entities[oid];
							
							if (entity) {
								var state = util.Metadata.get(entity);
								if (version == 'DELETED' || state.isDeleted) {
									this.entityManager.removeReference(entity);
								} else {								
									state.setDatabaseValue(state.type.version, version);
								}
							}
						}
					});
				});
			}
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Determine whether the current resource transaction has been marked for rollback. 
	 * @returns {Boolean} indicating whether the transaction has been marked for rollback 
	 */
	getRollbackOnly: function() {
		return this.rollbackOnly;
	},
	
	/**
	 * Roll back the current resource transaction. 
	 */
	rollback: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			var result = this.send(new message.PutTransactionAborted(this.tid));
			
			this.wait(result).then(function() {
				this.tid = null;
				this.readSet = null;
				this.changeSet = null;
				return this.entityManager.clear();
			}, function() {
				return this.entityManager.clear();
			});
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Mark the current resource transaction so that the only possible outcome of the transaction is for the transaction to be rolled back. 
	 */
	setRollbackOnly: function(context, onSuccess) {
		return this.yield().done(function() {
			this.rollbackOnly = true;
		});
	},
	
	isRead: function(identifier) {
		return this.isActive && identifier in this.readSet;
	},
	
	setRead: function(identifier, version) {
		if (this.isActive && !this.isChanged(identifier)) {
			this.readSet[identifier] = version;
		}
	},
	
	isChanged: function(identifier) {
		return this.isActive && identifier in this.changeSet;
	},
	
	setChanged: function(identifier) {
		if (this.isActive) {
			delete this.readSet[identifier];
			this.changeSet[identifier] = true;
		}
	}
});
},{"./error":30,"./message":32}],4:[function(require,module,exports){
var collection = require('./collection');

/**
 * Creates a new GeoPoint instance
 * From latitude and longitude
 * From a json object
 * Or an tuple of latitude and longitude
 *
 * @class baqend.GeoPoint
 *
 * @param {String|Number|Object|Array=} latitude A coordinate pair (latitude first), a GeoPoint like object or the GeoPoint's latitude
 * @param {Number=} longitude The GeoPoint's longitude
 */
var GeoPoint = module.exports = Object.inherit(/** @lends baqend.GeoPoint.prototype */ {

  /** @lends baqend.GeoPoint */
  extend: {
    DEG_TO_RAD: Math.PI/180,
    /**
     * @type {Number} The Earth radius in kilometers used by {@link baqend.GeoPoint#kilometersTo}
     */
    EARTH_RADIUS_IN_KILOMETERS: 6371,
    /**
     * @type {Number} The Earth radius in miles used by {@link baqend.GeoPoint#milesTo}
     */
    EARTH_RADIUS_IN_MILES: 3956,

    /**
     * Creates a GeoPoint with the user's current location, if available.
     * @return {Promise<baqend.GeoPoint>} A promise that will be resolved with a GeoPoint
     */
    current: function() {
      return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(function(location) {
          resolve(new GeoPoint(location.coords.latitude, location.coords.longitude));
        }, function(error) {
          reject(error);
        });
      });
    },

    conv: function(param) {
      return new this(param);
    }
  },

  latitude: 0,
  longitude: 0,

  /**
   * @private
   */
  initialize: function(latitude, longitude) {
    if (String.isInstance(latitude)) {
      var index = latitude.indexOf(';');
      this.latitude = latitude.substring(0, index);
      this.longitude = latitude.substring(index + 1);
    } else if (Number.isInstance(latitude)) {
      this.latitude = latitude;
      this.longitude = longitude;
    } else if (Array.isInstance(latitude)) {
      this.latitude = latitude[0];
      this.longitude = latitude[1];
    } else if (Object.isInstance(latitude)) {
      this.latitude = latitude.latitude;
      this.longitude = latitude.longitude;
    }

    if (this.latitude < -90 || this.latitude > 90) {
      throw new Error("Latitude " + this.latitude + " is not in bound of -90 <= latitude <= 90");
    }

    if (this.longitude < -180 || this.longitude > 180) {
      throw new Error("Longitude " + this.longitude + " is not in bound of -180 <= longitude <= 180");
    }
  },

  /**
   * Returns the distance from this GeoPoint to another in kilometers.
   * @param {baqend.GeoPoint} point another GeoPoint
   * @return {Number} The distance in kilometers
   *
   * @see baqend.GeoPoint#radiansTo
   */
  kilometersTo: function(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_KILOMETERS * this.radiansTo(point)).toFixed(3));
  },

  /**
   * Returns the distance from this GeoPoint to another in miles.
   * @param {baqend.GeoPoint} point another GeoPoint
   * @return {Number} The distance in miles
   *
   * @see baqend.GeoPoint#radiansTo
   */
  milesTo: function(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_MILES * this.radiansTo(point)).toFixed(3));
  },

  /**
   * Computes the arc, in radian, between two WGS-84 positions.
   *
   * The haversine formula implementation is taken from:
   * {@link http://www.movable-type.co.uk/scripts/latlong.html}
   *
   * Returns the distance from this GeoPoint to another in radians.
   * @param {baqend.GeoPoint} point another GeoPoint
   * @return {Number} the arc, in radian, between two WGS-84 positions
   *
   * @see http://en.wikipedia.org/wiki/Haversine_formula
   */
  radiansTo: function(point) {
    var from = this, to = point;
    var rad1 = from.latitude * GeoPoint.DEG_TO_RAD,
        rad2 = to.latitude * GeoPoint.DEG_TO_RAD,
        dLng = (to.longitude - from.longitude) * GeoPoint.DEG_TO_RAD;

    return Math.acos(Math.sin(rad1) * Math.sin(rad2) + Math.cos(rad1) * Math.cos(rad2) * Math.cos(dLng));
  },

  /**
   * A String representation in latitude, longitude format
   * @return {String} The string representation of this class
   */
  toString: function() {
    return this.latitude + ';' + this.longitude;
  },

  /**
   * Returns a JSON representation of the GeoPoint
   * @return {Object} A GeoJson object of this GeoPoint
   */
  toJSON: function() {
    return {latitude: this.latitude, longitude: this.longitude};
  }
});

},{"./collection":17}],5:[function(require,module,exports){
var message = require('./message');
var Metadata = require('./util/Metadata');

/**
 * @class baqend.Query
 */
var Query = module.exports = Trait.inherit(/** @lends baqend.Query.prototype */ {
  /**
   * The owning EntityManager of this query
   * @type baqend.EntityManager
   */
  entityManager: null,

  /**
   * The result class of this query
   * @type Function
   */
  resultClass: null,

  /**
   * The offset how many results should be skipped
   * @type Number
   */
  firstResult: 0,

  /**
   * The limit how many objects should be returned
   * @type Number
   */
  maxResults: -1,

  /**
   * Add an ascending sort for the specified field to this query
   * @param field The field to sort
   * @return {baqend.Query} The resulting Query
   */
  ascending: function(field) {
    return this._addOrder(field, 1);
  },

  /**
   * Add an decending sort for the specified field to this query
   * @param field The field to sort
   * @return {baqend.Query} The resulting Query
   */
  descending: function(field) {
    return this._addOrder(field, -1);
  },

  /**
   * Sets the sort of the query and discard all existing paramaters
   * @param {Object} sort The new sort of the query
   * @return {baqend.Query} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.sort/
   */
  sort: function(sort) {
    if (classOf(sort) != Object)
      throw new Error('sort must be an object.');

    return this._addOrder(sort);
  },

  /**
   * Sets the offset of the query, i.e. how many elements should be skipped
   * @param offset The offset of this query
   * @return {baqend.Query} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.skip/
   */
  offset: function(offset) {
    this.firstResult = offset;
    return this;
  },

  /**
   * Sets the limit of this query, i.e hox many objects should be returnd
   * @param limit The limit of this query
   * @return {baqend.Query} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.limit/
   */
  limit: function(limit) {
    this.maxResults = limit;
    return this;
  },

  /**
   * Execute the query and return the query results as a List.
   * Note: All local unsaved changes on matching objects, will be discarded.
   * @return {Promise<Array<baqend.binding.Entity>>} A promise that will be resolved with the query result as a list
   */
  resultList: function(doneCallback, failCallback) {
    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new PositionError('Only typed queries can be executed.');
    }

    return this._exec(type, false).then(doneCallback, failCallback);
  },

  /**
   * Execute the query that returns a single result.
   * Note: All local unsaved changes on the matched object, will be discarded.
   * @return {Promise<baqend.binding.Entity>} A promise that will be resolved with the query result as a single result
   */
  singleResult: function(doneCallback, failCallback) {
    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new PositionError('Only typed queries can be executed.');
    }

    return this._exec(type, true).then(function(result) {
      return result.length ? result[0] : null;
    }).then(doneCallback, failCallback);
  },

  count: function(doneCallback, failCallback) {
    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new PositionError('Only typed queries can be executed.');
    }

    var msg = new message.AdhocCountQuery(type.name, this._countQuery());

    return this.entityManager._send(msg).then(function() {
      return msg.response.entity.count;
    }).then(doneCallback, failCallback);
  },

  _countQuery : function() {
    return "{}";
  },

  _exec: function(type, singleResult) {
    var msg = new message.GetBucketOids(type.name, this.firstResult, singleResult ? 1 : this.maxResults);

    return this.entityManager._send(msg).then(function() {
      return this._createResultList(msg.response.entity);
    }.bind(this));
  },

  _createResultList: function(result) {
    if (result.length) {
      return Promise.all(result.map(function(el) {
        var id = el._objectInfo ? el._objectInfo.id : el.id;
        if (el._objectInfo) {
          var entity = this.entityManager.getReference(this.resultClass, id);
          var metadata = Metadata.get(entity);
          metadata.setDatabaseObject(el);
          metadata.setPersistent();
          return Promise.resolve(entity);
        } else {
          return this.entityManager.find(el);
        }
      }, this)).then(function(result) {
        return result.filter(function(val) {
          return !!val;
        });
      });
    } else {
      return Promise.resolve([]);
    }
  }
});

/**
 * @class baqend.Query.Condition
 * @extends baqend.Query
 */
Query.Condition = Query.inherit(/** @lends baqend.Query.Condition.prototype */ {

  /**
   * An object, that contains filter rules which will be merged with the current filters of this query.
   * @param {Object} conditions - Additional filters for this query
   * @return {baqend.Query.Condition} The resulting Query
   */
  where: function(conditions) {
    return this._addFilter(null, null, conditions);
  },

  /**
   * Adds a equal filter to the field. All other other filters on the field will be discarded
   * @param {String} field The field to filter
   * @param {*} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   */
  equal: function(field, value) {
    return this._addFilter(field, null, value);
  },

  /**
   * Adds a not equal filter to the field.
   * @param {String} field The field to filter
   * @param {*} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nin/
   */
  notEqual: function(field, value) {
    return this._addFilter(field, "$ne", value);
  },

  /**
   * Adds a greater than filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  greaterThan: function(field, value) {
    return this._addFilter(field, "$gt", value);
  },

  /**
   * Adds a greater than or equal to filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  greaterThanOrEqualTo: function(field, value) {
    return this._addFilter(field, "$gte", value);
  },

  /**
   * Adds a less than filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lessThan: function(field, value) {
    return this._addFilter(field, "$lt", value);
  },

  /**
   * Adds a less than or equal to filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  lessThanOrEqualTo: function(field, value) {
    return this._addFilter(field, "$lte", value);
  },

  /**
   * Adds a between filter to the field. This is a shorthand for an less than and greater than filter.
   * @param {String} field The field to filter
   * @param {Number|String|Date} lessValue The field value must be greater than this value
   * @param {Number|String|Date} greaterValue The field value must be less than this value
   * @return {baqend.Query.Condition} The resulting Query
   */
  between: function(field, lessValue, greaterValue) {
    return this._addFilter(field, "$gt", lessValue)
        ._addFilter(field, "$lt", greaterValue);
  },

  /**
   * Adds a in filter to the field. The field value must be equal to one of the given values
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  'in': function(field, args) {
    return this._addFilter(field, "$in", classOf(args) == Array ? args : Array.prototype.slice.call(arguments, 1));
  },

  /**
   * Adds a not in filter to the field. The field value must not be equal to any of the given values
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nin/
   */
  notIn: function(field, args) {
    return this._addFilter(field, "$nin", classOf(args) == Array ? args : Array.prototype.slice.call(arguments, 1));
  },

  /**
   * Adds a null filter to the field. The field value must be null
   * @param {String} field The field to filter
   * @return {baqend.Query.Condition} The resulting Query
   */
  isNull: function(field) {
    return this.equal(field, null);
  },

  /**
   * Adds a not null filter to the field. The field value must not be null
   * @param {String} field The field to filter
   * @return {baqend.Query.Condition} The resulting Query
   */
  isNotNull: function(field) {
    return this._addFilter(field, "$exists", true)
        ._addFilter(field, "$ne", null);
  },

  /**
   * Adds a contains all filter to the collection field. The collection must contain all the given values.
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/all/
   */
  containsAll: function(field, args) {
    return this._addFilter(field, "$all", classOf(args) == Array ? args : Array.prototype.slice.call(arguments, 1));
  },

  /**
   * Adds a modulo filter to the field. The field value divided by divisor must be equal to the remainder.
   * @param {String} field The field to filter
   * @param {Number} divisor The divisor of the modulo filter
   * @param {Number} remainder The remainder of the modulo filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/mod/
   */
  mod: function(field, divisor, remainder) {
    return this._addFilter(field, "$mod", [divisor, remainder]);
  },

  /**
   * Adds a regular expression filter to the field. The field value must matches the regular expression.
   * <p>Note: Only anchored expressions (Expressions that starts with an ^) and the multiline flag are supported.</p>
   * @param {String} field The field to filter
   * @param {String|RegExp} regExp The regular expression of the filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/regex/
   */
  matches: function(field, regExp) {
    if (!RegExp.isInstance(regExp)) {
      regExp = new RegExp(regExp);
    }

    if (regExp.ignoreCase) {
      throw new Error('RegExp.ignoreCase flag is not supported.');
    }

    if (regExp.global) {
      throw new Error('RegExp.global flag is not supported.');
    }

    if (regExp.source.indexOf('^') != 0) {
      throw new Error('regExp must be an anchored expression, i.e. it must be started with a ^.');
    }

    var result = this._addFilter(field, '$regex', regExp.source);
    if (regExp.multiline) {
      result._addFilter(field, '$options', 'm');
    }

    return result;
  },

  /**
   * Adds a size filter to the collection field. The collection must have exactly size members.
   * @param {String} field The field to filter
   * @param {Number} size The collections size to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/size/
   */
  size: function(field, size) {
    return this._addFilter(field, "$size", size);
  },

  /**
   * Adds a geopoint based near filter to the GeoPoint field. The GeoPoint must be within the maximum distance
   * to the given GeoPoint. Returns from nearest to farthest.
   * @param {String} field The field to filter
   * @param {baqend.GeoPoint} geoPoint The GeoPoint to filter
   * @param {Number} maxDistance Tha maximum distance to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nearSphere/
   */
  near: function(field, geoPoint, maxDistance) {
    return this._addFilter(field, "$nearSphere", {
      $geometry: {
        type: "Point",
        coordinates: [geoPoint.longitude, geoPoint.latitude]
      },
      $maxDistance: maxDistance
    });
  },

  /**
   * Adds a GeoPoint based polygon filter to the GeoPoint field. The GeoPoint must be contained within the polygon.
   * @param {String} field The field to filter
   * @param {baqend.GeoPoint|Array<baqend.GeoPoint>} geoPoints... The geoPoints that describes the polygon of the filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/geoWithin/
   */
  withinPolygon: function(field, geoPoints) {
    geoPoints = classOf(geoPoints) == Array ? geoPoints : Array.prototype.slice.call(arguments, 1);

    return this._addFilter(field, "$geoWithin", {
      $geometry: {
        type: "Polygon",
        coordinates: [geoPoints.map(function(geoPoint) {
          return [geoPoint.longitude, geoPoint.latitude];
        })]
      }
    });
  }
});

// aliases
var proto = Query.Condition.prototype;
Object.extend(proto, /** @lends baqend.Query.Condition.prototype */ {
  /**
   * Adds a less than filter to the field. Shorthand for {@link baqend.Query.Condition#lessThan}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lt: proto.lessThan,

  /**
   * Adds a less than or equal to filter to the field. Shorthand for {@link baqend.Query.Condition#lessThanOrEqualTo}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  le: proto.lessThanOrEqualTo,

  /**
   * Adds a greater than filter to the field. Shorthand for {@link baqend.Query.Condition#greaterThan}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  gt: proto.greaterThan,

  /**
   * Adds a greater than or equal to filter to the field. Shorthand for {@link baqend.Query.Condition#greaterThanOrEqualTo}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  ge: proto.greaterThanOrEqualTo,

  /**
   * Adds a contains any filter to the collection field. The collection must contains one the given values.
   * Alias for {@link baqend.Query.Condition#in}
   * @method
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  containsAny: proto.in
});

/**
 * @class baqend.Query.Node
 * @extends baqend.Query
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 */
Query.Node = Object.inherit(Query, /** @lends baqend.Query.Node.prototype */ {

  _sort: null,

  initialize: function(entityManager, resultClass) {
    this.entityManager = entityManager;
    this.resultClass = resultClass;
    this._sort = {};
  },

  _addOrder: function(fieldOrSort, order) {
    if (order) {
      this._sort[fieldOrSort] = order;
    } else {
      this._sort = fieldOrSort;
    }
    return this;
  },

  _countQuery: function(_) {
    return JSON.stringify(this, function(k, v) {
      var typedValue = this[k];
      return Date.isInstance(typedValue) ? {$date: v} : v;
    });
  },

  _exec: function(type, singleResult) {
    var sort = JSON.stringify(this._sort);
    var query = JSON.stringify(this, function(k, v) {
      var typedValue = this[k];
      return Date.isInstance(typedValue) ? {$date: v} : v;
    });

    var msg;
    if (sort == '{}' && query == '{}') {
      return this.superCall(type, singleResult);
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, singleResult ? 1 : this.maxResults, sort);
    }

    return this.entityManager._send(msg).then(function() {
      return this._createResultList(msg.response.entity);
    }.bind(this));
  }
});

/**
 * @class baqend.Query.Builder
 * @extends baqend.Query.Condition
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 */
Query.Builder = Object.inherit(Query.Condition, /** @lends baqend.Query.Builder.prototype */ {

  initialize: function(entityManager, resultClass) {
    this.entityManager = entityManager;
    this.resultClass = resultClass;
  },

  /**
   * Joins the conditions by an logical AND
   * @param {baqend.Query} args... The query nodes to join
   * @return {baqend.Query} Returns a new query which joins the given queries by a logical AND
   */
  and: function(args) {
    return this._addOperator('$and', classOf(args) == Array ? args : Array.prototype.slice.call(arguments));
  },

  /**
   * Joins the conditions by an logical OR
   * @param {baqend.Query} args... The query nodes to join
   * @return {baqend.Query} Returns a new query which joins the given queries by a logical OR
   */
  or: function(args) {
    return this._addOperator('$or', classOf(args) == Array ? args : Array.prototype.slice.call(arguments));
  },

  /**
   * Joins the conditions by an logical NOR
   * @param {baqend.Query} args... The query nodes to join
   * @return {baqend.Query} Returns a new query which joins the given queries by a logical NOR
   */
  nor: function(args) {
    return this._addOperator('$nor', classOf(args) == Array ? args : Array.prototype.slice.call(arguments));
  },

  _addOperator: function(operator, args) {
    if (args.length < 2) {
      throw new Error('Only two or more queries can be joined with an ' + operator + ' operator.');
    }

    args.forEach(function(arg, index) {
      if (!Query.isInstance(arg)) {
        throw new Error('Argument at index ' + index + ' is not a Query.');
      }
    });

    return new Query.Operator(this.entityManager, this.resultClass, operator, args);
  },

  _addOrder: function(fieldOrSort, order) {
    return new Query.Filter(this.entityManager, this.resultClass, this.firstResult, this.maxResults)._addOrder(fieldOrSort, order);
  },

  _addFilter: function(field, filter, value) {
    return new Query.Filter(this.entityManager, this.resultClass, this.firstResult, this.maxResults)._addFilter(field, filter, value);
  }
});

/**
 * @class baqend.Query.Filter
 * @extends baqend.Query.Node
 * @extends baqend.Query.Condition
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 */
Query.Filter = Query.Node.inherit(Query.Condition, /** @lends baqend.Query.Filter.prototype */ {
  /**
   * The actual filters of this node
   * @type Object
   */
  _filter: null,

  initialize: function(entityManager, resultClass, firstResult, maxResults) {
    this.superCall(entityManager, resultClass);
    this._filter = {};
    this.firstResult = firstResult;
    this.maxResults = maxResults;
  },

  _addFilter: function(field, filter, value) {
    if (field !== null) {
      if (!String.isInstance(field))
        throw new Error('Field must be a string.');

      if (filter) {
        var fieldFilter = this._filter[field];
        if (classOf(fieldFilter) != Object) {
          this._filter[field] = fieldFilter = {};
        }

        fieldFilter[filter] = value;
      } else {
        this._filter[field] = value;
      }
    } else {
      Object.extend(this._filter, value);
    }

    return this;
  },

  toJSON: function() {
    return this._filter;
  }
});

/**
 * @class baqend.Query.Operator
 * @extends baqend.Query.Node
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 * @param {String} operator The operator used to join the childs
 * @param {Array<baqend.Query.Node>} childs The childs to join
 */
Query.Operator = Query.Node.inherit(/** @lends baqend.Query.Operator.prototype */ {
  /**
   * The operator used to join the child queries
   * @type String
   */
  _operator: null,

  /**
   * The child Node of this query, it is always one
   * @type Array<baqend.Query.Node>
   */
  _childs: null,

  initialize: function(entityManager, resultClass, operator, childs) {
    this.superCall(entityManager, resultClass);
    this._operator = operator;
    this._childs = childs;
  },

  toJSON: function() {
    var json = {};
    json[this._operator] = this._childs;
    return json;
  }
});


},{"./message":32,"./util/Metadata":53}],6:[function(require,module,exports){
var Query = require('./Query');

/**
 * @class baqend.TypedQuery
 * @extends baqend.Query
 */
var TypedQuery = module.exports = Query.inherit(/** @lends baqend.TypedQuery.prototype */{
  /**
   * @param {baqend.EntityManager} entityManager
   * @param {String|Object} qlString
   * @param {Function} resultClass
   */
  initialize: function (entityManager, qlString, resultClass) {
    this.entityManager = entityManager;
    this.resultClass = resultClass;
  }
});
},{"./Query":5}],7:[function(require,module,exports){
/**
 * @class baqend.binding.Accessor
 */
var Accessor = module.exports = Object.inherit(/** @lends baqend.binding.Accessor.prototype */ {
	/**
	 * @param {Object} object
	 * @param {baqend.metamodel.Attribute} attribute
	 * @returns {*}
	 */
	getValue: function(object, attribute) {
		return object[attribute.name];
	},
	 
	/**
	 * @param {Object} object
	 * @param {baqend.metamodel.Attribute} attribute
	 * @param {*} value
	 */
	setValue: function(object, attribute, value) {
		object[attribute.name] = value;
	}
});
},{}],8:[function(require,module,exports){
var Metadata = require('../util/Metadata');
var Lockable = require('../util/Lockable');
var Entity = require('./Entity');
var Managed = require('./Managed');
var User = require('./User');
var Role = require('./Role');

/**
 * @class baqend.binding.Enhancer
 */
var Enhancer = module.exports = Object.inherit(/** @lends baqend.binding.Enhancer.prototype */ {
  extend: /** @lends baqend.binding.Enhancer */ {
    PROXY_INITIALIZER: {
      initialize: function(properties) {
        if (properties)
          Object.extend(this, properties);
      }
    }
  },

  /**
   * @param {baqend.metamodel.ManagedType} managedType
   * @returns {Function} typeConstructor
   */
  createProxyClass: function(managedType) {
    if (managedType.isEntity) {
      var Class = managedType.superType.typeConstructor;
      return Class.inherit(Class.prototype.initialize? {}: Enhancer.PROXY_INITIALIZER);
    } else if (managedType.isEmbeddable) {
      return Object.inherit(Enhancer.PROXY_INITIALIZER);
    } else {
      throw new TypeError('No proxy class can be initialized.');
    }
  },

  /**
   * @param {Function} typeConstructor
   * @returns {String}
   */
  getIdentifier: function(typeConstructor) {
    return typeConstructor.__baqendId__;
  },

  /**
   * @param {Function} typeConstructor
   * @param {String} identifier
   */
  setIdentifier: function(typeConstructor, identifier) {
    typeConstructor.__baqendId__ = identifier;
  },

  /**
   * Creates a new instance of the managed type
   * @param {baqend.metamodel.ManagedType} managedType The managed type
   */
  create: function(managedType) {
    return Object.create(managedType.typeConstructor.prototype);
  },

  /**
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} typeConstructor
   */
  enhance: function(type, typeConstructor) {
    this.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor, type);
  },

  /**
   * Enhance the prototype of the type
   * @param {Function} typeConstructor
   * @param {baqend.metamodel.ManagedType} type
   */
  enhancePrototype: function(typeConstructor, type) {
    // mixin managed object type
    this.mixinType(typeConstructor, Managed);

    if (type.isEntity) {
      // mixin entity object type
      this.mixinType(typeConstructor, Entity);
      this.mixinType(typeConstructor, Lockable);

      switch (type.name) {
        case 'Role':
          this.mixinType(typeConstructor, Role);
          break;
        case 'User':
          this.mixinType(typeConstructor, User);
          break;
      }
    }

    if (typeConstructor.prototype.toString === Object.prototype.toString) {
      // implements a better convenience toString method
      typeConstructor.prototype.toString = function() {
        return this._metadata.ref || type.ref;
      };
    }

    // enhance all persistent properties
    for (var i = 0, attr; attr = type.declaredAttributes[i]; ++i) {
      this.enhanceProperty(typeConstructor, attr);
    }
  },

  /**
   * Mixes a trait into the given typeConstructor at runtime
   * @param {Function} typeConstructor The typeConstructor which will be extend by the trait
   * @param {Function} traitToMixin The trait to mix in
   */
  mixinType: function(typeConstructor, traitToMixin) {
    var types = typeConstructor.linearizedTypes;
    // fix linearizedTypes if it is not set properly
    if (!types || types.indexOf(typeConstructor) == -1)
      types = typeConstructor.linearizedTypes = [Object, typeConstructor];

    var prototypeChain = typeConstructor.prototypeChain;
    if (!prototypeChain)
      prototypeChain = typeConstructor.prototypeChain = [typeConstructor.prototype];

    // mix in type only if it isn't mixed in already
    if (types.indexOf(traitToMixin) == -1) {
      // mixin type
      Object.cloneOwnProperties(typeConstructor.prototype, traitToMixin.prototype);
      // let isInstance work properly
      types.push(traitToMixin);
      // let superCalls work properly
      prototypeChain.push(traitToMixin.prototype);
      // preserve origin constructor reference
      typeConstructor.prototype.constructor = typeConstructor;
    }
  },

  /**
   * @param {Function} typeConstructor
   * @param {baqend.metamodel.Attribute} attribute
   */
  enhanceProperty: function(typeConstructor, attribute) {
    var name = '$' + attribute.name;
    Object.defineProperty(typeConstructor.prototype, attribute.name, {
      get: function() {
        Metadata.readAccess(this);
        return this._metadata[name];
      },
      set: function(value) {
        Metadata.writeAccess(this);
        this._metadata[name] = value;
      },
      configurable: true,
      enumerable: true
    });
  }
});



},{"../util/Lockable":52,"../util/Metadata":53,"./Entity":9,"./Managed":11,"./Role":13,"./User":14}],9:[function(require,module,exports){
var Managed = require('./Managed');
var Lockable = require('../util/Lockable');

/**
 * @mixin baqend.binding.Entity
 * @extends baqend.binding.Managed
 * @extends baqend.util.Lockable
 */
var Entity = module.exports = Managed.inherit(Lockable, /** @lends baqend.binding.Entity.prototype */ {

  /**
   * Gets the unique id of this object
   * @return {*} The unique id
   */
  get id() {
    return this._metadata.id;
  },

  /**
   * Sets the id of this object, if it is not already set throws an error otherwise
   * @param {String} value The new unique id of the object
   */
  set id(value) {
    if (this._metadata.id)
      throw new Error('Id can\'t be set twice.');

    this._metadata.id = value;
  },

  /**
   * Gets the version of this object
   * @return {*} The version of the object
   */
  get version() {
    return this._metadata.version;
  },

  /**
   * Sets the version of this object
   * @param {String} value The version of the object
   */
  set version(value) {
    this._metadata.version = value;
  },

  /**
   * The object read/write permissions
   * @type baqend.Acl
   */
  get acl() {
    return this._metadata.acl;
  },

  /**
   * Attach this object to the given db
   * @param {baqend.EntityManager} db The db which will be used for future crud operations
   */
  attach: function(db) {
    db.attach(this);
  },

  /**
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Object} [options] The save options
   * @param {Boolean} [options.force=false] Force the save operation, the version will not be validated.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state with the remote state.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  save: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.save(this, options).then(doneCallback, failCallback);
  },

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Object} [options] The insertion options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state with the remote state.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insert: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.insert(this, options).then(doneCallback, failCallback);
  },

  /**
   * Updates an existing object.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Object} [options] The update options
   * @param {Boolean} [options.force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state with the remote state.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  update: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.update(this, options).then(doneCallback, failCallback);;
  },

  /**
   * Refresh the local object state, with the server state.
   * Removed objects will be marked as removed.
   * @param {Object} [options] The refresh options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be refreshed. Depth 0 refreshes this object only,
   * <code>true</code> refreshes objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  refresh: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.refresh(this, options).then(doneCallback, failCallback);
  },

  /**
   * Remove an existing object.
   * @param {Object} [options] The remove options
   * @param {Boolean} [options.force=false] Force the remove operation, the version will not be validated.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  remove: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.remove(this, options).then(doneCallback, failCallback);
  },

  attr: function() {
    throw new Error("Attr is not yet implemented.");
  },

  /**
   * Validates the entity by using the validation code of the entity type
   *
   * @returns {baqend.util.ValidationResult} Contains the result of the Validation
   */
  validate: function() {
    return this._metadata.db.validate(this);
  },

  /**
   * Converts the entity to an JSON-Object.
   * @param {Boolean} includeObjectInfo
   * @return {Object} JSON-Object
   */
  toJSON: function(includeObjectInfo) {
    return this._metadata.getDatabaseObject(!includeObjectInfo, !includeObjectInfo);
  }
});

/**
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback baqend.binding.Entity~doneCallback
 * @param {baqend.binding.Entity} entity This entity
 * @return {Promise<*>|*|undefined} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback baqend.binding.Entity~failCallback
 * @param {baqend.error.PersistentError} error The error which reject the operation
 * @return {Promise<*>|*|undefined} A Promise, result or undefined
 */


},{"../util/Lockable":52,"./Managed":11}],10:[function(require,module,exports){
var ManagedFactory = require('./ManagedFactory');
var Metadata = require('../util/Metadata');

/**
 * @class baqend.binding.EntityFactory
 * @extends baqend.binding.ManagedFactory<T>
 * @template <T> The type of the factory
 */
var EntityFactory = module.exports = ManagedFactory.inherit(/** @lends baqend.binding.EntityFactory.prototype */ {

  /** @lends baqend.binding.EntityFactory */
  extend: {
    /**
     * Creates a new EntityFactory for the given type
     * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
     * @param {baqend.EntityManager} db
     * @return {baqend.binding.EntityFactory<T>} A new object factory to created instances of T
     */
    create: function(managedType, db) {
      var factory = ManagedFactory.create(managedType, db);
      Object.cloneOwnProperties(factory, EntityFactory.prototype);
      return factory;
    }
  },

  /**
   * Creates a new instance of the factory type
   * @params *[] args Constructor arguments used for instantiation
   * @return {T} A new created instance of T
   */
  newInstance: function(args) {
    var typeInstance = this._managedType.create();
    Metadata.get(typeInstance).db = this._db;
    this._managedType.typeConstructor.apply(typeInstance, args);
    return typeInstance;
  },

  /**
   * Gets a instance for the given id, or null if the id does not exists.
   * @param {String} id The id to query
   * @param {Number|Boolean} [depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<T>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  get: function(id, depth, doneCallback, failCallback) {
    if(Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._db.find(this._managedType.typeConstructor, id, false, depth).then(doneCallback, failCallback);
  },

  _getHandler: function(codeType) {
    var fn = this._db.code.getHandler(this._managedType.name, codeType);
    if(fn) {
      return function(obj) {
        return fn.call(obj, this._db);
      }.bind(this);
    } else {
      return null;
    }
  },

  /**
   * Returns the code of the insert handler.
   * The code must previously be loaded by the {@link baqend.metamodel.Code} object of the {@link baqend.EntityManager}.
   *
   * @returns {Function} null if no code has been loaded
   */
  get onInsert() {
    return this._getHandler('insert');
  },

  /**
   * Returns the code of the delete handler.
   * The code must previously be loaded by the {@link baqend.metamodel.Code} object of the {@link baqend.EntityManager}.
   *
   * @returns {Function} null if no code has been loaded
   */
  get onDelete() {
    return this._getHandler('delete');
  },

  /**
   * Returns the code of the update handler.
   * The code must previously be loaded by the {@link baqend.metamodel.Code} object of the {@link baqend.EntityManager}.
   *
   * @returns {Function} null if no code has been loaded
   */
  get onUpdate() {
    return this._getHandler('update');
  },

  /**
   * Returns the code of the validation handler.
   *
   * @returns {Function}
   */
  get onValidate() {
    return this._managedType.validationCode;
  },

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param {Object} json
   * @returns {baqend.binding.Entity} instance
   */
  fromJSON: function(json) {
    var instance = json._objectInfo? this._db.getReference(this._managedType.typeConstructor, json._objectInfo.id): this.newInstance();
    var metadata = Metadata.get(instance);
    metadata.setDatabaseObject(json);
    metadata.setDirty();
    return instance;
  },

  /**
   * Creates a new query for this class
   * @return {baqend.Query.Builder} The query builder
   */
  find: function() {
    return this._db.createQueryBuilder(this._managedType.typeConstructor);
  },

  partialUpdate: function() {
    throw new Error("partialUpdate is not yet implemented.");
  }
});
},{"../util/Metadata":53,"./ManagedFactory":12}],11:[function(require,module,exports){
var Metadata = require('../util/Metadata');

/**
 * @mixin baqend.binding.Managed
 */
var Managed = module.exports = Trait.inherit(/** @lends baqend.binding.Managed.prototype */ {

  /**
   * The metadata of this object
   * @type baqend.util.Metadata
   */
  _metadata: {
    get: function() {
      return this.__metadata || (this._metadata = new Metadata(this));
    },

    set: function(metadata) {
      if(!this.__metadata) {
        Object.defineProperty(this, '__metadata', {
          value: metadata,
          writable: false
        });
      } else {
        throw new Error("Metadata has already been set.")
      }
    }
  }

});
},{"../util/Metadata":53}],12:[function(require,module,exports){
/**
 * @class baqend.binding.ManagedFactory
 * @template <T> The type of the factory
 */
var ManagedFactory = module.exports = Object.inherit(/** @lends baqend.binding.ManagedFactory.prototype */ {

  /** @lends baqend.binding.ManagedFactory */
  extend: {
    /**
     * Creates a new ManagedFactory for the given type
     * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
     * @param {baqend.EntityManager} db
     * @return {baqend.binding.ManagedFactory<T>} A new object factory to created instances of T
     */
    create: function(managedType, db) {
      var factory = function() {
        return factory.newInstance(arguments);
      };

      Object.cloneOwnProperties(factory, ManagedFactory.prototype);
      factory.initialize(managedType, db);
      return factory;
    }
  },

  /**
   * Indicates if the given object is an instance of the factoryies type
   * @param {*} obj The instance to check
   * @return {boolean} <code>true</code> if the object is an instance of the factories type
   */
  isInstance: function(obj) {
    return this._managedType.typeConstructor.isInstance(obj);
  },

  /**
   * Return the object if the given object is an instance of the factoryies type
   * @param {*} obj The instance to check
   * @return {*} The object, if the object is an instance of the factories type otherwise <code>null</code>
   */
  asInstance: function(obj) {
    return this._managedType.typeConstructor.asInstance(obj);
  },

  /**
   * Methods that are added to object instances
   * @type object
   */
  methods: null,

  /**
   * @protected
   * @type baqend.metamodel.ManagedType
   */
  _managedType: null,

  /**
   * @protected
   * @type baqend.EntityManager
   */
  _db: null,

  /**
   * Initialize a new ManagedFactory for the given type and database
   * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
   * @param {baqend.EntityManager} db The EntityManager used by this factory
   * @private
   */
  initialize: function(managedType, db) {
    this.methods = managedType.typeConstructor.prototype;
    this._managedType = managedType;
    this._db = db;
  },

  /**
   * Creates a new instance of the factory type
   * @params *[] args Constructor arguments used for instantiation
   * @return {T} A new created instance of T
   */
  newInstance: function(args) {
    var typeInstance = this._managedType.create();
    this._managedType.typeConstructor.apply(typeInstance, args);
    return typeInstance;
  },

  /**
   * Adds methods to instances of this factories type
   * @param {object} methods The methods to add
   */
  addMethods: function(methods) {
    Object.extend(this.methods, methods);
  },

  /**
   * Add a method to instances of this factories type
   * @param {string} name The method name to add
   * @param {function} fn The Method to add
   */
  addMethod: function(name, fn) {
    this.methods[name] = fn;
  }

});
},{}],13:[function(require,module,exports){
var Entity = require('./Entity');
var User = require('./User');
var Set = require('../collection').Set;

/**
 * @mixin baqend.binding.Role
 * @mixes baqend.binding.Entity
 */
var Role = module.exports = Entity.inherit(/** @lends baqend.binding.Role.prototype */ {

  /**
   * A set of users which have this role
   * @type baqend.Set
   */
  get users() {
    return this.users = new Set();
  },

  set users(value) {
    Object.defineProperty(this, 'users', {
      value: value,
      writable: true,
      configurable: true,
      enumerable: true
    });
  },

  /**
   * The name of the role
   * @type String
   */
  name: null,

  /**
   * Initialize the Role object
   */
  initialize: function() {
    this.users = new Set();
  },

  /**
   * Test if the given user has this role
   * @return {Boolean} <code>true</code> if the given user has this role,
   * otherwise <code>false</code>
   */
  hasUser: function(user) {
    return this.users.has(user);
  },

  /**
   * Add the given user to this role
   * @param {baqend.binding.User} user The user to add
   */
  addUser: function(user) {
    if (User.isInstance(user)) {
      this.users.add(user);
    } else {
      throw new Error('Only user instances can be added to a role.');
    }
  },

  /**
   * Remove the given user from this role
   * @param {baqend.binding.User} user The user to remove
   */
  removeUser: function(user) {
    if (User.isInstance(user)) {
      this.users.remove(user);
    } else {
      throw new Error('Only user instances can be removed from a role.');
    }
  }

});



},{"../collection":17,"./Entity":9,"./User":14}],14:[function(require,module,exports){
var Entity = require('./Entity');

/**
 * @mixin baqend.binding.User
 * @mixes baqend.binding.Entity
 */
var User = module.exports = Entity.inherit(/** @lends baqend.binding.User.prototype */ {

  /**
   * The name of the user
   * @type String
   */
  username: null,

  /**
   * The email of the user
   * @type String
   */
  email: null

});



},{"./Entity":9}],15:[function(require,module,exports){
var EntityFactory = require('./EntityFactory');

/**
 * @class baqend.binding.UserFactory
 * @extends baqend.binding.EntityFactory<baqend.binding.User>
 */
var UserFactory = module.exports = EntityFactory.inherit(/** @lends baqend.binding.UserFactory.prototype */ {

  /** @lends baqend.binding.UserFactory */
  extend: {
    /**
     * Creates a new UserFactory
     * @param {baqend.metamodel.ManagedType} managedType The metadata of the user type
     * @param {baqend.EntityManager} db
     * @return {baqend.binding.UserFactory} A new object factory to created instances of Users
     */
    create: function(managedType, db) {
      var factory = EntityFactory.create(managedType, db);
      Object.cloneOwnProperties(factory, UserFactory.prototype);
      return factory;
    }
  },

  /**
   * Register a new user with the given username and password, if the username is not used by an another user.
   * @param {String} username The unique username
   * @param {String} password The password for the given user
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>} The created user object, for the new registered user.
   */
  register: function(username, password, doneCallback, failCallback) {
    return this._db.register(username, password).then(doneCallback, failCallback);
  },

  /**
   * Log in the user with the given username and password and starts a user session
   * @param {String} username The username of the user
   * @param {String} password The password of the user
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   */
  login: function(username, password, doneCallback, failCallback) {
    return this._db.login(username, password).then(doneCallback, failCallback);
  },

  /**
   * Log out the current logged in user and ends the active user session
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<null>}
   */
  logout: function(doneCallback, failCallback) {
    return this._db.logout().then(doneCallback, failCallback);
  },

  /**
   * The current logged in user, or <code>null</code> if the user is not logged in
   * @type baqend.binding.User
   */
  get me() {
    return this._db.me;
  }

});
},{"./EntityFactory":10}],16:[function(require,module,exports){
exports.Accessor = require('./Accessor');
exports.Enhancer = require('./Enhancer');
exports.ManagedFactory = require('./ManagedFactory');
exports.EntityFactory = require('./EntityFactory');
exports.UserFactory = require('./UserFactory');
exports.Managed = require('./Managed');
exports.Entity = require('./Entity');
exports.Role = require('./Role');
exports.User = require('./User');
},{"./Accessor":7,"./Enhancer":8,"./Entity":9,"./EntityFactory":10,"./Managed":11,"./ManagedFactory":12,"./Role":13,"./User":14,"./UserFactory":15}],17:[function(require,module,exports){
var Metadata = require('./util/Metadata');
var Iterator, IndexIterator, PropertyIterator, Iterable, Collection, List, Set, Map;

/**
 * @typedef {Object} baqend.Iterator.Item
 * @property {Boolean} done Indicates if the iterator has no more elements
 * @property {*} value Tha actual iterated element
 */

/**
 * @mixin baqend.Iterator
 */
exports.Iterator = Iterator = Trait.inherit( /** @lends baqend.Iterator.prototype */ {
  /** @lends baqend.Iterator */
  extend: {
    conv: function(obj) {
      if (obj) {
        if (obj.iterator && Function.isInstance(obj.iterator)) {
          return obj.iterator();
        } else if (Array.isInstance(obj)) {
          return new IndexIterator(obj.length, function(index) {
            return [index, obj[index]];
          });
        } else {
          return new PropertyIterator(obj);
        }
      }
    },

    /**
     * @type baqend.Iterator.Item
     */
    DONE: {done: true}
  },

  /**
   * Returns this instance
   * @returns {baqend.Iterator} this iterator instance
   */
  iterator: function() {
    return this;
  },

  /**
   * Gets the next item or throws a StopIteration error if there are no more elements left
   * @return {baqend.Iterator.Item} The next item
   */
  next: function() {
    return Iterator.DONE;
  }
});

/**
 * @class baqend.IndexIterator
 * @mixes baqend.Iterator
 */
exports.IndexIterator = IndexIterator = Object.inherit(Iterator, /** @lends baqend.IndexIterator.prototype */ {
  length: 0,
  index: 0,

  /**
   * @type Function
   */
  accessor: null,

  initialize: function(length, accessor) {
    this.length = length;

    if (accessor)
      this.accessor = accessor;
  },

  /**
   * Gets the next item
   * @return {baqend.Iterator.Item} The next item
   */
  next: function() {
    if (this.index < this.length) {
      var result = {done: false, index: this.index, value: this.accessor(this.index)}
      this.index++;
      return result;
    } else {
      return Iterator.DONE;
    }
  }
});

/**
 * @class baqend.PropertyIterator
 * @mixes baqend.Iterator
 */
exports.PropertyIterator = PropertyIterator = Iterator.inherit(/** baqend.PropertyIterator.prototype */ {
  names: null,
  object: null,
  index: 0,

  initialize: function(object) {
    this.object = object;
    this.names = Object.getOwnPropertyNames(object);
  },

  next: function() {
    if (this.names.length < this.index) {
      var name = this.names[this.index++];
      return {done: false, index: name, value: this.object[name]};
    } else {
      return Iterator.DONE;
    }
  }
});

/**
 * @mixin baqend.Iterable
 */
exports.Iterable = Iterable = Trait.inherit( /** @lends baqend.Iterable.prototype */ {
  /**
   * Executes a provided function once per array element.
   * @param {Function} callback Function to execute for each element.
   * @param {*} thisArg Value to use as this when executing callback.
   */
  forEach: function(callback, thisArg) {
    if (!callback || !Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      callback.call(thisArg, item.value, item.index, this);
    }
  },

  /**
   * Tests whether all elements in the array pass the test implemented by the provided function.
   * @param {Function} callback Function to test for each element.
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {boolean} true if all elements in the array pass the test
   */
  every: function(callback, thisArg) {
    if (!callback || !Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      if (!callback.call(thisArg, item.value, item.index, this))
        return false;
    }

    return true;
  },

  /**
   * Tests whether some element in the array passes the test implemented by the provided function.
   * @param {Function} callback Function to test for each element.
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {boolean} true if some element in the array passes the test
   */
  some: function(callback, thisArg) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      if (callback.call(thisArg, item.value, item.index, this))
        return true;
    }

    return false;
  },

  /**
   * Creates a new instance of this object with all elements that pass the test implemented by the provided function.
   * @param {Function} callback Function to test each element of the array.
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {*} A new instance of this object with all elements that pass the test
   */
  filter: function(callback, thisArg) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    var result = new this.constructor();
    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      if (callback.call(thisArg, item.value, item.index, this)) {
        if (result.set) {
          result.set(item.index, item.value);
        } else {
          result.add(item.value);
        }
      }
    }

    return result;
  },

  /**
   * Creates a new instance of this object with the results of calling a provided function on every element in this array.
   * @param {Function} callback Function that produces an element of the new object
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {*} A new instance of this object with the results
   */
  map: function(callback, thisArg) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    var result = new this.constructor();
    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      item = callback.call(thisArg, item.value, item.index, this);
      if (result.set) {
        result.set(item.index, item.value);
      } else {
        result.add(item.value);
      }
    }

    return result;
  },

  /**
   * Applies a function against an accumulator and each element
   * (from left-to-right) has to reduce it to a single value.
   * @param {Function} callback Function to execute on each element
   * @param {*} previousValue Object to use as the first argument to the first call of the callback.
   * @returns {*}
   */
  reduce: function(callback, previousValue) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    var iter = Iterator(this);
    if (arguments.length == 1) {
      previousValue = iter.next().value;
    }

    var item;
    while (!(item = iter.next()).done) {
      previousValue = callback.call(null, previousValue, item.value, item.index, this);
    }

    return previousValue;
  }
});

/**
 * @class baqend.Collection
 * @mixes baqend.Iterable
 */
exports.Collection = Collection = Object.inherit(Iterable, /** @lends baqend.Collection.prototype */ {
  /** @lends baqend.Collection */
  extend: {
    conv: function(items) {
      if (items) {
        if (Array.isInstance(items)) {
          var col = new this();
          for (var i = 0, len = items.length; i < len; ++i) {
            col.add(items[i]);
          }

          return col;
        } else if (Collection.isInstance(items)) {
          return new this(items);
        }
      }

      return null;
    }
  },

  size: 0,
  seq: [],

  initialize: function(collection) {
    this.seq = [];
    this.size = 0;
    if (collection) {
      for (var iter = collection.iterator(), item = iter.next(); !item.done; item = iter.next()) {
        this.add(item.value);
      }
    }
  },

  /**
   * Indicates if this collection contains the element
   * @param element The element to test
   * @returns {boolean} true if the collection contains the element
   */
  has: function(element) {
    Metadata.readAccess(this);
    return this.seq.indexOf(element) != -1;
  },

  /**
   * Add a alement to the collection
   * @param element The element to add
   */
  add: function(element) {
    Metadata.writeAccess(this);
    this.seq[this.size++] = element;
  },

  /**
   * Removes teh element form the collection
   * @param element The element to remove
   */
  remove: function(element) {
    Metadata.writeAccess(this);
    var index = this.seq.indexOf(element);
    if (index > -1) {
      this.seq.splice(index, 1);
      this.size--;
    }
  },

  /**
   * Gets an iterator over the elements of the collection
   * @returns {baqend.IndexIterator} An iterator over the elements
   */
  items: function() {
    Metadata.readAccess(this);
    var seq = this.seq;
    return new IndexIterator(this.size, function(index) {
      return seq[index];
    });
  },

  /**
   * Gets an iterator over the elements of the collection
   * @returns {baqend.IndexIterator} An iterator over the elements
   */
  iterator: function() {
    Metadata.readAccess(this);
    return this.items();
  },

  toString: function() {
    Metadata.readAccess(this);
    return this.seq.toString();
  },

  toJSON: function() {
    Metadata.readAccess(this);
    return this.seq;
  }
});

/**
 * @class baqend.List
 * @extends baqend.Collection
 */
exports.List = List = Collection.inherit(/** @lends baqend.List.prototype */ {
  extend: {
    conv: Collection.conv
  },

  /**
   * Get the value by index
   * @param index The index
   * @returns {*} The value of the index
   */
  get: function(index) {
    Metadata.readAccess(this);
    if (index < 0) {
      index = this.size + index;
    }

    if (index >= 0 && index < this.size) {
      return this.seq[index];
    }
  },

  /**
   * Sets the value at index
   * @param index The index
   * @param value The new value
   */
  set: function(index, value) {
    Metadata.writeAccess(this);
    if (index < 0) {
      index = this.size + index;
    }

    if (index < 0) {
      this.seq.unshift(value);
      this.size++;
    } else if (index >= this.size) {
      this.seq.push(value);
      this.size++;
    } else {
      this.seq[index] = value;
    }
  },

  /**
   * Gets the index of an value
   * @param value The value to search
   * @returns {*} The index of the value, or -1 if the value was not found
   */
  indexOf: function(value) {
    Metadata.readAccess(this);
    return this.seq.indexOf(value);
  },

  /**
   * Gets the last index of the value
   * @param value The value to search
   * @returns {*} The last index of the value, or -1 if teh value was not found
   */
  lastIndexOf: function(value) {
    Metadata.readAccess(this);
    return this.seq.lastIndexOf(value);
  }
});

/**
 * @class baqend.Set
 * @extends baqend.Collection
 */
exports.Set = Set = Collection.inherit(/** @lends baqend.Set.prototype */ {
  extend: {
    conv: Collection.conv
  },

  /**
   * Adds the element ot the collection, if the collection doesn't contain the element
   * @param value The value to add
   */
  add: function(value) {
    Metadata.readAccess(this);
    var index = this.seq.indexOf(value);
    if (index < 0) {
      this.seq[this.size++] = value;
    }
  }
});

/**
 * @class baqend.Map
 * @extends baqend.Collection
 */
exports.Map = Map = Collection.inherit(/** @lends baqend.Map.prototype */ {
  /** @lends baqend.Map */
  extend: {
    /**
     * @class baqend.Map.Iterator
     * @mixes baqend.Iterator
     */
    Iterator: Object.inherit(Iterator, /** @lends baqend.Map.Iterator.prototype */ {
      index: 0,
      map: null,

      initialize: function(map) {
        this.map = map;
      },

      next: function() {
        if (this.index < this.map.size) {
          var index = this.index++;
          return {done: false, index: this.map.seq[index], value: this.map.vals[index]};
        } else {
          return Iterator.DONE;
        }
      }
    }),

    conv: function(items) {
      if (items) {
        if (Array.isInstance(items)) {
          var map = new this();
          for (var i = 0, item; item = items[i]; ++i) {
            if ('key' in item && 'value' in item) {
              map.set(item['key'], item['value']);
            } else {
              break;
            }
          }

          if (map.size == items.length)
            return map;
        } else if (Collection.isInstance(items)) {
          return new this(items);
        }
      }

      return null;
    }
  },

  initialize: function(collection) {
    this.vals = [];

    if (Collection.isInstance(collection)) {
      for (var iter = collection.items(), item = iter.next(); !item.done; item = iter.next()) {
        this.set(item.index, item.value);
      }
    }
  },

  /**
   * Gets the associated value of the key
   * @param key The key
   * @returns {*} The associated value
   */
  get: function(key) {
    Metadata.readAccess(this);
    var index = this.seq.indexOf(key);
    if (index > -1) {
      return this.vals[index];
    }
  },

  /**
   * Adds the given key, without an value
   * @param key The key to add
   */
  add: function(key) {
    Metadata.writeAccess(this);
    this.set(key);
  },

  /**
   * Sets the value of an key
   * @param key The key
   * @param value The new value
   */
  set: function(key, value) {
    Metadata.writeAccess(this);
    var index = this.seq.indexOf(key);
    if (index == -1) {
      index = this.seq.length;
      this.seq[index] = key;
      this.size++;
    }

    this.vals[index] = value;
  },

  /**
   * Removes the key and the associated value
   * @param key The key to remove
   */
  remove: function(key) {
    Metadata.writeAccess(this);
    var index = this.seq.indexOf(key);
    if (index > -1) {
      this.seq.splice(index, 1);
      this.vals.splice(index, 1);
      this.size--;
    }
  },

  /**
   * Returns an map iterator
   * @returns {baqend.Map.Iterator} A iterator to traverse the key value mapping
   */
  items: function() {
    Metadata.readAccess(this);
    return new Map.Iterator(this);
  },

  /**
   * Gets a iterator over the keys
   * @returns {*} A key iterator
   */
  keys: function() {
    Metadata.readAccess(this);
    return this.iterator();
  },

  /**
   * Gets a iterator over the values
   * @returns {*} A value iterator
   */
  values: function() {
    Metadata.readAccess(this);
    var map = this;
    return new IndexIterator(this.size, function(index) {
      return map.seq[index];
    });
  },

  toString: function() {
    Metadata.readAccess(this);
    var str = '';
    for (var i = 0, len = this.size; i < len; ++i) {
      if (str != '')
        str += ', ';

      str += this.seq[i];
      str += ': ';
      str += this.vals[i];
    }
    return '[' + str + ']';
  },

  toJSON: function() {
    Metadata.readAccess(this);
    var map = [];
    for (var i = 0, len = this.size; i < len; ++i) {
      map.push({
        key: this.seq[i],
        value: this.vals[i]
      });
    }
    return map;
  }
});

},{"./util/Metadata":53}],18:[function(require,module,exports){
var PersistentError = require('../error/PersistentError');

/**
 * @class baqend.connector.Connector
 */
var Connector = module.exports = Object.inherit(/** @lends baqend.connector.Connector.prototype */{
  /** @lends baqend.connector.Connector */
  extend: {
    /**
     * An array of all exposed response headers
     * @type String[]
     */
    RESPONSE_HEADERS: [
      'Orestes-Authorization-Token'
    ],

    /**
     * Array of all available connector implementations
     * @type baqend.connector.Connector[]
     */
    connectors: [],

    /**
     * Array of all created connections
     * @type Object<string,baqend.connector.Connector>
     */
    connections: {},

    /**
     * @param {String} host or location
     * @param {number=} port
     * @param {boolean=} secure <code>true</code> for an secure connection
     * @return {baqend.connector.Connector}
     */
    create: function(host, port, secure) {
      if (!host && typeof window !== 'undefined') {
        host = window.location.hostname;
        port = Number(window.location.port);
        secure = window.location.protocol == 'https:';
      }

      if (host.indexOf('/') != -1) {
        var matches = /^(https?):\/\/([^\/:]*)(:(\d*))?\/?$/.exec(host);
        if (matches) {
          secure = matches[1] == 'https';
          host = matches[2];
          port = matches[4];
        } else {
          throw new Error('The connection uri host ' + host + ' seems not to be valid');
        }
      }

      if (!port)
        port = secure? 443: 80;

      var url = 'http' + (secure? 's': '') + '://' + host + ':' + port;
      var connection = this.connections[url];

      if (!connection) {
        for (var name in this.connectors) {
          var connector = this.connectors[name];
          if (connector.isUsable && connector.isUsable(host, port, secure)) {
            connection = new connector(host, port, secure);
            break;
          }
        }

        if (!connection)
          throw new Error('No connector is usable for the requested connection.');

        this.connections[url] = connection;
      }

      return connection;
    }
  },

  /**
   * @param {String} host
   * @param {number} port
   * @param {boolean} secure
   */
  initialize: function(host, port, secure) {
    this.host = host;
    this.port = port;
    this.secure = secure;
  },

  /**
   * @param {baqend.connector.Message} message
   * @returns {Promise<baqend.connector.Message>}
   */
  send: function(message) {
    return new Promise(function(resolve, reject) {
      this.prepareRequestEntity(message);
      this.doSend(message.request, this.receive.bind(this, message, resolve, reject));
    }.bind(this)).catch(function(e) {
      throw PersistentError(e);
    });
  },

  /**
   * @param {baqend.connector.Message} message
   * @param {Function} resolve
   * @param {Function} reject
   * @param {Object} response
   */
  receive: function(message, resolve, reject, response) {
    message.response = response;
    try {
      this.prepareResponseEntity(message);
      message.doReceive();
      resolve(message);
    } catch (e) {
      e = PersistentError(e);
      message.response.entity = null;
      reject(e);
    }
  },

  /**
   * Handle the actual message send
   * @param {baqend.connector.Message} message
   * @param {Function} receive
   * @abstract
   */
  doSend: function(request, receive) {},

  /**
   * @param {baqend.connector.Message} message
   */
  prepareRequestEntity: function(message) {
    if (message.request.entity) {
      message.request.headers['Content-Type'] = 'application/json;charset=utf-8';
      message.request.entity = JSON.stringify(message.request.entity);
    }
  },

  /**
   * @param {baqend.connector.Message} message
   * @param {Object} data
   */
  prepareResponseEntity: function(message) {
    var entity = message.response.entity;
    if (entity && entity.length > 0) {
      entity = JSON.parse(entity);
    } else {
      entity = null;
    }
    message.response.entity = entity;
  }
});
},{"../error/PersistentError":28}],19:[function(require,module,exports){
var Connector = require('./Connector');

/**
 * @class baqend.connector.IFrameConnector
 * @extends baqend.connector.Connector
 */
var IFrameConnector = module.exports = Connector.inherit(/** @lends baqend.connector.IFrameConnector.prototype */ {
  /** @lends baqend.connector.IFrameConnector */
  extend: {
    loadedAttr: 'data-loaded',
    style: 'width:1px;height:1px;position:absolute;top:-10px;left:-10px;',

    initialize: function() {
      Connector.connectors.push(this);
    },

    /**
     * Indicates if this connector implementation is usable for the given host and port
     * @param {String} host
     * @param {number} port
     * @param {boolean} secure
     * @returns {boolean}
     */
    isUsable: function(host, port, secure) {
      return typeof window != 'undefined' &&
          (window.location.hostname != host || window.location.port != port);
    }
  },

  queue: null,
  origin: null,
  iframe: null,
  messages: null,
  mid: 0,

  initialize: function(host, port, secure) {
    this.origin = (secure? 'https://': 'http://') + host;
    this.origin = port == 80 || port == 443? this.origin: this.origin + ':' + port;
    this.messages = {};
    var src = this.origin + '/connect';

    this.iframe = document.querySelector('iframe[src="'+ src + '"]');
    if (!this.iframe || this.iframe.src != src) {
      this.iframe = document.createElement('iframe');
      this.iframe.src = src;
      this.iframe.setAttribute("style", IFrameConnector.style);
      document.body.appendChild(this.iframe);
    }

    if(!this.isLoaded()) {
      this.queue = [];
      this.iframe.addEventListener('load', this.onLoad.bind(this), false);
    }

    window.addEventListener('message', this.doReceive.bind(this), false);
  },

  onLoad: function() {
    var queue = this.queue;

    for (var i = 0; i < queue.length; ++i) {
      this.iframe.contentWindow.postMessage(queue[i], this.origin);
    }

    this.queue = null;
    this.setLoaded();
  },

  setLoaded: function() {
    this.iframe.setAttribute(IFrameConnector.loadedAttr, true);
  },

  isLoaded: function() {
    return !!this.iframe.getAttribute(IFrameConnector.loadedAttr);
  },

  /**
   * @param {Object} request
   * @param {Function} receive
   */
  doSend: function(request, receive) {
    var msg = {
      mid: ++this.mid,
      method: request.method,
      path: request.path,
      headers: request.headers,
      entity: request.entity,
      responseHeaders: Connector.RESPONSE_HEADERS
    };

    this.messages[msg.mid] = {
      request: request,
      receive: receive
    };

    msg = JSON.stringify(msg);
    if (this.queue) {
      this.queue.push(msg);
    } else {
      this.iframe.contentWindow.postMessage(msg, this.origin);
    }
  },

  doReceive: function(event) {
    if(event.origin !== this.origin || event.data[0] != '{') {
      return;
    }

    var msg = JSON.parse(event.data);

    var message = this.messages[msg.mid];
    delete this.messages[msg.mid];

    message.receive({
      statusCode: msg.statusCode,
      headers: msg.headers,
      entity: msg.entity
    });
  }
});
},{"./Connector":18}],20:[function(require,module,exports){
var CommunicationError = require('../error/CommunicationError');

/**
 * @class baqend.connector.Message
 */
var Message = module.exports = Object.inherit(/** @lends baqend.connector.Message.prototype */ {

  /** @lends baqend.connector.Message */
  extend: {
    /**
     * @enum {number}
     */
    StatusCode: {
      NOT_MODIFIED: 304,
      BAD_CREDENTIALS: 460,
      BUCKET_NOT_FOUND: 461,
      INVALID_PERMISSION_MODIFICATION: 462,
      INVALID_TYPE_VALUE: 463,
      OBJECT_NOT_FOUND: 404,
      OBJECT_OUT_OF_DATE: 412,
      PERMISSION_DENIED: 466,
      QUERY_DISPOSED: 467,
      QUERY_NOT_SUPPORTED: 468,
      SCHEMA_NOT_COMPATIBLE: 469,
      SCHEMA_STILL_EXISTS: 470,
      SYNTAX_ERROR: 471,
      TRANSACTION_INACTIVE: 472,
      TYPE_ALREADY_EXISTS: 473,
      TYPE_STILL_REFERENCED: 474
    },

    /**
     * Creates a new message class with the given message specification
     * @param {object} spec
     * @return {Function}
     */
    create: function(spec) {
      return Message.inherit({
        spec: spec
      });
    }
  },

  /**
   * Message specification
   * @type object
   */
  spec: null,

  /**
   * @type {boolean}
   */
  withCredentials: false,

  /**
   * @param {String} arguments... The path arguments
   */
  initialize: function() {
    var args = arguments;
    var index = 0;

    this.request = {
      method: this.spec.method,
      path: this.spec.params.map(function(param) {
        if (Number.isInstance(param)) {
          index++;
          return encodeURIComponent(args[param]);
        } else {
          return param;
        }
      }).join(''),
      headers: {
        'accept': 'application/json'
      },
      entity: args[index] || null
    };

    this.response = {
      statusCode: 0,
      headers: {},
      entity: null
    };
  },

  setIfMatch: function(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-Match'] = value;
  },

  setIfNoneMatch: function(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-None-Match'] = value;
  },

  setCacheControl: function(value) {
    this.request.headers['Cache-Control'] = value;
  },

  getAuthorizationToken: function() {
    return this.response.headers['Orestes-Authorization-Token'] || this.response.headers['orestes-authorization-token'];
  },

  setAuthorizationToken: function(value) {
    this.request.headers['Authorization'] = 'BAT ' + value;
  },

  /**
   * @param {String=} value
   */
  withAuthorizationToken: function(value) {
    if(value) {
      this.setAuthorizationToken(value)
    } else {
      this.request.withCredentials = true;
    }
  },

  /**
   * Handle the receive
   */
  doReceive: function() {
    if (this.spec.status.indexOf(this.response.statusCode) == -1) {
      throw new CommunicationError(this);
    }
  }
});
},{"../error/CommunicationError":24}],21:[function(require,module,exports){
var Connector = require('./Connector');

/**
 * @class baqend.connector.NodeConnector
 * @extends baqend.connector.Connector
 */
var NodeConnector = module.exports = Connector.inherit(/** @lends baqend.connector.NodeConnector.prototype */ {
  /** @lends baqend.connector.NodeConnector */
  extend: {
    initialize: function() {
      Connector.connectors.push(this);
    },

    isUsable: function(host, port, secure) {
      if (!this.prototype.http) {
        try {
          var http;
          if (secure) {
            http = require('https');
          } else {
            http = require('http');
          }

          if (http.request) {
            this.prototype.http = http;
          }
        } catch (e) {
        }
      }
      return Boolean(this.prototype.http);
    }
  },

  cookie: null,

  /**
   * @param {Object} request
   * @param {Function} receive
   */
  doSend: function(request, receive) {
    request.host = this.host;
    request.port = this.port;

    var self = this;
    var entity = request.entity;

    if (entity)
      request.headers['Transfer-Encoding'] = 'chunked';

    if (this.cookie && this.secure && request.withCredentials)
      request.headers['Cookie'] = this.cookie;

    var req = this.http.request(request, function(res) {
      var data = '';

      res.setEncoding('utf-8');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        var cookie = res.headers['set-cookie'];
        if (cookie) {
          // cookie may be an array, convert it to a string
          self.cookie = self.parseCookie(cookie + '');
        }

        receive({
          statusCode: res.statusCode,
          headers: res.headers,
          entity: data
        });
      });
    });

    req.on('error', function(e) {
      receive({
        statusCode: 0,
        error: e
      });
    });

    if (entity)
      req.write(entity, 'utf8');

    req.end();
  },

  /**
   * Parse the cookie header
   * @param {String} header
   */
  parseCookie: function(header) {
    var parts = header.split(';');

    for (var i = 0, part; part = parts[i]; ++i) {
      if (part.indexOf('Expires=') == 0) {
        var date = Date.parse(part.substring(8));
        if (date < Date.now()) {
          return null;
        }
      }
    }

    return parts[0];
  }
});
},{"./Connector":18,"http":undefined,"https":undefined}],22:[function(require,module,exports){
var Connector = require('./Connector');

/**
 * @class baqend.connector.XMLHttpConnector
 * @extends baqend.connector.Connector
 */
var XMLHttpConnector = module.exports = Connector.inherit(/** @lends baqend.connector.XMLHttpConnector.prototype */ {
  /** @lends baqend.connector.XMLHttpConnector */
	extend: {
    initialize: function() {
      Connector.connectors.push(this);
    },

    /**
     * Indicates if this connector implementation is usable for the given host and port
     * @param {String} host
     * @param {number} port
     * @param {boolean} secure
     * @returns {boolean}
     */
		isUsable: function(host, port, secure) {
      if (typeof window != 'undefined') {
        if (window.location.hostname == host && window.location.port == port) {
          return typeof XMLHttpRequest != 'undefined'
        }
      }

      return false;
		}
	},
	
	/**
	 * @param {Object} request
	 * @param {Function} receive
	 */
	doSend: function(request, receive) {
		var xhr = new XMLHttpRequest();
		
		var url = (this.secure? 'https': 'http') + '://' + this.host + ':' + this.port + request.path;

	  xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var response = {
					headers: {},
					statusCode: xhr.status,
					entity: xhr.response || xhr.responseText
				};

				Connector.RESPONSE_HEADERS.forEach(function(name) {
					response.headers[name] = xhr.getResponseHeader(name);
				});

				receive(response);
			}
		};

		xhr.open(request.method, url, true);

		var entity = request.entity;
		var headers = request.headers;
		for (var name in headers)
			xhr.setRequestHeader(name, headers[name]);

    xhr.withCredentials = request.withCredentials;

		xhr.send(entity);
	}
});
},{"./Connector":18}],23:[function(require,module,exports){
exports.Message = require('./Message');
exports.Connector = require('./Connector');
exports.NodeConnector = require('./NodeConnector');
exports.XMLHttpConnector = require('./XMLHttpConnector');
exports.IFrameConnector = require('./IFrameConnector');
},{"./Connector":18,"./IFrameConnector":19,"./Message":20,"./NodeConnector":21,"./XMLHttpConnector":22}],24:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.CommunicationError
 * @extends baqend.error.PersistentError
 *
 * @param {baqend.connector.Message} httpMessage
 */
var CommunicationError = module.exports = PersistentError.inherit(/** @lends baqend.error.CommunicationError */ {

  statusCode: 0,

	initialize: function(httpMessage) {
		var state = (httpMessage.response.statusCode == 0? 'Request': 'Response');
    this.superCall('baqend.error.CommunicationError: Communication failed by handling the ' + state + ' for ' +
				httpMessage.request.method + ' ' + httpMessage.request.path, httpMessage.response.entity);

    this.statusCode = httpMessage.response.statusCode;


		var cause = httpMessage.response.entity;

    if(cause && cause.data)
      this.data = cause.data;

		while (cause) {
			this.stack += '\nServerside Caused by: ' + cause.className + ' ' + cause.message;
			
			var stackTrace = cause.stackTrace;
			for (var i = 0; i < stackTrace.length; ++i) {
				var el = stackTrace[i];

				this.stack += '\n    at ' + el.className + '.' + el.methodName;
				this.stack += ' (' + el.fileName + ':' + el.lineNumber + ')';
			}
			
			cause = cause.cause;
		}
	}
});
},{"./PersistentError":28}],25:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityExistsError
 * @extends baqend.error.PersistentError
 *
 * @param {String} entity
 */
var EntityExistsError = module.exports = PersistentError.inherit(/** @lends baqend.error.EntityExistsError.prototype */{
  initialize: function(entity) {
    this.superCall('baqend.error.EntityExistsError: The entity ' + entity + ' is managed by a different db.');

    this.entity = entity;
  }
});
},{"./PersistentError":28}],26:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityNotFoundError
 * @extends baqend.error.PersistentError
 *
 * @param {String} identity
 */
var EntityNotFoundError = module.exports = PersistentError.inherit(/** @lends baqend.error.EntityNotFoundError.prototype */ {
  initialize: function(identity) {
    this.superCall('baqend.error.EntityNotFoundError: Entity ' + identity + ' is not found');

    this.identity = identity;
  }
});
},{"./PersistentError":28}],27:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.IllegalEntityError
 * @extends baqend.error.PersistentError
 *
 * @param {*} entity
 */
var IllegalEntityError = module.exports = PersistentError.inherit({
  initialize: function(entity) {
		this.superCall('baqend.error.IllegalEntityError: Entity ' + entity + ' is not a valid entity');
		
		this.entity = entity;
	}
});
},{"./PersistentError":28}],28:[function(require,module,exports){
/**
 * @class baqend.error.PersistentError
 * @extends Error
 *
 * @param {String} message
 * @param {Error=} cause
 */
var PersistentError = module.exports = Error.inherit(/* @lends baqend.error.PersistentError.prototype */ {
	cause: null,

  /**
   * @lends baqend.error.PersistentError
   */
	extend: {
		conv: function(e) {
			if (Error.isInstance(e)) {
				return new this(null, e);
			}
		}
	},

	initialize: function(message, cause) {
		this.superCall(message? message: 'baqend.error.PersistentError: An unexpected persistent error occured. ' + cause? cause.message: '');

		if (cause) {
			this.cause = cause;
      if(cause.stack) {
        this.stack += '\nCaused By: ' + cause.stack;
      }
		}
	}
});
},{}],29:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.RollbackError
 * @extends baqend.error.PersistentError
 *
 * @param {Error} cause
 */
var RollbackError = module.exports = PersistentError.inherit(/* @lends baqend.error.RollbackError */ {
  initialize: function(cause) {
    this.superCall('baqend.error.RollbackError: The transaction has been rollbacked', cause);
  }
});

},{"./PersistentError":28}],30:[function(require,module,exports){
exports.CommunicationError = require('./CommunicationError');
exports.EntityExistsError = require('./EntityExistsError');
exports.EntityNotFoundError = require('./EntityNotFoundError');
exports.IllegalEntityError = require('./IllegalEntityError');
exports.PersistentError = require('./PersistentError');
exports.RollbackError = require('./RollbackError');
},{"./CommunicationError":24,"./EntityExistsError":25,"./EntityNotFoundError":26,"./IllegalEntityError":27,"./PersistentError":28,"./RollbackError":29}],31:[function(require,module,exports){
'use strict';

/**
 * @namespace baqend
 */

require('jahcode');
require('lie/lib/polyfill');
require('./polyfills');

var EntityManagerFactory = require('./EntityManagerFactory');
var EntityManager = require('./EntityManager');

var emf = new EntityManagerFactory({global: true});
exports = module.exports = emf.createEntityManager(true);

exports.collection = require('./collection');
exports.binding = require('./binding');
exports.connector = require('./connector');
exports.error = require('./error');
exports.message = require('./message');
exports.metamodel = require('./metamodel');
exports.util = require('./util');

exports.EntityManager = require('./EntityManager');
exports.EntityManagerFactory = require('./EntityManagerFactory');
exports.EntityTransaction = require('./EntityTransaction');
exports.Query = require('./Query');
exports.TypedQuery = require('./TypedQuery');

exports.connect = function(location, callback) {
  emf.connect(location);
  return this.ready(callback);
};

},{"./EntityManager":1,"./EntityManagerFactory":2,"./EntityTransaction":3,"./Query":5,"./TypedQuery":6,"./binding":16,"./collection":17,"./connector":23,"./error":30,"./message":32,"./metamodel":48,"./polyfills":49,"./util":57,"jahcode":59,"lie/lib/polyfill":64}],32:[function(require,module,exports){
var Message = require('./connector/Message');

/**
 * Get the list of all available subresources
 * 
 * @class baqend.message.ListAllResources
 * @extends baqend.connector.Message
 *
 */
exports.ListAllResources = Message.create({
    method: 'GET',
    params: ['/'],
    status: [200]
});

/**
 * Get the API version of the Orestes-Server
 * 
 * @class baqend.message.ApiVersion
 * @extends baqend.connector.Message
 *
 */
exports.ApiVersion = Message.create({
    method: 'GET',
    params: ['/version'],
    status: [200]
});

/**
 * List all API specification parts of the Orestes-Server
 * 
 * @class baqend.message.ListAllApis
 * @extends baqend.connector.Message
 *
 */
exports.ListAllApis = Message.create({
    method: 'GET',
    params: ['/spec'],
    status: [200]
});

/**
 * Get the API specification part of the Orestes-Server
 * 
 * @class baqend.message.ListApiSpecification
 * @extends baqend.connector.Message
 *
 * @param part {Object} The specification part name
 */
exports.ListApiSpecification = Message.create({
    method: 'GET',
    params: ['/spec/', 0],
    status: [200]
});

/**
 * List all subresources
 * 
 * @class baqend.message.ListDbResources
 * @extends baqend.connector.Message
 *
 */
exports.ListDbResources = Message.create({
    method: 'GET',
    params: ['/db'],
    status: [200]
});

/**
 * List all available bucket names
 * 
 * @class baqend.message.GetBucketNames
 * @extends baqend.connector.Message
 *
 */
exports.GetBucketNames = Message.create({
    method: 'GET',
    params: ['/db/all_buckets'],
    status: [200]
});

/**
 * List all available subresources of an bucket resource
 * 
 * @class baqend.message.ListBucketSubresurces
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.ListBucketSubresurces = Message.create({
    method: 'GET',
    params: ['/db/', 0],
    status: [200]
});

/**
 * get List all subresources
 * 
 * @class baqend.message.ListReplicationResources
 * @extends baqend.connector.Message
 *
 */
exports.ListReplicationResources = Message.create({
    method: 'GET',
    params: ['/replication'],
    status: [200]
});

/**
 * Returns all changed objects
 * 
 * @class baqend.message.GetBloomFilter
 * @extends baqend.connector.Message
 *
 */
exports.GetBloomFilter = Message.create({
    method: 'GET',
    params: ['/replication/bloomfilter'],
    status: [200]
});

/**
 * Get the current Orestes config
 * 
 * @class baqend.message.GetOrestesConfig
 * @extends baqend.connector.Message
 *
 */
exports.GetOrestesConfig = Message.create({
    method: 'GET',
    params: ['/config'],
    status: [200]
});

/**
 * Updates the current Orestes config
 * 
 * @class baqend.message.UpdateOrestesConfig
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.UpdateOrestesConfig = Message.create({
    method: 'PUT',
    params: ['/config'],
    status: [202, 204]
});

/**
 * Initialize the database and creates predefined objects
 * 
 * @class baqend.message.Create
 * @extends baqend.connector.Message
 *
 */
exports.Create = Message.create({
    method: 'POST',
    params: ['/create'],
    status: [201]
});

/**
 * Connects a browser to this server
 * 
 * @class baqend.message.Connect
 * @extends baqend.connector.Message
 *
 */
exports.Connect = Message.create({
    method: 'GET',
    params: ['/connect'],
    status: [200]
});

/**
 * List all bucket elements
 * List all elements of the bucket
 * 
 * @class baqend.message.GetBucketOids
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The offset from where to start from
 * @param count {Object} The number of objects to enlist
 */
exports.GetBucketOids = Message.create({
    method: 'GET',
    params: ['/db/', 0, '/all_oids;start=', 1, ';count=', 2],
    status: [200]
});

/**
 * Create object
 * Create the given Object.
 * The object will be created and gets a unique oid.
 * 
 * @class baqend.message.CreateObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.CreateObject = Message.create({
    method: 'POST',
    params: ['/db/', 0],
    status: [201, 202]
});

/**
 * Get object
 * Returns the specified object. Each object has one unique identifier and therefore only one location.
 * 
 * @class baqend.message.GetObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.GetObject = Message.create({
    method: 'GET',
    params: ['/db/', 0, '/', 1],
    status: [200, 304]
});

/**
 * Replace object
 * Replace the current object with the updated one.
 * To update an specific version you can specify its version Number in the If-Match Header.
 * You can use a * to override any Version, but error if the Object dose not exist or don't
 * set the Header to upsert.
 * 
 * @class baqend.message.ReplaceObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.ReplaceObject = Message.create({
    method: 'PUT',
    params: ['/db/', 0, '/', 1],
    status: [200, 202]
});

/**
 * Deletes the object
 * Deletes the object from the underling database. You can use the if Match Header to specify
 * an File Version to Delete or send * as If-Match Value to get an error response if the Object
 * was not found.
 * 
 * @class baqend.message.DeleteObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.DeleteObject = Message.create({
    method: 'DELETE',
    params: ['/db/', 0, '/', 1],
    status: [202, 204]
});

/**
 * Get all available class schemas
 * 
 * @class baqend.message.GetAllSchemas
 * @extends baqend.connector.Message
 *
 */
exports.GetAllSchemas = Message.create({
    method: 'GET',
    params: ['/db/schema'],
    status: [200]
});

/**
 * Create new class schemas and update existing class schemas
 * 
 * @class baqend.message.UpdateAllSchemas
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.UpdateAllSchemas = Message.create({
    method: 'POST',
    params: ['/db/schema'],
    status: [200]
});

/**
 * Replace all currently created schemas with the new ones
 * 
 * @class baqend.message.ReplaceAllSchemas
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.ReplaceAllSchemas = Message.create({
    method: 'PUT',
    params: ['/db/schema'],
    status: [200]
});

/**
 * Remove all currently created schemas
 * 
 * @class baqend.message.DeleteAllSchemas
 * @extends baqend.connector.Message
 *
 */
exports.DeleteAllSchemas = Message.create({
    method: 'DELETE',
    params: ['/db/schema'],
    status: [204, 304]
});

/**
 * Get the class schema
 * Returns the schema definition of the class
 * The class definition contains a link to its parent class and all persistable fields with there types of the class
 * 
 * @class baqend.message.GetSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.GetSchema = Message.create({
    method: 'GET',
    params: ['/db/schema/', 0],
    status: [200]
});

/**
 * Update the class schema
 * Modify the schema definition of the class by adding all missing fields
 * 
 * @class baqend.message.UpdateSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.UpdateSchema = Message.create({
    method: 'POST',
    params: ['/db/schema/', 0],
    status: [200]
});

/**
 * Replace the class schema
 * Replace the schema definition of the class
 * 
 * @class baqend.message.ReplaceSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.ReplaceSchema = Message.create({
    method: 'PUT',
    params: ['/db/schema/', 0],
    status: [200]
});

/**
 * Delete the class schema
 * Delete the schema definition of the class
 * 
 * @class baqend.message.DeleteSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.DeleteSchema = Message.create({
    method: 'DELETE',
    params: ['/db/schema/', 0],
    status: [204, 304]
});

/**
 * Executes an ad-hoc query
 * Returns a list of matching ids.
 * 
 * @class baqend.message.AdhocQueryIds
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param query {Object} The query
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 */
exports.AdhocQueryIds = Message.create({
    method: 'GET',
    params: ['/db/', 0, '/all_oid?query=', 1, '&start=', 2, '&count=', 3, '&sort=', 4],
    status: [200]
});

/**
 * Executes a basic ad-hoc query
 * Returns a list of matching objects.
 * 
 * @class baqend.message.AdhocQuery
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param query {Object} The query
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 */
exports.AdhocQuery = Message.create({
    method: 'GET',
    params: ['/db/', 0, '?query=', 1, '&start=', 2, '&count=', 3, '&sort=', 4],
    status: [200]
});

/**
 * Executes a count query
 * Returns the number of objects that match the query
 * 
 * @class baqend.message.AdhocCountQuery
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param query {Object} The query
 */
exports.AdhocCountQuery = Message.create({
    method: 'GET',
    params: ['/db/', 0, '/', 1, '/count'],
    status: [200]
});

/**
 * List all Query subresources
 * 
 * @class baqend.message.ListQueryResources
 * @extends baqend.connector.Message
 *
 */
exports.ListQueryResources = Message.create({
    method: 'GET',
    params: ['/query'],
    status: [200]
});

/**
 * Creates a prepared query
 * 
 * @class baqend.message.CreateQuery
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.CreateQuery = Message.create({
    method: 'POST',
    params: ['/query'],
    status: [201]
});

/**
 * List all subresources of a query
 * 
 * @class baqend.message.ListThisQueryResources
 * @extends baqend.connector.Message
 *
 * @param qid {Object} The query id
 */
exports.ListThisQueryResources = Message.create({
    method: 'GET',
    params: ['/query/', 0],
    status: [200]
});

/**
 * Get the query string
 * 
 * @class baqend.message.GetQueryCode
 * @extends baqend.connector.Message
 *
 * @param qid {Object} The query id
 */
exports.GetQueryCode = Message.create({
    method: 'GET',
    params: ['/query/', 0, '/source'],
    status: [200]
});

/**
 * Executes a prepared query
 * 
 * @class baqend.message.RunQuery
 * @extends baqend.connector.Message
 *
 * @param start {Object} The offset from where to start from
 * @param count {Object} The number of objects to enlist
 * @param qid {Object} The query id
 */
exports.RunQuery = Message.create({
    method: 'GET',
    params: ['/query/', 0, '/result;start=', 1, ';count=', 2],
    status: [200]
});

/**
 * Get the declared query parameters
 * 
 * @class baqend.message.GetQueryParameters
 * @extends baqend.connector.Message
 *
 * @param qid {Object} The query id
 */
exports.GetQueryParameters = Message.create({
    method: 'GET',
    params: ['/query/', 0, '/parameters'],
    status: [200]
});

/**
 * List all active transactions
 * 
 * @class baqend.message.GetActiveTransactions
 * @extends baqend.connector.Message
 *
 */
exports.GetActiveTransactions = Message.create({
    method: 'GET',
    params: ['/transaction'],
    status: [200]
});

/**
 * Starts a new Transaction
 * 
 * @class baqend.message.NewTransaction
 * @extends baqend.connector.Message
 *
 */
exports.NewTransaction = Message.create({
    method: 'POST',
    params: ['/transaction'],
    status: [201]
});

/**
 * List all subresources
 * 
 * @class baqend.message.ListTransactionalSubresurces
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 */
exports.ListTransactionalSubresurces = Message.create({
    method: 'GET',
    params: ['/transaction/', 0],
    status: [200]
});

/**
 * Aborts a active transaction
 * 
 * @class baqend.message.AbortTransaction
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 */
exports.AbortTransaction = Message.create({
    method: 'PUT',
    params: ['/transaction/', 0, '/aborted'],
    status: [204]
});

/**
 * List all transactional changed objects
 * 
 * @class baqend.message.GetTransactionChangeset
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 */
exports.GetTransactionChangeset = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/changeset'],
    status: [200]
});

/**
 * Commits the transaction
 * If the transaction can be completed a list of all changed objects with their updated versions are returned.
 * 
 * @class baqend.message.CommitTransaction
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 * @param body {object} The massage Content
 */
exports.CommitTransaction = Message.create({
    method: 'PUT',
    params: ['/transaction/', 0, '/committed'],
    status: [200]
});

/**
 * List all subresources
 * 
 * @class baqend.message.ListTransactionResources
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 */
exports.ListTransactionResources = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/dbview'],
    status: [200]
});

/**
 * List all subresources
 * 
 * @class baqend.message.ListTransactionBucketResources
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param tid {Object} The transaction id
 */
exports.ListTransactionBucketResources = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/dbview/', 1],
    status: [200]
});

/**
 * Get the transactional modified version of the object
 * 
 * @class baqend.message.GetTransactionStateObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param tid {Object} The transaction id
 */
exports.GetTransactionStateObject = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/dbview/', 1, '/', 2],
    status: [200]
});

/**
 * Executes an transactional adhoc query
 * Executes an adhoc query and returns a list of matched object identifiers
 * 
 * @class baqend.message.QueryTransactional
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param query {Object} The query
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param tid {Object} The transaction id
 */
exports.QueryTransactional = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/dbview/', 1, '?query=', 2, '&start=', 3, '&count=', 4],
    status: [200]
});

/**
 * Executes a transactional prepared query
 * 
 * @class baqend.message.RunQueryTransactional
 * @extends baqend.connector.Message
 *
 * @param start {Object} The offset which will be skipped
 * @param count {Object} The number of objects to enlist
 * @param qid {Object} The query id
 * @param tid {Object} The transaction id
 */
exports.RunQueryTransactional = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/queryview/', 1, '/result;start=', 2, ';count=', 3],
    status: [200]
});

/**
 * Update the object
 * Executes the partial updates on the object.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class baqend.message.UpdatePartially
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.UpdatePartially = Message.create({
    method: 'POST',
    params: ['/db/', 0, '/', 1],
    status: [204]
});

/**
 * Update the object field
 * Executes the partial update on a object field.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class baqend.message.UpdateField
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param field {Object} The field name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.UpdateField = Message.create({
    method: 'POST',
    params: ['/db/', 0, '/', 1, '/', 2],
    status: [204]
});

/**
 * Method to login a user
 * 
 * @class baqend.message.Login
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.Login = Message.create({
    method: 'POST',
    params: ['/db/User/login'],
    status: [200]
});

/**
 * Method to register a user
 * 
 * @class baqend.message.Register
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.Register = Message.create({
    method: 'POST',
    params: ['/db/User/register'],
    status: [200]
});

/**
 * Method to load the current user object
 * 
 * @class baqend.message.Me
 * @extends baqend.connector.Message
 *
 */
exports.Me = Message.create({
    method: 'GET',
    params: ['/db/User/me'],
    status: [200]
});

/**
 * Method to validate a user token
 * 
 * @class baqend.message.ValidateUser
 * @extends baqend.connector.Message
 *
 */
exports.ValidateUser = Message.create({
    method: 'GET',
    params: ['/db/User/validate'],
    status: [200]
});

/**
 * Method to remove token cookie
 * 
 * @class baqend.message.Logout
 * @extends baqend.connector.Message
 *
 */
exports.Logout = Message.create({
    method: 'GET',
    params: ['/db/User/logout'],
    status: [200]
});

/**
 * Gets the code of the handler for the given bucket and type
 * 
 * @class baqend.message.GetBaqendHandler
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The handler type of the script
 */
exports.GetBaqendHandler = Message.create({
    method: 'GET',
    params: ['/code/', 0, '/', 1],
    status: [200]
});

/**
 * Sets the code of the handler for the given bucket and type
 * 
 * @class baqend.message.SetBaqendHandler
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The handler type of the script
 * @param body {object} The massage Content
 */
exports.SetBaqendHandler = Message.create({
    method: 'PUT',
    params: ['/code/', 0, '/', 1],
    status: [200]
});

/**
 * Delete the code of the handler for the given bucket and type
 * 
 * @class baqend.message.DeleteBaqendHandler
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The handler type of the script
 */
exports.DeleteBaqendHandler = Message.create({
    method: 'DELETE',
    params: ['/code/', 0, '/', 1],
    status: [204]
});

/**
 * Sets the script for an specific code bucket
 * 
 * @class baqend.message.SetBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The function name
 * @param body {object} The massage Content
 */
exports.SetBaqendCode = Message.create({
    method: 'PUT',
    params: ['/code/', 0],
    status: [200]
});

/**
 * Gets the code for an specific code bucket
 * 
 * @class baqend.message.GetBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The script name
 */
exports.GetBaqendCode = Message.create({
    method: 'GET',
    params: ['/code/', 0],
    status: [200]
});

/**
 * Deletes the code for an specific bucket name
 * 
 * @class baqend.message.DeleteBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The script name
 */
exports.DeleteBaqendCode = Message.create({
    method: 'DELETE',
    params: ['/code/', 0],
    status: [204]
});

/**
 * Calls the code of the specific code bucket
 * 
 * @class baqend.message.CallBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The function name
 * @param body {object} The massage Content
 */
exports.CallBaqendCode = Message.create({
    method: 'POST',
    params: ['/code/', 0],
    status: [200, 204]
});

/**
 * List all available code resources
 * 
 * @class baqend.message.GetAllCodeResources
 * @extends baqend.connector.Message
 *
 */
exports.GetAllCodeResources = Message.create({
    method: 'GET',
    params: ['/code'],
    status: [200]
});

/**
 * Download a file
 * Download an oversized information package, like some picture maybe.
 * 
 * @class baqend.message.GetFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.GetFile = Message.create({
    method: 'GET',
    params: ['/file/', 0, '/', 1],
    status: [200, 304]
});

/**
 * Replace a file
 * Replace an File with some other file.
 * Like objects, you can specify an explicit version in the
 * If-Match Header or use * to replace any version but error if the File dose not exist.
 * 
 * @class baqend.message.ReplaceFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.ReplaceFile = Message.create({
    method: 'PUT',
    params: ['/file/', 0, '/', 1],
    status: [203]
});

/**
 * Delete a file
 * Deletes a file.
 * Like objects, you can specify an explicit version in the
 * If-Match Header or use * to replace any version but error if the File dose not exist.
 * 
 * @class baqend.message.DeleteFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.DeleteFile = Message.create({
    method: 'DELETE',
    params: ['/file/', 0, '/', 1],
    status: [203]
});

/**
 * List bucket indexes
 * List all indexes of the given bucket
 * 
 * @class baqend.message.ListIndexes
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.ListIndexes = Message.create({
    method: 'GET',
    params: ['/index/', 0],
    status: [200]
});

/**
 * Create or drop bucket index
 * Create or drop a index for the given bucket
 * 
 * @class baqend.message.CreateDropIndex
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.CreateDropIndex = Message.create({
    method: 'POST',
    params: ['/index/', 0],
    status: [202]
});

/**
 * Drop all indexes
 * Drop all indexes on the given bucket
 * 
 * @class baqend.message.DropAllIndexes
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.DropAllIndexes = Message.create({
    method: 'DELETE',
    params: ['/index/', 0],
    status: [202]
});


},{"./connector/Message":20}],33:[function(require,module,exports){
var Accessor = require('../binding/Accessor');

/**
 * @class baqend.metamodel.Attribute
 */
var Attribute = module.exports = Object.inherit(/** @lends baqend.metamodel.Attribute.prototype */ {
  /**
   * @lends baqend.metamodel.Attribute
   */
  extend: {
    /**
     * @enum {number}
     */
    PersistentAttributeType: {
      BASIC: 0,
      ELEMENT_COLLECTION: 1,
      EMBEDDED: 2,
      MANY_TO_MANY: 3,
      MANY_TO_ONE: 4,
      ONE_TO_MANY: 5,
      ONE_TO_ONE: 6
    }
  },

  /**
   * @type {Boolean}
   */
  get isAssociation() {
    return this.persistentAttributeType > Attribute.PersistentAttributeType.EMBEDDED;
  },

  /**
   * @type {Boolean}
   */
  get isCollection() {
    return this.persistentAttributeType == Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
  },

  /**
   * @type {Boolean}
   */
  isId: false,

  /**
   * @type {Boolean}
   */
  isVersion: false,

  /**
   * @type {baqend.binding.Accessor}
   */
  accessor: null,

  /**
   * @type {number}
   */
  persistentAttributeType: -1,

  /**
   * @type baqend.metamodel.ManagedType
   */
  declaringType: null,

  /**
   * @type String
   */
  name: null,

  /**
   * @param {String} name The attribute name
   */
  initialize: function (name) {
    this.name = name;
  },

  /**
   * @param {baqend.metamodel.ManagedType} declaringType The type that owns this attribute
   */
  init: function(declaringType) {
    if (this.declaringType)
      throw new Error('The attribute is already initialized.');

    this.accessor = new Accessor();
    this.declaringType = declaringType;
  },

  /**
   * @param {Object} entity
   * @returns {*}
   */
  getValue: function (entity) {
    return this.accessor.getValue(entity, this);
  },

  /**
   * @param {Object} entity
   * @param {*} value
   */
  setValue: function (entity, value) {
    this.accessor.setValue(entity, this, value);
  },

  /**
   * Converts this attribute field to json
   * @abstract
   * @returns {Object}
   */
  toJSON: function() {}
});
},{"../binding/Accessor":7}],34:[function(require,module,exports){
var Type = require('./Type');
var GeoPoint = require('../GeoPoint');

/**
 * @class baqend.metamodel.BasicType
 * @extends baqend.metamodel.Type
 */
var BasicType = module.exports = Type.inherit(/** @lends baqend.metamodel.BasicType.prototype */ {

  /**
   * The persistent type of this type
   * @type Number
   */
  persistenceType: Type.PersistenceType.BASIC,

  /**
   * Indicates if this type is not the main type of the constructor
   * @type {Boolean}
   */
  noResolving: false,

  /**
   * Creates a new instance of a native db type
   * @param {String} ref The db ref of this type
   * @param {Function} typeConstructor The javascript class of this type
   * @param {Boolean} noResolving Indicates if this type is not the main type of the constructor
   */
  initialize: function (ref, typeConstructor, noResolving) {
    if (ref.indexOf('/db/') != 0)
      ref = '/db/' + ref;

    this.superCall(ref, typeConstructor);

    this.noResolving = noResolving;
  },

  /**
   * @param {baqend.util.Metadata} state
   * @param {Object} currentValue
   * @returns {Object}
   */
  toDatabaseValue: function (state, currentValue) {
    if (currentValue === null || currentValue === undefined) {
      return null;
    }

    return this.typeConstructor.asInstance(currentValue);
  },

  /**
   * @param {baqend.util.Metadata} state
   * @param {*} jsonValue
   * @returns {*}
   */
  fromDatabaseValue: function (state, jsonValue) {
    if (jsonValue === null || jsonValue === undefined) {
      return null;
    }

    return this.typeConstructor.asInstance(jsonValue);
  },

  toString: function() {
    return "BasicType(" + this.ref + ")";
  }
});

BasicType.extend( /** @lends baqend.metamodel.BasicType */ {
  Boolean: new BasicType('Boolean', Boolean),
  Double: new BasicType('Double', Number),
  Integer: new BasicType('Integer', Number),
  String: new BasicType('String', String),
  DateTime: new (BasicType.inherit({
    initialize: function() {
      this.superCall('DateTime', Date);
    },

    toDatabaseValue: function(state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
      }
      return value;
    }
  })),

  Date: new (BasicType.inherit({
    initialize: function() {
      this.superCall('Date', Date);
    },

    toDatabaseValue: function (state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
        value = value.substring(0, value.indexOf('T'));
      }
      return value;
    }
  })),

  Time: new (BasicType.inherit({
    initialize: function() {
      this.superCall('Time', Date);
    },

    toDatabaseValue: function (state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
        value = value.substring(value.indexOf('T') + 1);
      }
      return value;
    },

    fromDatabaseValue: function (state, json) {
      return this.superCall(state, json ? '1970-01-01T' + json : json);
    }
  })),

  GeoPoint: new BasicType('GeoPoint', GeoPoint),

  JsonArray: new (BasicType.inherit({
    initialize: function() {
      this.superCall('JsonArray', Array);
    },

    init: function(classFactory) {
      this._enhancer = classFactory;
    },

    toDatabaseValue: function (state, value) {
      if (value && value.constructor == Array) {
        return value;
      }

      return null;
    }
  })),

  JsonObject: new (BasicType.inherit({
    initialize: function() {
      this.superCall('JsonObject', Object);
    },

    init: function(classFactory) {
      this._enhancer = classFactory;
    },

    toDatabaseValue: function (state, value) {
      if (value && value.constructor == Object) {
        return value;
      }

      return null;
    }
  }))
});
},{"../GeoPoint":4,"./Type":47}],35:[function(require,module,exports){
var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');

/**
 * @class baqend.metamodel.CollectionAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var CollectionAttribute = module.exports = PluralAttribute.inherit(/** @lends baqend.metamodel.CollectionAttribute.prototype */ {

  collectionType: PluralAttribute.CollectionType.COLLECTION,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function (name, elementType) {
    this.superCall(name, elementType);
    this.typeConstructor = collection.Collection;
  }
});
},{"../collection":17,"./PluralAttribute":44}],36:[function(require,module,exports){
/**
 * Creates a new index instance which is needed to create an
 * database index.
 *
 * @class baqend.metamodel.DbIndex
 *
 * @param {String|Object|Array} keys The name of the field which will be used for the index,
 * an object of an field and index type combination or
 * an array of objects to create an compound index
 * @param {Boolean=} unique Indicates if the index will be unique
 */
var DbIndex = module.exports = Object.inherit(/** @lends baqend.metamodel.DbIndex.prototype */ {

  /** @lends baqend.metamodel.DbIndex */
  extend: {
    /**
     * @type String
     */
    ASC: 'asc',
    /**
     * @type String
     */
    DESC: 'desc',
    /**
     * @type String
     */
    GEO: 'geo',

    /**
     * Returns DbIndex Object created from the given JSON
     */
    fromJSON: function(json) {
      return new DbIndex(json.keys, json.unique);
    }
  },

  /**
   * @type Boolean
   */
  drop: false,

  initialize: function(keys, unique) {

    if(String.isInstance(keys)) {
      var key = {};
      key[keys] = DbIndex.ASC;
      this.keys = [key];
    } else if(Array.isInstance(keys)) {
      this.keys = keys;
    } else if(Object.isInstance(keys)) {
      this.keys = [keys];
    } else {
      throw new Error("The keys parameter must be an String, Object or Array.");
    }

    this.unique = unique === true;
  },

  hasKey: function(name) {
    for(var i = 0; i < this.keys.length; i++) {
      if(this.keys[i][name]) {
        return true;
      }
    }
    return false;
  },

  get isCompound() {
    return this.keys.length > 1;
  },

  get isUnique() {
    return this.unique;
  },

  /**
   * Returns a JSON representation of the Index object
   *
   * @return {Object} A Json of this Index object
   */
  toJSON: function() {
    return {
      unique: this.unique,
      keys: this.keys,
      drop: this.drop
    };
  }
});

},{}],37:[function(require,module,exports){
var ManagedType = require('./ManagedType');
var Type = require('./Type');
var ManagedFactory = require('../binding/ManagedFactory');

/**
 * @class baqend.metamodel.EmbeddableType
 * @extends baqend.metamodel.ManagedType
 */
var EmbeddableType = module.exports = ManagedType.inherit(/** @lends baqend.metamodel.EmbeddableType.prototype */ {
  persistenceType: Type.PersistenceType.EMBEDDABLE,

  /**
   * {@inheritDoc}
   * @param {baqend.EntityManager} db {@inheritDoc}
   * @return {baqend.binding.ManagedFactory} A factory which creates embeddable objects
   */
  createObjectFactory: function(db) {
    return ManagedFactory.create(this, db);
  },

  /**
   * {@inheritDoc}
   * @param {baqend.util.Metadata} state {@inheritDoc}
   * @param {*} object {@inheritDoc}
   * @return {Object} {@inheritDoc}
   */
  toDatabaseValue: function (state, object) {
    if (this.typeConstructor.isInstance(object) && !object.hasOwnProperty('__metadata')) {
      object._metadata = {
        _root: state._root
      };
    }

    return this.superCall(state, object);
  },

  /**
   * @param {baqend.util.Metadata} state {@inheritDoc}
   * @param {Object} jsonObject {@inheritDoc}
   * @param {*} currentObject {@inheritDoc}
   * @return {*} {@inheritDoc}
   */
  fromDatabaseValue: function (state, jsonObject, currentObject) {
    if (!currentObject && jsonObject) {
      currentObject = this.create();
      currentObject._metadata._root = state._root;
    }

    return this.superCall(state, jsonObject, currentObject);
  },

  toString: function() {
    return "EmbeddableType(" + this.ref + ")";
  }
});
},{"../binding/ManagedFactory":12,"./ManagedType":40,"./Type":47}],38:[function(require,module,exports){
var binding = require('../binding');

var SingularAttribute = require('./SingularAttribute');
var BasicType = require('./BasicType');
var Type = require('./Type');
var ManagedType = require('./ManagedType');
var Metadata = require('../util/Metadata');
var Permission = require('../util/Permission');

/**
 * @class baqend.metamodel.EntityType
 * @extends baqend.metamodel.ManagedType
 *
 * @param {String} ref
 * @param {baqend.metamodel.EntityType} superType
 * @param {Function} typeConstructor
 */
var EntityType = module.exports = ManagedType.inherit( /** @lends baqend.metamodel.EntityType.prototype */ {
  persistenceType: Type.PersistenceType.ENTITY,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  declaredId: null,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  declaredVersion: null,

  /**
   * @type baqend.metamodel.EntityType
   */
  superType: null,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get id() {
    return this.declaredId || this.superType.id;
  },

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get version() {
    return this.declaredVersion || this.superType.version;
  },

  /**
   * @type baqend.util.Permission
   */
  updatePermission: null,

  /**
   * @type baqend.util.Permission
   */
  createPermission: null,

  /**
   * @type baqend.util.Permission
   */
  deletePermission: null,

  /**
   * @type baqend.util.Permission
   */
  queryPermission: null,

  /**
   * @type baqend.util.Permission
   */
  schemaSubclassPermission: null,

  initialize: function (ref, superType, typeConstructor) {
    this.superCall(ref, typeConstructor);

    this.superType = superType;
    this.createPermission = new Permission();
    this.updatePermission = new Permission();
    this.deletePermission = new Permission();
    this.queryPermission = new Permission();
    this.schemaSubclassPermission = new Permission();
  },

  /**
   * {@inheritDoc}
   * @param {baqend.EntityManager} db {@inheritDoc}
   * @return {baqend.binding.EntityFactory} A factory which creates entity objects
   */
  createObjectFactory: function(db) {
    switch (this.name) {
      case 'User':
        return binding.UserFactory.create(this, db);
      case 'Object':
        return undefined;
    }

    return binding.EntityFactory.create(this, db);
  },

  /**
   * @param {baqend.util.Metadata} state
   * @param {*} currentObject
   * @param {Object} jsonObject
   * @return {*}
   */
  fromDatabaseValue: function (state, jsonObject, currentObject) {
    if (state._root == currentObject) {
      return this.superCall(state, jsonObject, currentObject);
    } else if (jsonObject) {
      return state.db.getReference(jsonObject);
    } else {
      return null;
    }
  },

  /**
   * {@inheritDoc}
   *
   * @param {baqend.util.Metadata} state
   * @param {*} object {@inheritDoc}
   * @return {Object} {@inheritDoc}
   */
  toDatabaseValue: function (state, object) {
    if (state._root == object) {
      // root object
      return this.superCall(state, object);
    } else if (this.typeConstructor.isInstance(object)) {
      object.attach(state.db);
      return Metadata.get(object).ref;
    } else {
      return null;
    }
  },

  toString: function() {
    return "EntityType(" + this.ref + ")";
  },

  toJSON: function() {
    var json = this.superCall();

    json.acl.schemaSubclass = this.schemaSubclassPermission;
    json.acl.create = this.createPermission;
    json.acl.update = this.updatePermission;
    json.acl.delete = this.deletePermission;
    json.acl.query = this.queryPermission;

    return json;
  }
});

EntityType.extend(/** @lends baqend.metamodel.EntityType */ {

  /**
   * @class baqend.metamodel.EntityType.Object
   * @extends baqend.metamodel.EntityType
   */
  Object: EntityType.inherit(/** @lends baqend.metamodel.EntityType.Object.prototype */{
    /** @lends baqend.metamodel.EntityType.Object */
    extend: {
      ref: '/db/Object'
    },

    initialize: function() {
      this.superCall(EntityType.Object.ref, null, Object);

      this.declaredId = new SingularAttribute('id', BasicType.String);
      this.declaredId.init(this);
      this.declaredId.isId = true;
      this.declaredVersion = new SingularAttribute('version', BasicType.String);
      this.declaredVersion.init(this);
      this.declaredVersion.isVersion = true;
    }
  })
});
},{"../binding":16,"../util/Metadata":53,"../util/Permission":54,"./BasicType":34,"./ManagedType":40,"./SingularAttribute":46,"./Type":47}],39:[function(require,module,exports){
var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');

/**
 * @class baqend.metamodel.ListAttribute
 * @extends baqend.metamodel.PluralAttribute
 *
 * @param {String} name
 * @param {baqend.metamodel.Type} elementType
 */
var ListAttribute = module.exports = PluralAttribute.inherit(/** @lends baqend.metamodel.ListAttribute.prototype */ {

  extend: {
    ref: '/db/collection.List'
  },

  collectionType: PluralAttribute.CollectionType.LIST,

  initialize: function (name, elementType) {
    this.superCall(name, elementType);
    this.typeConstructor = collection.List;
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: ListAttribute.ref + '[' + this.elementType.ref + ']'
    };
  }
});
},{"../collection":17,"./PluralAttribute":44}],40:[function(require,module,exports){
var Type = require('./Type');
var Permission = require('../util/Permission');
var col = require('../collection');

/**
 * @class baqend.metamodel.ManagedType
 * @extends baqend.metamodel.Type
 */
var ManagedType = module.exports = Type.inherit(/** @lends baqend.metamodel.ManagedType.prototype */ {
  AttributeIterator: Object.inherit(col.Iterator, {
    index: 0,

    initialize: function(type) {
      this.types = [];

      do {
        this.types.push(type);
      } while (type = type.superType);
    },

    /**
     * @return {Object} item
     * @return {Boolean} item.done
     * @return {baqend.metamodel.Attribute} item.value
     */
    next: function() {
      var type = this.types.pop();

      while (type && type.declaredAttributes.length == this.index) {
        type = this.types.pop();
        this.index = 0;
      }

      if (type) {
        this.types.push(type);
        return {done: false, value: type.declaredAttributes[this.index++]};
      } else {
        return {done: true};
      }
    }
  }),

  /**
   * @type baqend.binding.Enhancer
   */
  _enhancer: null,

  /**
   * @type {baqend.metamodel.Attribute[]}
   */
  declaredAttributes: null,

  /**
   * @type {baqend.metamodel.EntityType}
   */
  superType: null,

  /**
   * @type baqend.util.Permission
   */
  loadPermission: null,

  /**
   * @type baqend.util.Permission
   */
  schemaAddPermission: null,

  /**
   * @type baqend.util.Permission
   */
  schemaReplacePermission: null,

  /**
   * @type Function
   * @param {String|Function} code
   */
  set validationCode(code) {
    if(!code) {
      code = null;
    } else if(String.isInstance(code)) {
      var keys = [];
      for (var iter = this.attributes(), item = iter.next(); !item.done; item = iter.next()) {
        keys.push(item.value.name);
      }
      code = new Function(keys, code);
    }
    this._validationCode = code;
  },

  /**
   * @type Function
   */
  get validationCode() {
    return this._validationCode;
  },

  /**
   * @type Function
   * @private
   */
  _validationCode: null,

  /**
   * @type {Function}
   */
  get typeConstructor() {
    if (!this._typeConstructor) {
      this.typeConstructor = this._enhancer.createProxyClass(this);
    }
    return this._typeConstructor;
  },

  /**
   * @param {Function} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if (this._typeConstructor) {
      throw new Error("typeConstructor has already been set.")
    }
    this._typeConstructor = typeConstructor;
    this._enhancer.enhance(this, this._typeConstructor);
  },

  /**
   * @param {String} ref or full class name
   * @param {Function} typeConstructor
   */
  initialize: function(ref, typeConstructor) {
    this.superCall(ref.indexOf('/db/') != 0 ? '/db/' + ref : ref, typeConstructor);

    this.declaredAttributes = [];
    this.loadPermission = new Permission();
    this.schemaAddPermission = new Permission();
    this.schemaReplacePermission = new Permission();
  },

  /**
   * Initialize this type
   * @param {baqend.binding.Enhancer} enhancer The class enhancer
   * used to enhance and instantiate instance of this managed class
   */
  init: function(enhancer) {
    this._enhancer = enhancer;

    if (this._typeConstructor && !this._enhancer.getIdentifier(this._typeConstructor))
      this._enhancer.setIdentifier(this._typeConstructor, this.ref);
  },

  /**
   * Creates an ObjectFactory for this type and the given EntityManager
   * @param {baqend.EntityManager} db The created instances will be attached to this EntityManager
   * @return {baqend.binding.ManagedFactory} the crated object factory for the given EntityManager
   * @abstract
   */
  createObjectFactory: function(db) {},

  /**
   * @returns {Object}
   */
  create: function() {
    return this._enhancer.create(this);
  },

  /**
   * @return {baqend.metamodel.ManagedType.AttributeIterator}
   */
  attributes: function() {
    return new this.AttributeIterator(this);
  },

  /**
   * Adds an attribute to this type
   * @param {baqend.metamodel.Attribute} attr The attribute to add
   */
  addAttribute: function(attr) {
    if (this.getAttribute(attr.name))
      throw new Error("An attribute with the name " + attr.name + " is already declared.");

    attr.init(this);

    this.declaredAttributes.push(attr);
    if (this._typeConstructor)
      this._enhancer.enhanceProperty(this._typeConstructor, attr);
  },

  /**
   * @param {!String} name
   * @returns {baqend.metamodel.Attribute}
   */
  getAttribute: function(name) {
    var attr = this.getDeclaredAttribute(name);

    if (!attr && this.superType) {
      attr = this.superType.getAttribute(name);
    }

    return attr;
  },

  /**
   * @param {String} name
   * @returns {baqend.metamodel.Attribute}
   */
  getDeclaredAttribute: function(name) {
    for (var i = 0, attr; attr = this.declaredAttributes[i]; ++i) {
      if (attr.name == name) {
        return attr;
      }
    }

    return null;
  },

  /**
   * Merge the json data into the current object instance and returns the merged object
   * @param {baqend.util.Metadata} state The root object state
   * @param {Object} jsonObject The json data to merge
   * @param {*=} currentObject The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @return {*} The merged object instance
   */
  fromDatabaseValue: function(state, jsonObject, currentObject) {
    if (jsonObject) {
      for (var iter = this.attributes(), item; !(item = iter.next()).done; ) {
        var attribute = item.value;
        attribute.setDatabaseValue(state, currentObject, jsonObject[attribute.name]);
      }
    } else {
      currentObject = null;
    }

    return currentObject;
  },

  /**
   * Converts the given object to json
   * @param {baqend.util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @return {Object} The converted object as json
   */
  toDatabaseValue: function(state, object) {
    var value = null;

    if (this.typeConstructor.isInstance(object)) {
      value = {};
      for (var iter = this.attributes(), item; !(item = iter.next()).done; ) {
        var attribute = item.value;
        value[attribute.name] = attribute.getDatabaseValue(state, object);
      }
    }

    return value;
  },

  /**
   * Converts ths type schema to json
   * @returns {Object}
   */
  toJSON: function() {
    var json = {};
    json['class'] = this.ref;

    if (this.superType)
      json['superClass'] = this.superType.ref;

    if (this.isEmbeddable)
      json['embedded'] = true;

    json['acl'] = {
      load: this.loadPermission,
      schemaAdd: this.schemaAddPermission,
      schemaReplace: this.schemaReplacePermission
    };

    var fields = json['fields'] = {};
    for (var i = 0, attribute; attribute = this.declaredAttributes[i]; i++) {
      fields[attribute.name] = attribute;
    }

    return json;
  },

  /**
   * Returns iterator to get all referenced entities
   * @return {baqend.metamodel.ManagedType.ReferenceIterator}
   */
  references: function() {
    return new this.ReferenceIterator(this);
  },

  ReferenceIterator: Object.inherit({

    initialize: function(type) {
      this.type = type;
      this.attributes = this.type.attributes();
      this.embedded = [];
    },

    /**
     * @return {baqend.metamodel.Attribute}
     */
    next: function() {
      for (var iter = this.attributes, item = iter.next(); !item.done; item = iter.next()) {
        var attribute = item.value;
        var type = attribute.isCollection ? attribute.elementType : attribute.type;
        if(type.isEntity) {
          return {done: false, value: {path: [attribute.name]}};
        } else if(type.isEmbeddable) {
          for (var emIter = type.references(), emItem = emIter.next(); !emItem.done; emItem = emIter.next()) {
            this.embedded.push({done: false, value: {path: [attribute.name].concat(emItem.value.path)}});
          }
        }
      }

      return this.embedded.length ? this.embedded.pop() : {done: true};
    }
  })
});
},{"../collection":17,"../util/Permission":54,"./Type":47}],41:[function(require,module,exports){
var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');
var PersistentError = require('../error/PersistentError');

/**
 * @class baqend.metamodel.MapAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var MapAttribute = module.exports = PluralAttribute.inherit(/** @lends baqend.metamodel.MapAttribute.prototype */ {

  extend: {
    ref: '/db/collection.Map'
  },

  collectionType: PluralAttribute.CollectionType.MAP,

  /**
   * @type baqend.metamodel.Type
   */
  keyType: null,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} keyType
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function (name, keyType, elementType) {
    this.superCall(name, elementType);

    this.keyType = keyType;
    this.typeConstructor = collection.Map;
  },

  /**
   * @param {baqend.util.Metadata} state
   * @param {*} obj
   * @return {Object}
   */
  getDatabaseValue: function (state, obj) {
    var value = this.getValue(obj);

    if (value) {
      if (!value._metadata) {
        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var json = {};
      for (var iter = value.items(), item = iter.next(); !item.done; item = iter.next()) {
        if (item.index === null || item.index === undefined)
          throw new PersistentError('Map keys can\'t be null nor undefined.');

        json[this.keyType.toDatabaseValue(state, item.index)] =
          this.elementType.toDatabaseValue(state, item.value);
      }

      return json;
    } else {
      return null;
    }
  },

  /**
   * @param {baqend.util.Metadata} state
   * @param {*} obj
   * @param {Object} json
   */
  setDatabaseValue: function (state, obj, json) {
    var value = null;
    if (json) {
      value = this.getValue(obj);

      if (!this.typeConstructor.isInstance(value)) {
        value = new this.typeConstructor();
        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var keys = value.seq;
      var vals = value.vals;

      value.seq = [];
      value.vals = [];
      value.size = 0;

      for (var key in json) {
        key = this.keyType.fromDatabaseValue(state, key);
        var index = keys.indexOf(key);
        var val = this.elementType.fromDatabaseValue(state, json[key], index != -1? vals[index]: null);

        value.set(key, val);
      }
    }

    this.setValue(obj, value);
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: MapAttribute.ref + '[' + this.keyType.ref + ',' + this.elementType.ref + ']'
    };
  }
});
},{"../collection":17,"../error/PersistentError":28,"./PluralAttribute":44}],42:[function(require,module,exports){
var BasicType = require('./BasicType');
var ManagedType = require('./ManagedType');
var EntityType = require('./EntityType');
var Enhancer = require('../binding/Enhancer');
var ModelBuilder = require('./ModelBuilder');
var DbIndex = require('./DbIndex');
var Lockable = require('../util/Lockable');
var StatusCode = require('../connector/Message').StatusCode;

var message = require('../message');

/**
 * @class baqend.metamodel.Metamodel
 * @extends baqend.util.Lockable
 */
var Metamodel = module.exports = Object.inherit(Lockable, /** @lends baqend.metamodel.Metamodel.prototype */ {

  /**
   * Defines if the Metamodel has been finalized
   * @type Boolean
   */
  isInitialized: false,

  /**
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @type Array.<baqend.metamodel.EntityType>
   */
  entities: null,

  /**
   * @type Array.<baqend.metamodel.EmbeddableType>
   */
  embeddables: null,

  /**
   * @type Array.<baqend.metamodel.BasicType>
   */
  baseTypes: null,

  initialize: function() {
    this._enhancer = new Enhancer();
    this.lock();
  },

  /**
   * Connects this instance with the given connector
   * @param {baqend.connector.Connector} connector
   */
  connected: function(connector) {
    this._connector = connector;
    this.unlock();
  },

  /**
   * Prepare the Metamodel for custom schema creation
   * @param {Object=} jsonMetamodel initialize the metamodel with the serialized json schema
   * @return {Promise<*>} A promise which will be resolved, if the metamodel is initialized
   */
  init: function(jsonMetamodel) {
    if (jsonMetamodel) {
      if (this.isInitialized) {
        throw new Error('Metamodel is already initialized.');
      }

      this.fromJSON(jsonMetamodel || []);
      this.isInitialized = true;
    } else if (!this.isInitialized) {
      this.load();
    }

    return this.ready();
  },

  /**
   * @param {(Function|String)} arg
   * @return {String}
   */
  _getRef: function(arg) {
    var ref;
    if (String.isInstance(arg)) {
      ref = arg;

      if (ref.indexOf('/db/') != 0) {
        ref = '/db/' + arg;
      }
    } else {
      ref = this._enhancer.getIdentifier(arg);
    }

    return ref;
  },

  /**
   * Return the metamodel entity type representing the entity.
   *
   * @param {(Function|String)} typeConstructor - the type of the represented entity
   * @returns {baqend.metamodel.EntityType} the metamodel entity type
   */
  entity: function(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.entities[ref] : null;
  },

  /**
   * Return the metamodel basic type representing the native class.
   * @param {(Function|String)} typeConstructor - the type of the represented native class
   * @returns {baqend.metamodel.BasicType} the metamodel basic type
   */
  baseType: function(typeConstructor) {
    var ref = null;
    if (String.isInstance(typeConstructor)) {
      ref = this._getRef(typeConstructor);
    } else {
      for (var name in this.baseTypes) {
        var type = this.baseTypes[name];
        if (!type.noResolving && type.typeConstructor == typeConstructor) {
          ref = name;
          break;
        }
      }
    }

    return ref ? this.baseTypes[ref] : null;
  },

  /**
   * Return the metamodel embeddable type representing the embeddable class.
   * @param {(Function|String)} typeConstructor - the type of the represented embeddable class
   * @returns {baqend.metamodel.EmbeddableType} the metamodel embeddable type
   */
  embeddable: function(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.embeddables[ref] : null;
  },

  /**
   * Return the metamodel managed type representing the entity, mapped superclass, or embeddable class.
   *
   * @param {(Function|String)} typeConstructor - the type of the represented managed class
   * @returns {baqend.metamodel.Type} the metamodel managed type
   */
  managedType: function(typeConstructor) {
    return this.baseType(typeConstructor) || this.entity(typeConstructor) || this.embeddable(typeConstructor);
  },

  /**
   * @param {baqend.metamodel.Type} type
   * @return the added type
   */
  addType: function(type) {
    var types;

    if (type.isBasic) {
      types = this.baseTypes;
    } else if (type.isEmbeddable) {
      type.init(this._enhancer);
      types = this.embeddables;
    } else if (type.isEntity) {
      type.init(this._enhancer);
      types = this.entities;

      if (type.superType == null && type.ref != EntityType.Object.ref) {
        type.superType = this.entity(EntityType.Object.ref);
      }
    }

    if (types[type.ref]) {
      throw new Error("The type " + type.ref + " is already declared.");
    }

    return types[type.ref] = type;
  },

  /**
   * Load all schema data from the server
   * @returns {Promise<baqend.metamodel.Metamodel>}
   */
  load: function() {
    if(!this.isInitialized) {
      return this.withLock(function() {
        this.isInitialized = true;
        var msg = new message.GetAllSchemas();

        return this._connector.send(msg).then(function(message) {
          this.fromJSON(message.response.entity);
          return this;
        }.bind(this));
      }.bind(this));
    } else {
      throw new Error("Metamodel is already initialized.");
    }
  },

  /**
   * Store all local schema data on the server, or the provided one
   *
   * Note: The schema must be initialized, by init or load
   *
   * @param {baqend.metamodel.ManagedType=} managedType The specific type to persist, if omitted the complete schema will be updated
   * @param {Boolean} [forceReplace=false] <code>true</code> to replace the schema, <code>false</code> for schema merging
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @returns {Promise<baqend.metamodel.Metamodel>}
   */
  save: function(managedType, forceReplace, token) {
    if (!ManagedType.isInstance(managedType)) {
      token = forceReplace;
      forceReplace = managedType;
      managedType = null;
    }

    if (!this.isInitialized)
      throw new Error("Metamodel is not initialized.");

    return this.withLock(function() {
      var msg;
      if (managedType) {
        if (forceReplace) {
          msg = new message.ReplaceSchema(managedType.name, managedType.toJSON());
        } else {
          msg = new message.UpdateSchema(managedType.name, managedType.toJSON());
        }
      } else {
        if (forceReplace) {
          msg = new message.ReplaceAllSchemas(this.toJSON());
        } else {
          msg = new message.UpdateAllSchemas(this.toJSON());
        }
      }

      msg.withAuthorizationToken(token);

      return this._connector.send(msg).then(function() {
        return this;
      }.bind(this));
    }.bind(this));
  },

  /**
   * Get the current schema types as json
   * @returns {object} the json data
   */
  toJSON: function() {
    var json = [];

    for (var ref in this.entities) {
      json.push(this.entities[ref]);
    }

    for (ref in this.embeddables) {
      json.push(this.embeddables[ref]);
    }

    return json;
  },

  /**
   * Replace the current schema by the provided one in json
   * @param json The json schema data
   */
  fromJSON: function(json) {
    var builder = new ModelBuilder();
    var models = builder.buildModels(json);

    this.baseTypes = {};
    this.embeddables = {};
    this.entities = {};

    for (var ref in models) {
      var type = models[ref];
      this.addType(type);
    }
  },

  /**
   * Creates an index
   *
   * @param {String} bucket Name of the Bucket
   * @param {baqend.metamodel.DbIndex} index Will be applied for the given bucket
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @return {Promise}
   */
  createIndex: function(bucket, index, token) {
    index.drop = false;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    msg.withAuthorizationToken(token);
    return this._connector.send(msg);
  },

  /**
   * Drops an index
   *
   * @param {String} bucket Name of the Bucket
   * @param {baqend.metamodel.DbIndex} index Will be dropped for the given bucket
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @return {Promise}
   */
  dropIndex: function(bucket, index, token) {
    index.drop = true;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    msg.withAuthorizationToken(token);
    return this._connector.send(msg);
  },

  /**
   * Drops all indexes
   *
   * @param bucket Indexes will be dropped for the given bucket
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @returns {Promise}
   */
  dropAllIndexes: function(bucket, token) {
    var msg = new message.DropAllIndexes(bucket);
    msg.withAuthorizationToken(token);
    return this._connector.send(msg);
  },

  /**
   * Loads all indexes for the given bucket
   *
   * @param bucket Current indexes will be loaded for the given bucket
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @returns {Promise<Array<baqend.metamodel.DbIndex>>}
   */
  getIndexes: function(bucket, token) {
    var msg = new message.ListIndexes(bucket);
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function(data) {
      return data.response.entity.map(function(el) {
        return new DbIndex(el.keys, el.unique);
      });
    }, function(e) {
      if (e.statusCode == StatusCode.BUCKET_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    });
  }
});
},{"../binding/Enhancer":8,"../connector/Message":20,"../message":32,"../util/Lockable":52,"./BasicType":34,"./DbIndex":36,"./EntityType":38,"./ManagedType":40,"./ModelBuilder":43}],43:[function(require,module,exports){
var BasicType = require('./BasicType');
var EntityType = require('./EntityType');
var EmbeddableType = require('./EmbeddableType');

var ListAttribute = require('./ListAttribute');
var MapAttribute = require('./MapAttribute');
var SetAttribute = require('./SetAttribute');
var SingularAttribute = require('./SingularAttribute');

var PersistentError = require('../error/PersistentError');

/**
 * @class baqend.metamodel.ModelBuilder
 */
var ModelBuilder = module.exports = Object.inherit( /** @lends baqend.metamodel.ModelBuilder.prototype */ {

  /**
   * @type Object<string,baqend.metamodel.ManagedType>
   */
  models: null,

  /**
   * @type Object<string,Object>
   */
  modelDescriptors: null,

  /**
   * @param {baqend.metamodel.Metamodel} metamodel
   */
  initialize: function() {
    this.models = {};

    for (var typeName in BasicType) {
      if (BasicType.hasOwnProperty(typeName)) {
        var basicType = BasicType[typeName];
        if (basicType instanceof BasicType) {
          this.models[basicType.ref] = basicType;
        }
      }
    }
  },

  /**
   * @param {String} ref
   * @returns {baqend.metamodel.ManagedType}
   */
  getModel: function (ref) {
    if (ref in this.models) {
      return this.models[ref];
    } else {
      return this.models[ref] = this.buildModel(ref);
    }
  },

  /**
   * @param {Object} modelDescriptors
   * @returns {Object<string,baqend.metamodel.ManagedType>}
   */
  buildModels: function (modelDescriptors) {
    this.modelDescriptors = {};
    for (var i = 0, modelDescriptor; modelDescriptor = modelDescriptors[i]; ++i) {
      this.modelDescriptors[modelDescriptor['class']] = modelDescriptor;
    }

    for (var ref in this.modelDescriptors) {
      try {
        var model = this.getModel(ref);
        this.buildAttributes(model);
      } catch (e) {
        throw new PersistentError('Can\'t create model for entity class ' + ref, e);
      }
    }

    //ensure at least an object entity
    this.getModel(EntityType.Object.ref);

    return this.models;
  },

  /**
   * @param {String} ref
   * @returns {baqend.metamodel.ManagedType}
   */
  buildModel: function (ref) {
    if (ref == EntityType.Object.ref) {
      return new EntityType.Object();
    } else if (ref in this.modelDescriptors) {
      var modelDescriptor = this.modelDescriptors[ref];

      if (modelDescriptor) {
        var type;
        if (modelDescriptor.embedded) {
          type = new EmbeddableType(ref)
        } else {
          var superTypeIdentifier = modelDescriptor['superClass'] || EntityType.Object.ref;
          type = new EntityType(ref, this.getModel(superTypeIdentifier));
        }

        var permissions = modelDescriptor['acl'];
        for (var permission in permissions) {
          type[permission + 'Permission'].fromJSON(permissions[permission]);
        }

        return type;
      }
    } else {
      throw new TypeError('No model available for ' + ref);
    }
  },

  /**
   * @param {baqend.metamodel.EntityType} model
   */
  buildAttributes: function (model) {
    var modelDescriptor = this.modelDescriptors[model.ref];
    var fields = modelDescriptor['fields'];

    var keys = [];
    for (var name in fields) {
      keys.push(name);
      var field = fields[name];
      model.addAttribute(this.buildAttribute(field.name, field.type));
    }

    if(modelDescriptor.validationCode) {
      model.validationCode = new Function(keys, modelDescriptor.validationCode);
    }
  },

  /**
   * @param {baqend.metamodel.EntityType} model
   * @param {String} name
   * @param {String} ref
   * @returns {baqend.metamodel.Attribute}
   */
  buildAttribute: function(name, ref) {
    if (ref.indexOf('/db/collection.') == 0) {
      var collectionType = ref.substring(0, ref.indexOf('['));

      var elementType = ref.substring(ref.indexOf('[') + 1, ref.indexOf(']')).trim();
      switch (collectionType) {
        case ListAttribute.ref:
          return new ListAttribute(name, this.getModel(elementType));
        case SetAttribute.ref:
          return new SetAttribute(name, this.getModel(elementType));
        case MapAttribute.ref:
          var keyType = elementType.substring(0, elementType.indexOf(',')).trim();
          elementType = elementType.substring(elementType.indexOf(',') + 1).trim();

          return new MapAttribute(name, this.getModel(keyType), this.getModel(elementType));
        default:
          throw new TypeError('No collection available for ' + ref);
      }
    } else {
      return new SingularAttribute(name, this.getModel(ref));
    }
  }
});
},{"../error/PersistentError":28,"./BasicType":34,"./EmbeddableType":37,"./EntityType":38,"./ListAttribute":39,"./MapAttribute":41,"./SetAttribute":45,"./SingularAttribute":46}],44:[function(require,module,exports){
var Attribute = require('./Attribute');

/**
 * @class baqend.metamodel.PluralAttribute
 * @extends baqend.metamodel.Attribute
 */
var PluralAttribute = module.exports = Attribute.inherit(/** @lends baqend.metamodel.PluralAttribute.prototype */{
  /**
   * @lends baqend.metamodel.PluralAttribute
   */
  extend: {
    /**
     * @enum {number}
     */
    CollectionType: {
      COLLECTION: 0,
      LIST: 1,
      MAP: 2,
      SET: 3
    }
  },

  /**
   * @type Function
   */
  typeConstructor: null,

  persistentAttributeType: Attribute.PersistentAttributeType.ELEMENT_COLLECTION,

  /**
   * @type baqend.metamodel.Type
   */
  elementType: null,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function (name, elementType) {
    this.superCall(name);
    this.elementType = elementType;
  },

  /**
   * @param {baqend.util.Metadata} state The object root state
   * @param {*} obj
   * @return {Object}
   */
  getDatabaseValue: function (state, obj) {
    var value = this.getValue(obj);

    if (this.typeConstructor.isInstance(value)) {
      // convert normal collections to tracked collections
      if (!value._metadata) {
        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var json = [];
      for (var iter = value.iterator(), item = iter.next(); !item.done; item = iter.next()) {
        json.push(this.elementType.toDatabaseValue(state, item.value));
      }

      return json;
    } else {
      return null;
    }
  },

  /**
   * @param {baqend.util.Metadata} state
   * @param {*} obj
   * @param {Object} json
   */
  setDatabaseValue: function (state, obj, json) {
    var value = null;

    if (json) {
      value = this.getValue(obj);

      if (!this.typeConstructor.isInstance(value)) {
        value = new this.typeConstructor();

        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var items = value.seq;
      value.seq = [];
      value.size = 0;

      for (var i = 0, len = json.length; i < len; ++i) {
        value.add(this.elementType.fromDatabaseValue(state, json[i], items[i]));
      }
    }

    this.setValue(obj, value);
  }
});
},{"./Attribute":33}],45:[function(require,module,exports){
var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');
var SetAttribute;

/**
 * @class baqend.metamodel.SetAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var SetAttribute = module.exports = PluralAttribute.inherit(/** @lends baqend.metamodel.SetAttribute.prototype */ {

  extend: {
    ref: '/db/collection.Set'
  },

  collectionType: PluralAttribute.CollectionType.SET,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function(name, elementType) {
    this.superCall(name, elementType);

    this.typeConstructor = collection.Set;
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: SetAttribute.ref + '[' + this.elementType.ref + ']'
    };
  }
});
},{"../collection":17,"./PluralAttribute":44}],46:[function(require,module,exports){
var Attribute = require('./Attribute');
var Type = require('./Type');

/**
 * @class baqend.metamodel.SingularAttribute
 * @extends baqend.metamodel.Attribute
 */
var SingularAttribute = module.exports = Attribute.inherit(/** @lends baqend.metamodel.SingularAttribute.prototype */ {

  get typeConstructor() {
    return this.type.typeConstructor;
  },

  /**
   * @type baqend.metamodel.Type
   */
  type: null,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} type
   */
  initialize: function (name, type) {
    this.superCall(name);

    this.type = type;

    switch (type.persistenceType) {
      case Type.PersistenceType.BASIC:
        this.persistentAttributeType = Attribute.PersistentAttributeType.BASIC;
        break;
      case Type.PersistenceType.EMBEDDABLE:
        this.persistentAttributeType = Attribute.PersistentAttributeType.EMBEDDED;
        break;
      case Type.PersistenceType.ENTITY:
        this.persistentAttributeType = Attribute.PersistentAttributeType.ONE_TO_MANY;
        break;
    }
  },

  /**
   * Gets this attribute value form the object as json
   * @param {baqend.util.Metadata} state The root object state
   * @param {*} object The object which contains the value of this attribute
   * @return {*} The converted json value
   */
  getDatabaseValue: function (state, object) {
    return this.type.toDatabaseValue(state, this.getValue(object));
  },

  /**
   * Sets this attribute value from json to the object
   * @param {baqend.util.Metadata} state The root state
   * @param {*} object The object which contains the attribute
   * @param {*} jsonValue The json value to convert an set
   */
  setDatabaseValue: function (state, object, jsonValue) {
    this.setValue(object, this.type.fromDatabaseValue(state, jsonValue, this.getValue(object)));
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: this.type.ref
    }
  }
});
},{"./Attribute":33,"./Type":47}],47:[function(require,module,exports){
/**
 * @class baqend.metamodel.Type
 */
var Type = module.exports = Object.inherit(/** @lends baqend.metamodel.Type.prototype */ {
  /**
   * @lends baqend.metamodel.Type
   */
  extend: {
    /**
     * @enum {number}
     */
    PersistenceType: {
      BASIC: 0,
      EMBEDDABLE: 1,
      ENTITY: 2,
      MAPPED_SUPERCLASS: 3
    }
  },

  /**
   * @type Boolean
   */
  get isBasic() {
    return this.persistenceType == Type.PersistenceType.BASIC;
  },

  /**
   * @type Boolean
   */
  get isEmbeddable() {
    return this.persistenceType == Type.PersistenceType.EMBEDDABLE;
  },

  /**
   * @type Boolean
   */
  get isEntity() {
    return this.persistenceType == Type.PersistenceType.ENTITY;
  },

  /**
   * @type Boolean
   */
  get isMappedSuperclass() {
    return this.persistenceType == Type.PersistenceType.MAPPED_SUPERCLASS;
  },

  /**
   * @type Number
   */
  persistenceType: -1,

  /**
   * @type Function
   */
  get typeConstructor() {
    return this._typeConstructor;
  },

  /**
   * @param {Function} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if(this._typeConstructor) {
      throw new Error("typeConstructor has already been set.")
    }
    this._typeConstructor = typeConstructor;
  },

  /**
   * @type String
   */
  ref: null,

  /**
   * @type String
   */
  name: null,

  /**
   * @param {String} ref
   * @param {Function} typeConstructor
   */
  initialize: function (ref, typeConstructor) {
    if (ref.indexOf("/db/") != 0) {
      throw new SyntaxError("Type ref " + ref + " is invalid.");
    }

    this.ref = ref;
    this.name = ref.substring(4);
    this._typeConstructor = typeConstructor;
  },

  /**
   * Converts the given json value to an instance of this type
   * @param {baqend.util.Metadata} state The root object state
   * @param {*} jsonValue The json value
   * @param {*=} currentValue The actual object value
   * @returns {*} The converted value
   * @abstract
   */
  fromDatabaseValue: function(state, jsonValue, currentValue) {},

  /**
   * Converts the given object to json
   * @param {baqend.util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @return {Object} The converted object as json
   * @abstract
   */
  toDatabaseValue: function(state, object) {}
});
},{}],48:[function(require,module,exports){
var Metamodel = require('./Metamodel');

exports = module.exports = new Metamodel();

exports.Attribute = require('./Attribute');
exports.BasicType = require('./BasicType');
exports.CollectionAttribute = require('./CollectionAttribute');
exports.EmbeddableType = require('./EmbeddableType');
exports.EntityType = require('./EntityType');
exports.ListAttribute = require('./ListAttribute');
exports.ManagedType = require('./ManagedType');
exports.MapAttribute = require('./MapAttribute');
exports.Metamodel = require('./Metamodel');
exports.ModelBuilder = require('./ModelBuilder');
exports.PluralAttribute = require('./PluralAttribute');
exports.SetAttribute = require('./SetAttribute');
exports.SingularAttribute = require('./SingularAttribute');
exports.Type = require('./Type');
exports.DbIndex = require('./DbIndex');

},{"./Attribute":33,"./BasicType":34,"./CollectionAttribute":35,"./DbIndex":36,"./EmbeddableType":37,"./EntityType":38,"./ListAttribute":39,"./ManagedType":40,"./MapAttribute":41,"./Metamodel":42,"./ModelBuilder":43,"./PluralAttribute":44,"./SetAttribute":45,"./SingularAttribute":46,"./Type":47}],49:[function(require,module,exports){
/******
 * START - BIND POLYFILL
 *****/
Function.prototype.bind = Function.prototype.bind || function (oThis) {
  if (typeof this !== "function") {
    // closest thing possible to the ECMAScript 5
    // internal IsCallable function
    throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
  }

  var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function () {},
      fBound = function () {
        return fToBind.apply(this instanceof fNOP && oThis
                ? this
                : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments)));
      };

  fNOP.prototype = this.prototype;
  fBound.prototype = new fNOP();

  return fBound;
};
/******
 * END - BIND POLYFILL
 *****/
},{}],50:[function(require,module,exports){
var Permission = require('./Permission');

/**
 * @class baqend.Acl
 */
var Acl = module.exports = Object.inherit(/** @lends baqend.Acl.prototype */ {

  /**
   * The read permission of the object
   * @type baqend.util.Permission
   */
  read: null,

  /**
   * The write permission of the object
   * @type baqend.util.Permission
   */
  write: null,

  /**
   * Creates a new Acl object, with an empty rule set for an object
   * @param {baqend.util.Metadata} metadata the metadata of the object
   */
  initialize: function(metadata) {
    this.read = new Permission(metadata);
    this.write = new Permission(metadata);
  },

  /**
   * Removes all acl rules, read and write access is public afterwards
   */
  clear: function() {
    this.read.clear();
    this.write.clear();
  },

  /**
   * Gets whenever all users and roles have the permission to read the object
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicReadAllowed: function() {
    return this.read.isPublicAllowed();
  },

  /**
   * Sets whenever all users and roles should have the permission to read the object.
   * Note: All other allow read rules will be removed.
   */
  setPublicReadAllowed: function() {
    return this.read.setPublicAllowed();
  },

  /**
   * Checks whenever the user or role is explicit allowed to read the object.
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isReadAllowed: function(userOrRole) {
    return this.read.isAllowed(userOrRole);
  },

  /**
   * Checks whenever the user or role is explicit denied to read the object
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isReadDenied: function(userOrRole) {
    return this.read.isDenied(userOrRole);
  },

  /**
   * Allows the given user or rule to read the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to allow
   * @return {baqend.Acl} this acl object
   */
  allowReadAccess: function(userOrRole) {
    this.read.allowAccess(userOrRole);
    return this;
  },

  /**
   * Denies the given user or rule to read the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to deny
   * @return {baqend.Acl} this acl object
   */
  denyReadAccess: function(userOrRole) {
    this.read.denyAccess(userOrRole);
    return this;
  },

  /**
   * Deletes any read allow/deny rule for the given user or role
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role
   * @return {baqend.Acl} this acl object
   */
  deleteReadAccess: function(userOrRole) {
    this.read.deleteAccess(userOrRole);
    return this;
  },

  /**
   * Gets whenever all users and roles have the permission to write the object
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicWriteAllowed: function() {
    return this.write.isPublicAllowed();
  },

  /**
   * Sets whenever all users and roles should have the permission to write the object.
   * Note: All other allow write rules will be removed.
   */
  setPublicWriteAllowed: function() {
    return this.write.setPublicAllowed();
  },

  /**
   * Checks whenever the user or role is explicit allowed to write the object.
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isWriteAllowed: function(userOrRole) {
    return this.write.isAllowed(userOrRole);
  },

  /**
   * Checks whenever the user or role is explicit denied to write the object
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isWriteDenied: function(userOrRole) {
    return this.write.isDenied(userOrRole);
  },

  /**
   * Allows the given user or rule to write the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to allow
   * @return {baqend.Acl} this acl object
   */
  allowWriteAccess: function(userOrRole) {
    this.write.allowAccess(userOrRole);
    return this;
  },

  /**
   * Denies the given user or rule to write the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to deny
   * @return {baqend.Acl} this acl object
   */
  denyWriteAccess: function(userOrRole) {
    this.write.denyAccess(userOrRole);
    return this;
  },

  /**
   * Deletes any write allow/deny rule for the given user or role
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role
   * @return {baqend.Acl} this acl object
   */
  deleteWriteAccess: function(userOrRole) {
    this.write.deleteAccess(userOrRole);
    return this;
  },

  /**
   * A Json representation of the set of rules
   * @return {object}
   */
  toJSON: function() {
    return {
      read: this.read,
      write: this.write
    };
  },

  /**
   * Sets the acl rules form json
   * @param {object} json The json encoded acls
   */
  fromJSON: function(json) {
    this.read.fromJSON(json.read);
    this.write.fromJSON(json.write);
  }

});
},{"./Permission":54}],51:[function(require,module,exports){
var message = require('../message');
var StatusCode = require('../connector/Message').StatusCode;

var Code = module.exports = Object.inherit(/** @lends baqend.util.Code.prototype */ {

  /**
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @type Object
   * @private
   */
  _handler: null,

  /**
   * @type Object
   * @private
   */
  _code: null,

  /**
   * @type Boolean
   * @private
   */
  _isLoaded: false,

  initialize: function() {
    this._handler = {};
    this._code = {};
  },

  /**
   * Connects this instance with the given connector
   * @param {baqend.connector.Connector} connector The connector
   */
  connected: function(connector) {
    this._connector = connector;
  },

  /**
   * Converts the given funtion to a atring
   * @param {Function} fn The JavaScript function to serialize
   * @return {String} The serialized function
   */
  functionToString: function(fn) {
    if(!fn)
      return "";

    var str = fn.toString();
    str = str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
    if (str.charAt(0) == '\n')
      str = str.substring(1);

    if (str.charAt(str.length - 1) == '\n')
      str = str.substring(0, str.length - 1);

    return str;
  },

  /**
   * Converts the given atring to a function
   * @param {String} code The JavaScript function to deserialize
   * @return {Function} The deserialized function
   */
  stringToFunction: function(code) {
    return new Function('db', code);
  },

  /**
   * Sets the handler function for the given bucket and type
   *
   * @param {String} bucket
   * @param {String} codeType (insert, update, delete)
   * @param {(Function|String)} fn will be converted to a String
   */
  setHandler: function(bucket, codeType, fn) {
    this._handler[bucket] = this._handler[bucket] || {};
    this._handler[bucket][codeType] = Function.isInstance(fn)? fn: this.stringToFunction(fn);
  },

  /**
   * Returns the handler function for the given bucket and type
   *
   * @param {String} bucket
   * @param {String} codeType (insert, update, delete)
   * @returns {Function}
   */
  getHandler: function(bucket, codeType) {
    var bucketCode = this._handler[bucket] || {};
    var code = bucketCode[codeType];
    if(code) {
      return code;
    } else {
      return null;
    }
  },

  /**
   * Removes the function of the given bucket and handler type
   *
   * @param {String} bucket
   * @param {String} codeType
   */
  removeHandler: function(bucket, codeType) {
    var bucketCode = this._handler[bucket] || {};
    delete bucketCode[codeType];
    if (Object.keys(bucketCode).length == 0) {
      delete this._handler[bucket];
    }
  },

  /**
   * Sets the Baqend code function for the given bucket name
   *
   * @param {String} bucket Name of the Baqend code
   * @param {(Function|String)} fn Function of the Baqend code which will be converted to a String
   */
  setCode: function(bucket, fn) {
    this._code[bucket] = Function.isInstance(fn)? fn: this.stringToFunction(fn);
  },

  /**
   * Returns the Baqend code function for the given bucket name
   *
   * @param {String} bucket Name of the Baqend code
   * @returns {Function}
   */
  getCode: function(bucket) {
    var code = this._code[bucket];
    if(code) {
      return code;
    } else {
      return null;
    }
  },

  /**
   * Removes the Baqend code function for the given bucket name
   *
   * @param {String} bucket Name of the Baqend code
   */
  removeCode: function(bucket) {
    delete this._code[bucket];
  },

  /**
   * Loads the insert code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadInsert: function(type, token) {
    return this._loadHandler(type.name, 'insert', token);
  },

  /**
   * Saves the insert code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveInsert: function(type, code, token) {
    return this._saveHandler(type.name, 'insert', code, token);
  },

  /**
   * Deletes the insert code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteInsert: function(type, token) {
    return this._deleteHandler(type.name, 'insert', token);
  },

  /**
   * Loads the update code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadUpdate: function(type, token) {
    return this._loadHandler(type.name, 'update', token);
  },

  /**
   * Saves the update code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveUpdate: function(type, code, token) {
    return this._saveHandler(type.name, 'update', code, token);
  },

  /**
   * Deletes the update code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteUpdate: function(type, token) {
    return this._deleteHandler(type.name, 'update', token);
  },

  /**
   * Loads the delete code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadDelete: function(type, token) {
    return this._loadHandler(type.name, 'delete', token);
  },

  /**
   * Saves the delete code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveDelete: function(type, code, token) {
    return this._saveHandler(type.name, 'delete', code, token);
  },

  /**
   * Deletes the delete code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteDelete: function(type, token) {
    return this._deleteHandler(type.name, 'delete', token);
  },

  /**
   * Loads the validation code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadValidate: function(type, token) {
    return this._loadHandler(type.name, 'validate', token).then(function() {
      type.validationCode = this.getHandler(type.name, 'validate');
      return type.validationCode;
    }.bind(this));
  },

  /**
   * Saves the validate code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveValidate: function(type, code, token) {
    return this._saveHandler(type.name, 'validate', code, token).then(function() {
      type.validationCode = this._handler[type.name]['validate'];
      return type.validationCode;
    }.bind(this));
  },

  /**
   * Deletes the validate code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteValidate: function(type, token) {
    return this._deleteHandler(type.name, 'validate', token).then(function() {
      type.validationCode = null;
    });
  },

  /**
   * Saves Baqend code which will be identified by the given bucket
   *
   * @param {String} bucket Name of the Baqend code
   * @param {Function} fn Baqend code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveCode: function(bucket, fn, token) {
    var msg = new message.SetBaqendCode(bucket, this.functionToString(fn));
    msg.withAuthorizationToken(token);

    return this._connector.send(msg).then(function(code) {
      return this.stringToFunction(code.response.entity);
    }.bind(this));
  },

  /**
   * Loads Baqend code for the given bucket name
   *
   * @param {String} bucket to identify the Baqend code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadCode: function(bucket, token) {
    var msg = new message.GetBaqendCode(bucket);
    msg.withAuthorizationToken(token);

    return this._connector.send(msg).then(function(code) {
      return this.stringToFunction(code.response.entity);
    }.bind(this), function(e) {
      if (e.statusCode == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    });
  },

  /**
   * Deletes Baqend code for the given bucket name
   *
   * @param {String} bucket to identify the Baqend code
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteCode: function(bucket, token) {
    var msg = new message.DeleteBaqendCode(bucket);
    msg.withAuthorizationToken(token);

    return this._connector.send(msg).then(function() {
      this.setCode(bucket, "");
    }.bind(this));
  },

  /**
   * Calls the baqend code, which is identified by the given bucket.
   * The obj parameter will be used as the "this" object.
   *
   * @param {String} bucket Name of the baqend code
   * @param {Object=} obj Input of the baqend code function
   * @param {String} token to authenticate the user
   * @param {baqend.EntityManager} entityManager is needed when the code will be called locally
   * @returns {Promise<Object>}
   */
  callCode: function(bucket, obj, token, entityManager) {
    var fn = this.getCode(bucket);
    if(fn) {
      return new Promise(function(resolve) {
        resolve(fn.call(obj, entityManager));
      });
    } else {
      var msg = new message.CallBaqendCode(bucket, obj);
      msg.withAuthorizationToken(token);
      return this._connector.send(msg).then(function(code) {
        return code.response.entity;
      });
    }
  },

  /**
   * Loads a list of all available baqend codes
   * Does not include handlers
   *
   * @param {String} token to authenticate the user
   * @returns {Promise<Array<String>>}
   */
  loadResources: function(token) {
    var msg = new message.GetAllCodeResources();
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function(data) {
      return data.response.entity;
    });
  },

  _saveHandler: function(bucket, codeType, fn, token) {
    return this._saveLoadHandler(bucket, codeType, fn, token);
  },

  _loadHandler: function(bucket, codeType, token) {
    return this._saveLoadHandler(bucket, codeType, null, token);
  },

  _saveLoadHandler: function(bucket, codeType, fn, token) {
    var msg = fn === null? new message.GetBaqendHandler(bucket, codeType): new message.SetBaqendHandler(bucket, codeType, this.functionToString(fn));
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function(code) {
      this.setHandler(bucket, codeType, code.response.entity);
      return this.getHandler(bucket, codeType);
    }.bind(this), function(e) {
      if (e.statusCode == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    });
  },

  _deleteHandler: function(bucket, codeType, token) {
    var msg = new message.DeleteBaqendHandler(bucket, codeType);
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function() {
      this.removeHandler(bucket, codeType);
    }.bind(this));
  }
});

},{"../connector/Message":20,"../message":32}],52:[function(require,module,exports){
/**
 * This mixin provides an lock interface to execute exclusive operations
 *
 * @mixin baqend.util.Lockable
 */
var Lockable = module.exports = Trait.inherit(/** @lends baqend.util.Lockable.prototype */{

  /**
   * Indicates if there is currently an onging exclusive operation
   * @type Boolean
   * @private
   */
  _isLocked: false,

  /**
   * A promise which represents the state of the least exclusive operation
   * @type Promise
   * @private
   */
  _readyPromise: Promise.resolve(null),

  /**
   * A deferred used to explicit lock and unlock this instance
   */
  _deferred: null,

  /**
   * Indicates if there is currently no exclusive operation executed
   * @return {Boolean} <code>true</code> If no exclusive lock is hold
   */
  get isReady() {
    return !this._isLocked;
  },

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {baqend.util.Lockable~callback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Promise<baqend.binding.Entity>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready: function(doneCallback) {
    var self = this;
    return this._readyPromise.then(function() {
      return self;
    }, function() {
      return self;
    }).then(doneCallback);
  },

  /**
   * Try to aquire an exclusive lock and executes the given callback.
   * @param {baqend.util.Lockable~callback} callback The exclusive operation to execute
   * @return {Promise<baqend.binding.Entity>} A promise
   * @throws {Error} If the lock can't be aquired
   */
  withLock: function(callback) {
    if(this._isLocked)
      throw new Error('Current operation has not been finished.');

    this._isLocked = true;
    return this._readyPromise = callback().then(function(result) {
      this._isLocked = false;
      return result;
    }.bind(this), function(e) {
      this._isLocked = false;
      throw e;
    }.bind(this));
  },

  /**
   * Try to acquire an exclusive lock, the lock must be released with the {@link baqend.util.Lockable#unlock()} method
   * @return {Promise.<*>} A promise which will be resolved, when the lock is released
   * @throws {Error} if there is a lock acquired
   */
  lock: function() {
    if(this._isLocked)
      throw new Error('There is a lock acquired currently.');

    this._isLocked = true;
    var deferred = this._deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    return this._readyPromise = deferred.promise;
  },

  /**
   * Unlock a previously acquired lock
   * @throws {Error} if there is no lock acquired
   */
  unlock: function() {
    if (!this._deferred)
      throw new Error('There is no lock acquired.');

    this._isLocked = false;
    this._deferred.resolve(this);
    this._deferred = null;
  }
});

/**
 * The operation callback is used by the {@link baqend.util.Lockable#withLock} method,
 * to perform an exclusive operation on the entity.
 * @callback baqend.util.Lockable~callback
 * @return {Promise<*>} A Promise, which reflects the result of the operation
 */
},{}],53:[function(require,module,exports){
var PersistentError = require('../error/PersistentError');
var Acl = require('./Acl');

/**
 * @class baqend.util.Metadata
 */
var Metadata = module.exports = Object.inherit(/** @lends baqend.util.Metadata.prototype */ {
  /** @lends baqend.util.Metadata */
  extend: {
    /**
     * @enum {number}
     */
    Type: {
      UNAVAILABLE: -1,
      PERSISTENT: 0,
      DIRTY: 1
    },

    /**
     * @param {baqend.binding.Entity} entity
     * @return {baqend.util.Metadata}
     */
    get: function(entity) {
      return entity && entity._metadata || null;
    },

    /**
     * @param {baqend.binding.Entity|baqend.Collection} object
     * @return {baqend.util.Metadata}
     */
    getRoot: function(object) {
      var metadata = object && object._metadata;

      if (metadata && metadata._root != object)
        metadata = metadata._root && metadata._root._metadata;

      return metadata;
    },

    /**
     * @param {baqend.binding.Entity|baqend.Collection} object
     */
    readAccess: function(object) {
      var metadata = Metadata.getRoot(object);
      if (metadata)
        metadata.readAccess();
    },

    /**
     * @param {baqend.binding.Entity|baqend.Collection} object
     */
    writeAccess: function(object) {
      var metadata = Metadata.getRoot(object);
      if (metadata)
        metadata.writeAccess();
    }
  },

  /**
   * @return {baqend.EntityManager}
   */
  get db() {
    if(this._db)
      return this._db;

    return this._db = require('../');
  },

  set db(db) {
    if(!this._db) {
      this._db = db;
    } else {
      throw new Error("DB has already been set.")
    }
  },

  /**
   * @return {baqend.metamodel.EntityType}
   */
  get type() {
    if(this._type)
      return this._type;

    if (!this.isAttached)
      return null;

    var type = this.db.metamodel.entity(this._root.constructor);
    if (type) {
      this._type = type;
    }

    return type;
  },

  /**
   * @return {String}
   */
  get bucket() {
    return this.type && this.type.name
  },

  /**
   * @return {String}
   */
  get ref() {
    if (this.isAttached && this.id) {
      return '/db/' + this.bucket + '/' + encodeURIComponent(this.id);
    } else {
      return null;
    }
  },

  /**
   * @return {Boolean}
   */
  get isAttached() {
    return !!this._db;
  },

  /**
   * @return {Boolean}
   */
  get isAvailable() {
    return this._state > Metadata.Type.UNAVAILABLE;
  },

  /**
   * @return {Boolean}
   */
  get isPersistent() {
    return this._state == Metadata.Type.PERSISTENT;
  },

  /**
   * @return {Boolean}
   */
  get isDirty() {
    return this._state == Metadata.Type.DIRTY;
  },

  /**
   * @return {baqend.Acl}
   */
  get acl() {
    var acl = new Acl(this);

    Object.defineProperty(this, 'acl', {
      value: acl
    });

    return acl;
  },

  /**
   * @type baqend.binding.Entity
   * @private
   */
  _root: null,

  _db: null,
  _type: null,

  /**
   * @type String
   */
  id: null,

  /**
   * @type String
   */
  version: null,

  /**
   * @param {baqend.binding.Entity} entity
   */
  initialize: function(entity) {
    this._root = entity;
    this._state = Metadata.Type.DIRTY;
    this._enabled = true;
  },

  readAccess: function() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new PersistentError('This object ' + this.bucket + '/' + this.id + ' is not available.');
      }
    }
  },

  writeAccess: function() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new PersistentError('This object ' + this.bucket + '/' + this.id + ' is not available.');
      }

      this.setDirty();
    }
  },

  /**
   * Indicates that the associated object isn't available
   */
  setUnavailable: function() {
    this._state = Metadata.Type.UNAVAILABLE;
  },

  /**
   * Indicates that the associated object isn't stale, i.e.
   * the object correlate the database state and is not modified by the user
   */
  setPersistent: function() {
    this._state = Metadata.Type.PERSISTENT;
  },

  /**
   * Indicates the the object is modified by the user
   */
  setDirty: function() {
    this._state = Metadata.Type.DIRTY;
  },

  /**
   * Indicates the the object is removed
   */
  setRemoved: function() {
    this.setDirty();
    this.version = null;
  },

  getDatabaseObjectInfo: function(excludeVersion) {
    var info = {
      bucket: this.type.name
    };

    if (this.id) {
      info.id = this.id;
    }

    if (!excludeVersion && this.version) {
      info.version = this.version;
    }

    if (this.db.transaction.isActive) {
      info.transaction = '/transaction/' + this.db.transaction.tid;
    }

    info.acl = this.acl;

    return info;
  },

  /**
   * Sets the object metadata from the object
   * @param {Object} json
   */
  setDatabaseObjectInfo: function(json) {
    if (!this.id)
      this.id = json.id;

    if(json.version)
      this.version = json.version;

    this.acl.fromJSON(json.acl || {});
  },

  /**
   * Converts the object to an JSON-Object
   * @param {Boolean} [excludeVersion]
   * @param {Boolean} [excludeObjectInfo]
   * @returns {Object} JSON-Object
   */
  getDatabaseObject: function(excludeVersion, excludeObjectInfo) {
    this._enabled = false;
    var json = this.type.toDatabaseValue(this, this._root);
    this._enabled = true;

    if (this.isAttached && !excludeObjectInfo) {
      json._objectInfo = this.getDatabaseObjectInfo(excludeVersion);
    }

    return json;
  },

  setDatabaseObject: function(json) {
    if(json._objectInfo) {
      this.setDatabaseObjectInfo(json._objectInfo);
    }

    this._enabled = false;
    this.type.fromDatabaseValue(this, json, this._root);
    this._enabled = true;
  }
});
},{"../":31,"../error/PersistentError":28,"./Acl":50}],54:[function(require,module,exports){
/**
 * @class baqend.util.Permission
 */
var Permission = module.exports = Object.inherit(/** @lends baqend.util.Permission.prototype */ {

  /**
   * @type baqend.util.Metadata
   * @private
   */
  _metadata: null,

  /**
   * The set of rules
   * @type object
   * @private
   */
  _rules: null,

  /**
   * Creates a new Permission object, with an empty rule set
   * @param {baqend.util.Metadata} metadata The metadata of the object
   */
  initialize: function(metadata) {
    this._rules = {};
    this._metadata = metadata;
  },

  /**
   * Returns a list of user and role references of all rules
   * @return {String[]} a list of references
   */
  allRules: function() {
    return Object.keys(this._rules);
  },

  /**
   * Removes all rules from this permission object
   */
  clear: function() {
    this._metadata && this._metadata.writeAccess();
    this._rules = {};
  },

  /**
   * Gets whenever all users and roles have the permission to perform the operation
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicAllowed: function() {
    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        return false;
      }
    }

    return true;
  },

  /**
   * Sets whenever all users and roles should have the permission to perform the operation.
   * Note: All other allow rules will be removed.
   */
  setPublicAllowed: function() {
    this._metadata && this._metadata.writeAccess();
    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        delete this._rules[ref];
      }
    }
  },

  /**
   * Returns the actual rule of the given user or role.
   * @param userOrRole The user or role to check for
   * @return {String|undefined} The actual access rule
   */
  getRule: function(userOrRole) {
    return this._rules[this._getRef(userOrRole)];
  },

  /**
   * Checks whenever the user or role is explicit allowed to perform the operation.
   *
   * @param userOrRole The user or role to check for
   */
  isAllowed: function(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'allow';
  },

  /**
   * Checks whenever the user or role is explicit denied to perform the operation.
   *
   * @param userOrRole The user or role to check for
   */
  isDenied: function(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'deny';
  },

  /**
   * Allows the given user or rule to perform the operation
   * @param userOrRole The user or role to allow
   * @return {baqend.util.Permission} this permission object
   */
  allowAccess: function(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    this._rules[this._getRef(userOrRole)] = 'allow';
    return this;
  },

  /**
   * Denies the given user or rule to perform the operation
   * @param userOrRole The user or role to deny
   * @return {baqend.util.Permission} this permission object
   */
  denyAccess: function(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    this._rules[this._getRef(userOrRole)] = 'deny';
    return this;
  },

  /**
   * Deletes any allow/deny rule for the given user or role
   * @param userOrRole The user or role
   * @return {baqend.util.Permission} this permission object
   */
  deleteAccess: function(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    delete this._rules[this._getRef(userOrRole)];
    return this;
  },

  /**
   * A Json representation of the set of rules
   * @return {object}
   */
  toJSON: function() {
    return this._rules;
  },

  /**
   * Sets the permission rules from json
   * @param {object} json The permission json representation
   */
  fromJSON: function(json) {
    this._rules = json;
  },

  /**
   * Resolves user and role references and validate given references
   * @param userOrRole The user, role or reference
   * @return {String} The resolved and validated reference
   * @private
   */
  _getRef: function(userOrRole) {
    if (!String.isInstance(userOrRole)) {
      userOrRole = userOrRole._metadata.ref;
    }

    if (userOrRole.indexOf('/db/User/') || userOrRole.indexOf('/db/Role/')) {
      return userOrRole;
    }

    throw new TypeError('The given object isn\'t a user, role or a valid reference.');
  }

});
},{}],55:[function(require,module,exports){
/**
 * @class baqend.util.ValidationResult
 */
var ValidationResult = module.exports = Object.inherit(/** @lends baqend.util.ValidationResult.prototype */ {

  fields: null,

  get isValid() {
    for (var key in this.fields) {
      if(!this.fields[key].isValid) {
        return false;
      }
    }
    return true;
  },

  initialize: function() {
    this.fields = {};
  },

  toJSON: function() {
    var json = {};
    for(var key in this.fields) {
      json[key] = this.fields[key].toJSON();
    }
    return json;
  }
});
},{}],56:[function(require,module,exports){
var valLib = require('validator');

/**
 * @class baqend.util.Validator
 */
var Validator = module.exports = Object.inherit(/** @lends baqend.util.Validator.prototype */ {

  extend: {
    initialize: function() {
      Object.keys(valLib).forEach(function(name) {
        if (typeof valLib[name] == 'function' && name !== 'toString' &&
            name !== 'toDate' && name !== 'extend' && name !== 'init') {

          this.prototype[name] = function(error) {
            //noinspection JSPotentiallyInvalidUsageOfThis
            return this._callMethod(name, error || name, Array.prototype.slice.call(arguments, error? 1: 0));
          }

        }
      }.bind(this));
    }
  },

  /**
   * Name of the attribute
   * @type String
   */
  key: null,

  /**
   * Result of the validation
   * @type Array
   */
  errors: null,

  /**
   * Entity to get the value of the attribute
   * @type {baqend.binding.Entity}
   * @private
   */
  _entity: null,

  /**
   * Gets the value of the attribute
   * @return {*} Value
   */
  get value() {
    return this._entity[this.key];
  },

  /**
   * Checks if the attribute is valid
   * @return {Boolean}
   */
  get isValid() {
    return this.errors.length == 0;
  },

  is: function(error, fn) {
    if(Function.isInstance(error)) {
      fn = error;
      error = 'is';
    }
    if(fn(this.value) === false) {
      this.errors.push(error);
    }
    return this;
  },

  initialize: function(key, entity) {
    this.key = key;
    this._entity = entity;
    this.errors = [];
  },

  _callMethod: function(method, error, args) {
    args = args || [];
    args.unshift(this.value);
    if(valLib[method].apply(this, args) === false) {
      this.errors.push(error);
    }
    return this;
  },

  toString: function() {
    return this.value;
  },

  toJSON: function() {
    return {
      isValid: this.isValid,
      errors: this.errors
    }
  }
});
},{"validator":80}],57:[function(require,module,exports){
/**
 * @namespace baqend.util
 */

exports.Metadata = require('./Metadata');
exports.Permission = require('./Permission');
exports.Acl = require('./Acl');
exports.Validator = require('./Validator');
exports.ValidationResult = require('./ValidationResult');
exports.Code = require('./Code');
exports.Lockable = require('./Lockable');
},{"./Acl":50,"./Code":51,"./Lockable":52,"./Metadata":53,"./Permission":54,"./ValidationResult":55,"./Validator":56}],58:[function(require,module,exports){

},{}],59:[function(require,module,exports){
(function (global){
/*! Jahcode v1.1.5 | jahcode.com | Copyright 2011-2014 by Florian Buecklers | MIT license */

(function(global) {
    var fakePrototype = Object.getPrototypeOf({
        constructor : String
    }) == String.prototype;

    if (!Function.prototype.extend) {
        /**
         * Extends the target with the properties of props and return target
         * @param {*=} target The target to extends or thisArg, if it is not set
         * @param {Object} props The properties to extend
         * @returns {*} The extended target
         */
        Function.prototype.extend = function(target, props) {
            if (!props) {
                props = target;
                target = this;
            }

            for (var name in props) {
                if (props.hasOwnProperty(name)) {
                    target[name] = props[name];
                }
            }

            return target;
        };
    }

    Object.extend(Function.prototype, /** @lends Function.prototype */ {
        /**
         * The linearized type hierarchy of this class
         * @type Function[]
         */
        linearizedTypes : [Object],

        /**
         * Inherits this constructor and extends it by additional properties and methods. Optional there can be mixined
         * additional Traits
         * @param {Trait...} traits Additional traits to mixin
         * @param {Object} classDescriptor The descriptor of the class properties and methods
         * @returns {Function} The new created child class
         */
        inherit : function() {
            var klass = function(toCast) {
                if (!(this instanceof klass)) {
                    return klass.asInstance(toCast);
                }

                if (this.initialize)
                    arguments.length ? this.initialize.apply(this, arguments) : this.initialize.call(this);
            };

            var objectDescriptor = arguments[arguments.length - 1];
            var proto = Object.createPrototypeChain(klass, this, Array.prototype.slice.call(arguments, 0, arguments.length - 1));

            var names = Object.getOwnPropertyNames(objectDescriptor);
            for ( var i = 0; i < names.length; ++i) {
                var name = names[i];
                var result = false;
                if (Object.properties.hasOwnProperty(name)) {
                    result = Object.properties[name](proto, objectDescriptor, name);
                }

                if (!result) {
                    var d = Object.getOwnPropertyDescriptor(objectDescriptor, name);

                    if (d.value) {
                        var val = d.value;
                        if (val instanceof Function) {
                            if (/this\.superCall/.test(val.toString())) {
                                d.value = Object.createSuperCallWrapper(klass, name, val);
                            }
                        } else if (val && (val.hasOwnProperty('get') || val.hasOwnProperty('value'))) {
                            d = val;
                        }
                    }

                    Object.defineProperty(proto, name, d);
                }
            }

            if (klass.initialize) {
                klass.initialize();
            }

            return klass;
        },

        /**
         * Indicates if this class is a subclass of the given class or mixin the given trait.
         * @param {Function} cls The parent class or trait to check
         * @returns {boolean} <code>true</code> if this class is a subclass or mixin the trait
         */
        isA: function(cls) {
            return this.prototype instanceof cls || this.linearizedTypes.lastIndexOf(cls) != -1;
        },

        /**
         * Indicates if the object is an instance of this class
         * @param obj The object to check for
         * @returns {boolean} <code>true</code> if the object is defined and
         */
        isInstance : function(obj) {
            if (obj === null || obj === void 0)
                return false;

            return Object(obj) instanceof this || classOf(obj).linearizedTypes.lastIndexOf(this) != -1;
        },

        /**
         * Checks if the object is an instance of this class and returns the object or try to convert the
         * object to an instance of this class by calling {@link #conv}
         * @param obj The object to check
         * @returns {*} The typed object or null, if the object can't be typed to an instance of this class
         */
        asInstance : function(obj) {
            if (this.isInstance(obj)) {
                return obj;
            } else {
                return this.conv(obj);
            }
        },

        /**
         * Converts the given value to an instance of this class, or returns null, if the value can't be converted
         * @param {*} value The value to convert
         * @returns {null} The converted value or null
         */
        conv : function() {
            return null;
        }
    });

    Object.extend( /** @lends Object **/ {
        properties : {},
        cloneOwnProperties : function(target, src) {
            var names = Object.getOwnPropertyNames(src);
            for ( var i = 0; i < names.length; ++i) {
                var name = names[i];
                if (name != '__proto__') {
                    var descr = Object.getOwnPropertyDescriptor(src, name);

                    Object.defineProperty(target, name, descr);
                }
            }
        },
        createPrototypeChain : function(cls, parentClass, traits) {
            var proto = parentClass.prototype;
            var linearizedTypes = parentClass.linearizedTypes.slice();
            var prototypeChain = parentClass.prototypeChain ? parentClass.prototypeChain.slice() : [proto];

            for ( var i = 0, trait; trait = traits[i]; ++i) {
                if (!(trait.prototype instanceof Trait)) {
                    throw new TypeError("Only traits can be mixed in.");
                }

                var linearizedTraitTypes = trait.linearizedTypes;
                for ( var j = 0, type; type = linearizedTraitTypes[j]; ++j) {
                    if (linearizedTypes.indexOf(type) == -1 && type != Trait) {
                        proto = Object.create(proto);
                        Object.cloneOwnProperties(proto, type.wrappedPrototype ? type.wrappedPrototype : type.prototype);

                        proto.constructor = type;

                        linearizedTypes.push(type);
                        prototypeChain.push(proto);
                    }
                }
            }

            proto = Object.create(proto);
            proto.constructor = cls;

            linearizedTypes.push(cls);
            prototypeChain.push(proto);

            if (fakePrototype) {
                cls.wrappedPrototype = proto;
                cls.prototype = Object.create(proto);
            } else {
                cls.prototype = proto;
            }

            cls.linearizedTypes = linearizedTypes;
            cls.prototypeChain = prototypeChain;

            return proto;
        },
        createSuperCallWrapper : function(declaringClass, methodName, method) {
            var superCall = function() {
                var cls = classOf(this);
                var index = cls.linearizedTypes.lastIndexOf(declaringClass);
                if (index == -1) {
                    throw new ReferenceError("superCall can't determine any super method");
                }

                var proto = cls.prototypeChain[index - 1];

                if (methodName != 'initialize' || proto[methodName])
                    return arguments.length ? proto[methodName].apply(this, arguments) : proto[methodName].call(this);
            };

            return function() {
                var current = this.superCall;
                this.superCall = superCall;

                try {
                    return arguments.length ? method.apply(this, arguments) : method.call(this);
                } finally {
                    if (current) {
                        this.superCall = current;
                    } else {
                        // made the property invisible again
                        delete this.superCall;
                    }
                }
            };
        }
    });

    Object.extend(Object.properties, {
        initialize : function(proto, objectDescriptor) {
            var init = objectDescriptor.initialize;
            var test = /this\.superCall/.test(init.toString());
            if (proto instanceof Trait) {
                if (test) {
                    throw new TypeError('Trait constructors can not call super constructors directly.');
                }

                objectDescriptor.initialize = function() {
                    arguments.length ? this.superCall.apply(this, arguments) : this.superCall.call(this);
                    init.call(this);
                };
            } else if (!test && classOf(proto) != Object) {
                objectDescriptor.initialize = function() {
                    this.superCall.call(this);
                    arguments.length ? init.apply(this, arguments) : init.call(this);
                };
            }
        },
        extend : function(proto, objectDescriptor) {
            Object.extend(proto.constructor, objectDescriptor.extend);
            return true;
        }
    });

    /**
     * Returns the constructor of the given object, works for objects and primitive types
     * @param {*} object The constructor to return for
     * @returns {Function} The constructor of the object
     * @global
     */
    var classOf = function(object) {
        if (object === null || object === void 0)
            return object;

        return Object.getPrototypeOf(Object(object)).constructor;
    };

    /**
     * @mixin Trait
     * @global
     */
    var Trait = Object.inherit({});

    /**
     * @extends Trait
     * @mixin Bind
     * @global
     */
    var Bind = Trait.inherit({
        /** @lends Bind */
        extend : {
            initialize : function() {
                try {
                    Object.defineProperty(this.prototype, 'bind', {
                        get : function() {
                            return this.bind = Bind.create(this);
                        },
                        set : function(val) {
                            Object.defineProperty(this, 'bind', {
                                value : val
                            });
                        },
                        configurable : true
                    });

                    this.Object = Object.inherit({
                        initialize : function(self) {
                            this.self = self;
                        }
                    });
                } catch (e) {
                    this.Object = Object.inherit({
                        initialize : function(self) {
                            this.self = self;

                            var bind = this;
                            Bind.each(self, function(name, method) {
                                bind[name] = method.bind(bind.self);
                            });
                        }
                    });
                }
            },

            /**
             * Creates a bind proxy for the given object
             * Each method of the given object is reflected on the proxy and
             * bound to the object context
             * @param {*} obj The object which will be bound
             * @returns {Bind} The bound proxy
             */
            create : function(obj) {
                if (!obj.constructor.Bind) {
                    try {
                        var descr = {};
                        Bind.each(obj, function(name, method) {
                            descr[name] = {
                                get : function() {
                                    return this[name] = method.bind(this.self);
                                },
                                set : function(val) {
                                    Object.defineProperty(this, name, {
                                        value : val
                                    });
                                },
                                configurable : true
                            };
                        });
                        obj.constructor.Bind = Bind.Object.inherit(descr);
                    } catch (e) {
                        obj.constructor.Bind = Bind.Object.inherit({});
                    }
                }

                return new obj.constructor.Bind(obj);
            },
            each : function(obj, callback) {
                var proto = Object.getPrototypeOf(obj);

                for ( var name in proto) {
                    var method = proto[name];
                    if (name != 'initialize' && method instanceof Function) {
                        callback(name, method);
                    }
                }
            }
        },

        initialize : function() {
            if (!('bind' in this)) {
                this.bind = Bind.create(this);
            }
        }

        /**
         * @type Bind
         * @name Bind.prototype.bind
         */
    });

    var nativeClasses = [Boolean, Number, String, Function, RegExp, Error];
    for ( var i = 0, cls; cls = nativeClasses[i]; ++i) {
        cls.conv = cls;
    }

    Date.conv = function(object) {
        return new Date(object);
    };

    Array.conv = function(object) {
        return Array.prototype.slice.call(object);
    };

    Array.prototype.initialize = function() {
        for ( var i = 0; i < arguments.length; ++i) {
            this[i] = arguments[i];
        }

        this.length = arguments.length;
    };

    Error.prototype.initialize = function(message) {
        var stack = new Error().stack || 'Error';
        stack = stack.substring(stack.indexOf('\n') + 1);
        
        this.stack = message + '\n' + stack;
        this.message = message;
    };

    if (TypeError instanceof Error) { // ie8 uses error instances for subtype constructors
        Error.prototype.isInstance = Error.isInstance;
        Error.prototype.asInstance = Error.asInstance;
        Error.prototype.conv = Error.conv;
    }

    Object.extend(global, {
        classOf : classOf,
        Trait : Trait,
        Bind : Bind
    });
})(typeof window != 'undefined' ? window : global);
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],60:[function(require,module,exports){
'use strict';

module.exports = INTERNAL;

function INTERNAL() {}
},{}],61:[function(require,module,exports){
'use strict';
var Promise = require('./promise');
var reject = require('./reject');
var resolve = require('./resolve');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = all;
function all(iterable) {
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new Promise(INTERNAL);
  
  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len & !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}
},{"./INTERNAL":60,"./handlers":62,"./promise":65,"./reject":68,"./resolve":69}],62:[function(require,module,exports){
'use strict';
var tryCatch = require('./tryCatch');
var resolveThenable = require('./resolveThenable');
var states = require('./states');

exports.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return exports.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    resolveThenable.safely(self, thenable);
  } else {
    self.state = states.FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
exports.reject = function (self, error) {
  self.state = states.REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && typeof obj === 'object' && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}
},{"./resolveThenable":70,"./states":71,"./tryCatch":72}],63:[function(require,module,exports){
module.exports = exports = require('./promise');

exports.resolve = require('./resolve');
exports.reject = require('./reject');
exports.all = require('./all');
exports.race = require('./race');
},{"./all":61,"./promise":65,"./race":67,"./reject":68,"./resolve":69}],64:[function(require,module,exports){
(function (global){
'use strict';
if (typeof global.Promise !== 'function') {
  global.Promise = require('./index');
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./index":63}],65:[function(require,module,exports){
'use strict';

var unwrap = require('./unwrap');
var INTERNAL = require('./INTERNAL');
var resolveThenable = require('./resolveThenable');
var states = require('./states');
var QueueItem = require('./queueItem');

module.exports = Promise;
function Promise(resolver) {
  if (!(this instanceof Promise)) {
    return new Promise(resolver);
  }
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function');
  }
  this.state = states.PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    resolveThenable.safely(this, resolver);
  }
}

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === states.FULFILLED ||
    typeof onRejected !== 'function' && this.state === states.REJECTED) {
    return this;
  }
  var promise = new Promise(INTERNAL);

  
  if (this.state !== states.PENDING) {
    var resolver = this.state === states.FULFILLED ? onFulfilled: onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};

},{"./INTERNAL":60,"./queueItem":66,"./resolveThenable":70,"./states":71,"./unwrap":73}],66:[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var unwrap = require('./unwrap');

module.exports = QueueItem;
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};
},{"./handlers":62,"./unwrap":73}],67:[function(require,module,exports){
'use strict';
var Promise = require('./promise');
var reject = require('./reject');
var resolve = require('./resolve');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = race;
function race(iterable) {
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return resolve([]);
  }

  var resolved = 0;
  var i = -1;
  var promise = new Promise(INTERNAL);
  
  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    resolve(value).then(function (response) {
      if (!called) {
        called = true;
        handlers.resolve(promise, response);
      }
    }, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
  }
}
},{"./INTERNAL":60,"./handlers":62,"./promise":65,"./reject":68,"./resolve":69}],68:[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = reject;

function reject(reason) {
	var promise = new Promise(INTERNAL);
	return handlers.reject(promise, reason);
}
},{"./INTERNAL":60,"./handlers":62,"./promise":65}],69:[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = resolve;

var FALSE = handlers.resolve(new Promise(INTERNAL), false);
var NULL = handlers.resolve(new Promise(INTERNAL), null);
var UNDEFINED = handlers.resolve(new Promise(INTERNAL), void 0);
var ZERO = handlers.resolve(new Promise(INTERNAL), 0);
var EMPTYSTRING = handlers.resolve(new Promise(INTERNAL), '');

function resolve(value) {
  if (value) {
    if (value instanceof Promise) {
      return value;
    }
    return handlers.resolve(new Promise(INTERNAL), value);
  }
  var valueType = typeof value;
  switch (valueType) {
    case 'boolean':
      return FALSE;
    case 'undefined':
      return UNDEFINED;
    case 'object':
      return NULL;
    case 'number':
      return ZERO;
    case 'string':
      return EMPTYSTRING;
  }
}
},{"./INTERNAL":60,"./handlers":62,"./promise":65}],70:[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var tryCatch = require('./tryCatch');
function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }
  
  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}
exports.safely = safelyResolveThenable;
},{"./handlers":62,"./tryCatch":72}],71:[function(require,module,exports){
// Lazy man's symbols for states

exports.REJECTED = ['REJECTED'];
exports.FULFILLED = ['FULFILLED'];
exports.PENDING = ['PENDING'];
},{}],72:[function(require,module,exports){
'use strict';

module.exports = tryCatch;

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}
},{}],73:[function(require,module,exports){
'use strict';

var immediate = require('immediate');
var handlers = require('./handlers');
module.exports = unwrap;

function unwrap(promise, func, value) {
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}
},{"./handlers":62,"immediate":74}],74:[function(require,module,exports){
'use strict';
var types = [
  require('./nextTick'),
  require('./mutation.js'),
  require('./messageChannel'),
  require('./stateChange'),
  require('./timeout')
];
var draining;
var queue = [];
//named nextTick for less confusing stack traces
function nextTick() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}
var scheduleDrain;
var i = -1;
var len = types.length;
while (++ i < len) {
  if (types[i] && types[i].test && types[i].test()) {
    scheduleDrain = types[i].install(nextTick);
    break;
  }
}
module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}
},{"./messageChannel":75,"./mutation.js":76,"./nextTick":58,"./stateChange":77,"./timeout":78}],75:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  if (global.setImmediate) {
    // we can only get here in IE10
    // which doesn't handel postMessage well
    return false;
  }
  return typeof global.MessageChannel !== 'undefined';
};

exports.install = function (func) {
  var channel = new global.MessageChannel();
  channel.port1.onmessage = func;
  return function () {
    channel.port2.postMessage(0);
  };
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],76:[function(require,module,exports){
(function (global){
'use strict';
//based off rsvp https://github.com/tildeio/rsvp.js
//license https://github.com/tildeio/rsvp.js/blob/master/LICENSE
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/asap.js

var Mutation = global.MutationObserver || global.WebKitMutationObserver;

exports.test = function () {
  return Mutation;
};

exports.install = function (handle) {
  var called = 0;
  var observer = new Mutation(handle);
  var element = global.document.createTextNode('');
  observer.observe(element, {
    characterData: true
  });
  return function () {
    element.data = (called = ++called % 2);
  };
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],77:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  return 'document' in global && 'onreadystatechange' in global.document.createElement('script');
};

exports.install = function (handle) {
  return function () {

    // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    var scriptEl = global.document.createElement('script');
    scriptEl.onreadystatechange = function () {
      handle();

      scriptEl.onreadystatechange = null;
      scriptEl.parentNode.removeChild(scriptEl);
      scriptEl = null;
    };
    global.document.documentElement.appendChild(scriptEl);

    return handle;
  };
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],78:[function(require,module,exports){
'use strict';
exports.test = function () {
  return true;
};

exports.install = function (t) {
  return function () {
    setTimeout(t, 0);
  };
};
},{}],79:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
 

  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);

},{}],80:[function(require,module,exports){
/*!
 * Copyright (c) 2014 Chris O'Hara <cohara87@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function (name, definition) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else {
        this[name] = definition();
    }
})('validator', function (validator) {

    'use strict';

    validator = { version: '3.30.0' };

    var emailAddress = /((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))/;
    var displayName = /([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~\.]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~\.]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\s)*/;

    var email = new RegExp('^' + emailAddress.source + '$', 'i');
    var emailWithDisplayName = new RegExp('^' + displayName.source + '<' + emailAddress.source + '>$', 'i');

    var creditCard = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;

    var isbn10Maybe = /^(?:[0-9]{9}X|[0-9]{10})$/
      , isbn13Maybe = /^(?:[0-9]{13})$/;

    var ipv4Maybe = /^(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)$/
      , ipv6 = /^::|^::1|^([a-fA-F0-9]{1,4}::?){1,7}([a-fA-F0-9]{1,4})$/;

    var uuid = {
        '3': /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i
      , '4': /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      , '5': /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      , all: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
    };

    var alpha = /^[a-zA-Z]+$/
      , alphanumeric = /^[a-zA-Z0-9]+$/
      , numeric = /^[-+]?[0-9]+$/
      , int = /^(?:[-+]?(?:0|[1-9][0-9]*))$/
      , float = /^(?:[-+]?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][\+\-]?(?:[0-9]+))?$/
      , hexadecimal = /^[0-9a-fA-F]+$/
      , hexcolor = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

    var ascii = /^[\x00-\x7F]+$/
      , multibyte = /[^\x00-\x7F]/
      , fullWidth = /[^\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/
      , halfWidth = /[\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/;

    var surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;

    var base64 = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{4})$/;

    var phones = {
      'zh-CN': /^(\+?0?86\-?)?1[345789]\d{9}$/,
      'en-ZA': /^(\+?27|0)\d{9}$/,
      'en-AU': /^(\+?61|0)4\d{8}/,
      'fr-FR': /^(\+?33|0)[67]\d{8}$/,
      'pt-PT': /^(\+351)?9[1236]\d{7}$/
    };

    validator.extend = function (name, fn) {
        validator[name] = function () {
            var args = Array.prototype.slice.call(arguments);
            args[0] = validator.toString(args[0]);
            return fn.apply(validator, args);
        };
    };

    //Right before exporting the validator object, pass each of the builtins
    //through extend() so that their first argument is coerced to a string
    validator.init = function () {
        for (var name in validator) {
            if (typeof validator[name] !== 'function' || name === 'toString' ||
                    name === 'toDate' || name === 'extend' || name === 'init') {
                continue;
            }
            validator.extend(name, validator[name]);
        }
    };

    validator.toString = function (input) {
        if (typeof input === 'object' && input !== null && input.toString) {
            input = input.toString();
        } else if (input === null || typeof input === 'undefined' || (isNaN(input) && !input.length)) {
            input = '';
        } else if (typeof input !== 'string') {
            input += '';
        }
        return input;
    };

    validator.toDate = function (date) {
        if (Object.prototype.toString.call(date) === '[object Date]') {
            return date;
        }
        date = Date.parse(date);
        return !isNaN(date) ? new Date(date) : null;
    };

    validator.toFloat = function (str) {
        return parseFloat(str);
    };

    validator.toInt = function (str, radix) {
        return parseInt(str, radix || 10);
    };

    validator.toBoolean = function (str, strict) {
        if (strict) {
            return str === '1' || str === 'true';
        }
        return str !== '0' && str !== 'false' && str !== '';
    };

    validator.equals = function (str, comparison) {
        return str === validator.toString(comparison);
    };

    validator.contains = function (str, elem) {
        return str.indexOf(validator.toString(elem)) >= 0;
    };

    validator.matches = function (str, pattern, modifiers) {
        if (Object.prototype.toString.call(pattern) !== '[object RegExp]') {
            pattern = new RegExp(pattern, modifiers);
        }
        return pattern.test(str);
    };

    var default_email_options = {
        allow_display_name: false
    };

    validator.isEmail = function (str, options) {
        options = merge(options, default_email_options);

        return email.test(str) || (options.allow_display_name === true && emailWithDisplayName.test(str));
    };

    var default_url_options = {
        protocols: [ 'http', 'https', 'ftp' ]
      , require_tld: true
      , require_protocol: false
      , allow_underscores: false
      , allow_trailing_dot: false
    };

    validator.isURL = function (url, options) {
        if (!url || url.length >= 2083) {
            return false;
        }
        if (url.indexOf('mailto:') === 0) {
            return false;
        }
        options = merge(options, default_url_options);
        var protocol, user, pass, auth, host, hostname, port,
            port_str, path, query, hash, split;
        split = url.split('://');
        if (split.length > 1) {
            protocol = split.shift();
            if (options.protocols.indexOf(protocol) === -1) {
                return false;
            }
        } else if (options.require_protocol) {
            return false;
        }
        url = split.join('://');
        split = url.split('#');
        url = split.shift();
        hash = split.join('#');
        if (hash && /\s/.test(hash)) {
            return false;
        }
        split = url.split('?');
        url = split.shift();
        query = split.join('?');
        if (query && /\s/.test(query)) {
            return false;
        }
        split = url.split('/');
        url = split.shift();
        path = split.join('/');
        if (path && /\s/.test(path)) {
            return false;
        }
        split = url.split('@');
        if (split.length > 1) {
            auth = split.shift();
            if (auth.indexOf(':') >= 0) {
                auth = auth.split(':');
                user = auth.shift();
                if (!/^\S+$/.test(user)) {
                    return false;
                }
                pass = auth.join(':');
                if (!/^\S*$/.test(user)) {
                    return false;
                }
            }
        }
        hostname = split.join('@');
        split = hostname.split(':');
        host = split.shift();
        if (split.length) {
            port_str = split.join(':');
            port = parseInt(port_str, 10);
            if (!/^[0-9]+$/.test(port_str) || port <= 0 || port > 65535) {
                return false;
            }
        }
        if (!validator.isIP(host) && !validator.isFQDN(host, options) &&
                host !== 'localhost') {
            return false;
        }
        if (options.host_whitelist &&
                options.host_whitelist.indexOf(host) === -1) {
            return false;
        }
        if (options.host_blacklist &&
                options.host_blacklist.indexOf(host) !== -1) {
            return false;
        }
        return true;
    };

    validator.isIP = function (str, version) {
        version = validator.toString(version);
        if (!version) {
            return validator.isIP(str, 4) || validator.isIP(str, 6);
        } else if (version === '4') {
            if (!ipv4Maybe.test(str)) {
                return false;
            }
            var parts = str.split('.').sort(function (a, b) {
                return a - b;
            });
            return parts[3] <= 255;
        }
        return version === '6' && ipv6.test(str);
    };

    var default_fqdn_options = {
        require_tld: true
      , allow_underscores: false
      , allow_trailing_dot: false
    };

    validator.isFQDN = function (str, options) {
        options = merge(options, default_fqdn_options);

        /* Remove the optional trailing dot before checking validity */
        if (options.allow_trailing_dot && str[str.length - 1] === '.') {
            str = str.substring(0, str.length - 1);
        }
        var parts = str.split('.');
        if (options.require_tld) {
            var tld = parts.pop();
            if (!parts.length || !/^([a-z\u00a1-\uffff]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) {
                return false;
            }
        }
        for (var part, i = 0; i < parts.length; i++) {
            part = parts[i];
            if (options.allow_underscores) {
                if (part.indexOf('__') >= 0) {
                    return false;
                }
                part = part.replace(/_/g, '');
            }
            if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) {
                return false;
            }
            if (part[0] === '-' || part[part.length - 1] === '-' ||
                    part.indexOf('---') >= 0) {
                return false;
            }
        }
        return true;
    };

    validator.isAlpha = function (str) {
        return alpha.test(str);
    };

    validator.isAlphanumeric = function (str) {
        return alphanumeric.test(str);
    };

    validator.isNumeric = function (str) {
        return numeric.test(str);
    };

    validator.isHexadecimal = function (str) {
        return hexadecimal.test(str);
    };

    validator.isHexColor = function (str) {
        return hexcolor.test(str);
    };

    validator.isLowercase = function (str) {
        return str === str.toLowerCase();
    };

    validator.isUppercase = function (str) {
        return str === str.toUpperCase();
    };

    validator.isInt = function (str) {
        return int.test(str);
    };

    validator.isFloat = function (str) {
        return str !== '' && float.test(str);
    };

    validator.isDivisibleBy = function (str, num) {
        return validator.toFloat(str) % validator.toInt(num) === 0;
    };

    validator.isNull = function (str) {
        return str.length === 0;
    };

    validator.isLength = function (str, min, max) {
        var surrogatePairs = str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || [];
        var len = str.length - surrogatePairs.length;
        return len >= min && (typeof max === 'undefined' || len <= max);
    };

    validator.isByteLength = function (str, min, max) {
        return str.length >= min && (typeof max === 'undefined' || str.length <= max);
    };

    validator.isUUID = function (str, version) {
        var pattern = uuid[version ? version : 'all'];
        return pattern && pattern.test(str);
    };

    validator.isDate = function (str) {
        return !isNaN(Date.parse(str));
    };

    validator.isAfter = function (str, date) {
        var comparison = validator.toDate(date || new Date())
          , original = validator.toDate(str);
        return !!(original && comparison && original > comparison);
    };

    validator.isBefore = function (str, date) {
        var comparison = validator.toDate(date || new Date())
          , original = validator.toDate(str);
        return original && comparison && original < comparison;
    };

    validator.isIn = function (str, options) {
        var i;
        if (Object.prototype.toString.call(options) === '[object Array]') {
            var array = [];
            for (i in options) {
                array[i] = validator.toString(options[i]);
            }
            return array.indexOf(str) >= 0;
        } else if (typeof options === 'object') {
            return options.hasOwnProperty(str);
        } else if (options && typeof options.indexOf === 'function') {
            return options.indexOf(str) >= 0;
        }
        return false;
    };

    validator.isCreditCard = function (str) {
        var sanitized = str.replace(/[^0-9]+/g, '');
        if (!creditCard.test(sanitized)) {
            return false;
        }
        var sum = 0, digit, tmpNum, shouldDouble;
        for (var i = sanitized.length - 1; i >= 0; i--) {
            digit = sanitized.substring(i, (i + 1));
            tmpNum = parseInt(digit, 10);
            if (shouldDouble) {
                tmpNum *= 2;
                if (tmpNum >= 10) {
                    sum += ((tmpNum % 10) + 1);
                } else {
                    sum += tmpNum;
                }
            } else {
                sum += tmpNum;
            }
            shouldDouble = !shouldDouble;
        }
        return !!((sum % 10) === 0 ? sanitized : false);
    };

    validator.isISBN = function (str, version) {
        version = validator.toString(version);
        if (!version) {
            return validator.isISBN(str, 10) || validator.isISBN(str, 13);
        }
        var sanitized = str.replace(/[\s-]+/g, '')
          , checksum = 0, i;
        if (version === '10') {
            if (!isbn10Maybe.test(sanitized)) {
                return false;
            }
            for (i = 0; i < 9; i++) {
                checksum += (i + 1) * sanitized.charAt(i);
            }
            if (sanitized.charAt(9) === 'X') {
                checksum += 10 * 10;
            } else {
                checksum += 10 * sanitized.charAt(9);
            }
            if ((checksum % 11) === 0) {
                return !!sanitized;
            }
        } else  if (version === '13') {
            if (!isbn13Maybe.test(sanitized)) {
                return false;
            }
            var factor = [ 1, 3 ];
            for (i = 0; i < 12; i++) {
                checksum += factor[i % 2] * sanitized.charAt(i);
            }
            if (sanitized.charAt(12) - ((10 - (checksum % 10)) % 10) === 0) {
                return !!sanitized;
            }
        }
        return false;
    };

    validator.isMobilePhone = function(str, locale) {
        if (locale in phones) {
            return phones[locale].test(str);
        }
        return false;
    };

    validator.isJSON = function (str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    };

    validator.isMultibyte = function (str) {
        return multibyte.test(str);
    };

    validator.isAscii = function (str) {
        return ascii.test(str);
    };

    validator.isFullWidth = function (str) {
        return fullWidth.test(str);
    };

    validator.isHalfWidth = function (str) {
        return halfWidth.test(str);
    };

    validator.isVariableWidth = function (str) {
        return fullWidth.test(str) && halfWidth.test(str);
    };

    validator.isSurrogatePair = function (str) {
        return surrogatePair.test(str);
    };

    validator.isBase64 = function (str) {
        return base64.test(str);
    };

    validator.isMongoId = function (str) {
        return validator.isHexadecimal(str) && str.length === 24;
    };

    validator.ltrim = function (str, chars) {
        var pattern = chars ? new RegExp('^[' + chars + ']+', 'g') : /^\s+/g;
        return str.replace(pattern, '');
    };

    validator.rtrim = function (str, chars) {
        var pattern = chars ? new RegExp('[' + chars + ']+$', 'g') : /\s+$/g;
        return str.replace(pattern, '');
    };

    validator.trim = function (str, chars) {
        var pattern = chars ? new RegExp('^[' + chars + ']+|[' + chars + ']+$', 'g') : /^\s+|\s+$/g;
        return str.replace(pattern, '');
    };

    validator.escape = function (str) {
        return (str.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\//g, '&#x2F;'));
    };

    validator.stripLow = function (str, keep_new_lines) {
        var chars = keep_new_lines ? '\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F\\x7F' : '\\x00-\\x1F\\x7F';
        return validator.blacklist(str, chars);
    };

    validator.whitelist = function (str, chars) {
        return str.replace(new RegExp('[^' + chars + ']+', 'g'), '');
    };

    validator.blacklist = function (str, chars) {
        return str.replace(new RegExp('[' + chars + ']+', 'g'), '');
    };

    var default_normalize_email_options = {
        lowercase: true
    };

    validator.normalizeEmail = function (email, options) {
        options = merge(options, default_normalize_email_options);
        if (!validator.isEmail(email)) {
            return false;
        }
        var parts = email.split('@', 2);
        parts[1] = parts[1].toLowerCase();
        if (parts[1] === 'gmail.com' || parts[1] === 'googlemail.com') {
            parts[0] = parts[0].toLowerCase().replace(/\./g, '');
            if (parts[0][0] === '+') {
                return false;
            }
            parts[0] = parts[0].split('+')[0];
            parts[1] = 'gmail.com';
        } else if (options.lowercase) {
            parts[0] = parts[0].toLowerCase();
        }
        return parts.join('@');
    };

    function merge(obj, defaults) {
        obj = obj || {};
        for (var key in defaults) {
            if (typeof obj[key] === 'undefined') {
                obj[key] = defaults[key];
            }
        }
        return obj;
    }

    validator.init();

    return validator;

});

},{}]},{},[31])(31)
});