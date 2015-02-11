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
 * @extends baqend.uitl.Lockable
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
    var resolved = resolved || [];
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
   * @param {Boolean} refresh
   * @param {(Number|Boolean)} depth
   */
  insert: function(entity, refresh, depth) {
    var isNew;

    return this._save(entity, refresh, depth, function(state) {
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
   * @param {Boolean} refresh
   * @param {Boolean} force
   * @param {(Number|Boolean)} depth
   */
  update: function(entity, refresh, force, depth) {
    return this._save(entity, refresh, depth, function(state) {
      if(!state.version)
        throw new Error("New objects can't be inserted.");

      if (force) {
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
   * @param {Boolean} refresh
   * @param {Boolean} force
   * @param {(Number|Boolean)} depth
   * @return Promise
   */
  save: function(entity, refresh, force, depth) {
    return this._save(entity, refresh, depth, function(state) {
      if (force) {
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
          tmpSubEntities.push(curEntity)
        }
      }.bind(this));
      subEntities = tmpSubEntities;

    }.bind(this));

    return subEntities;
  },

  /**
   * Remove the entity instance.
   * @param {baqend.binding.Entity} entity
   * @param {Boolean} [force=false]
   * @param {(Number|Boolean)} [depth=0]
   * @return {Promise<baqend.binding.Entity>}
   */
  remove: function(entity, force, depth) {
    this.attach(entity);

    return entity.withLock(function() {
      var state = Metadata.get(entity);
      var refPromises = [];
      this.getSubEntities(entity, depth).forEach(function(sub) {
        refPromises.push(this.remove(sub, force));
      }.bind(this));

      if(!state.version && !force)
        throw new error.IllegalEntityError(entity);

      var msg = new message.DeleteObject(state.bucket, state.id, state.getDatabaseObjectInfo(force));

      if (!force)
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
   * @param {Object} entity - entity instance
   */
  refresh: function(entity) {
    //TODO: reimplement this
    return this.yield().then(function() {
      if (!this.contains(entity)) {
        throw new error.IllegalEntityError(entity);
      } else {
        var state = Metadata.get(entity);

        if (state.isNew) {
          throw new error.IllegalEntityError(entity);
        } else {
          var tid = 0, ref = state.type.id.getValue(entity);
          if (this.transaction.isChanged(ref))
            tid = this.transaction.tid;

          state.isDirty = false; // allow incoming changes to overwrite local changes
          var result = this.send(new message.GetObject(state, tid)).then(function() {
            if (state.isDeleted) {
              this.removeReference(entity);
              throw new error.EntityNotFoundError(ref);
            }
          });

          return this.wait(result);
        }
      }
    });
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