var uuid = require('node-uuid');

var util = require('./util');
var message = require('./message');
var error = require('./error');

var Q = require('q');
var EntityTransaction = require('./EntityTransaction').EntityTransaction;
var Query = require('./Query').Query;
var TypedQuery = require('./TypedQuery').TypedQuery;

/**
 * @class jspa.EntityManager
 */
exports.EntityManager = EntityManager = Object.inherit(/** @lends jspa.EntityManager.prototype */ {

  /**
   * @type jspa.EntityManagerFactory
   */
  entityManagerFactory: null,

  /**
   * @type jspa.metamodel.Metamodel
   */
  metamodel: null,

  /**
   * A promise which represents the state of the least requested operation
   * @type Q.Promise
   * @private
   */
  _readyPromise: Q(null),

  /**
   * Determine whether the entity manager is open.
   * true until the entity manager has been closed
   * @type {Boolean}
   */
  get isOpen() {
    return this.queue.isPrevented;
  },

  /**
   * The authentication token used in secured requests
   * @type String
   */
  _token: null,

  /**
   * The current logged in user object
   * @type jspa.binding.User
   */
  get me() {
    return this._me;
  },

  /**
   * An Object factory for embeddable objects,
   * that can be accessed by the type name of the embeddable type.
   * An object factory can be called to create new instances of the type.
   * @name [<i>MyEmbeddableClass</i>]
   * @memberOf jspa.EntityManager.prototype
   * @type {jspa.binding.ManagedFactory}
   */

  /**
   * An Object factory for entity objects,
   * that can be accessed by the type name of the entity type.
   * An object factory can be called to create new instances of the type.
   * @name [<i>MyEntityClass</i>]
   * @memberOf jspa.EntityManager.prototype
   * @type {jspa.binding.EntityFactory}
   */

  /**
   * An User factory for user objects.
   * The User factory can be called to create new instances of users or can be used to register/login/logout users.
   * @type {jspa.binding.UserFactory}
   */
  User: null,

  /**
   * Initialize the new EntityManager instance
   * @param {jspa.EntityManagerFactory} entityManagerFactory
   */
  initialize: function(entityManagerFactory) {
    this._connector = entityManagerFactory.connector;
    this._entities = {};

    this.entityManagerFactory = entityManagerFactory;
    this.metamodel = entityManagerFactory.metamodel;
    this.metamodel.finalize();

    this._createObjectFactory(this.metamodel._embeddables);
    this._createObjectFactory(this.metamodel._entities);

    this.transaction = new EntityTransaction(this);
  },

  /**
   * @param {jspa.metamodel.ManagedType[]} types
   * @return {jspa.binding.ManagedFactory}
   * @private
   */
  _createObjectFactory: function(types) {
    Object.keys(types).forEach(function(identifier) {
      var type = this.metamodel.managedType(identifier);
      var name = type.isNative? type.name.substring(8): type.name;
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
    }, this);
  },

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {jspa.binding.Enhanced~doneCallback} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Q.Promise<jspa.binding.Entity>} A promise which completes successfully, when the previously requested
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
   * @param {jspa.binding.Enhanced~callback} callback
   * @return {Q.Promise<jspa.binding.Entity>}
   */
  withLock: function(callback) {
    if(this._readyPromise.isPending())
      throw new Error('Current operation has not been finished.');

    return this._readyPromise = callback();
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
    var reference, type;
    if (String.isInstance(entityClass)) {
      if (String.isInstance(id)) {
        entityClass += '/' + id;
      }

      reference = entityClass;
      type = this.metamodel.entity(reference.substring(0, reference.lastIndexOf('/')));
    } else {
      type = this.metamodel.entity(entityClass);
      reference = type.identifier + '/' + id;
    }

    var entity = this._entities[reference];
    if (!entity) {
      entity = type.create();
      this.setReference(reference, entity);
      util.Metadata.get(entity).setUnavailable();
    }

    return entity;
  },

  /**
   * Create an instance of Query or TypedQuery for executing a query language statement.
   * if the optional resultClass argument is provided, the select list of the query must contain
   * only a single item, which must be assignable to the type specified by the resultClass argument.
   *
   * @param {String|Object} qlString - a query string
   * @param {String|Function=} resultClass - the optional type of the query result
   */
  createQuery: function(qlString, resultClass) {
    if (resultClass) {
      return new TypedQuery(this, qlString, resultClass);
    } else {
      return new Query(this, qlString);
    }
  },

  /**
   * Clear the persistence context, causing all managed entities to become detached.
   * Changes made to entities that have not been flushed to the database will not be persisted.
   */
  clear: function(doneCallback, failCallback) {
    // TODO: reimplement this
    return this.yield().then(function() {
      for (var identifier in this._entities) {
        this.removeReference(this._entities[identifier]);
      }
    }.bind(this)).then(doneCallback, failCallback);
  },

  /**
   * Close an application-managed entity manager. After the close method has been invoked,
   * all methods on the EntityManager instance and any Query and TypedQuery objects obtained from it
   * will throw the IllegalStateError except for transaction, and isOpen (which will return false).
   * If this method is called when the entity manager is associated with an active transaction,
   * the persistence context remains managed until the transaction completes.
   */
  close: function(doneCallback, failCallback) {
    // TODO: implement this
    return this.clear(doneCallback, failCallback);
  },

  /**
   * Check if the instance is a managed entity instance belonging to the current persistence context.
   * @param {jspa.binding.Entity} entity - entity instance
   * @returns {Boolean} boolean indicating if entity is in persistence context
   */
  contains: function(entity) {
    var metadata = util.Metadata.get(entity);
    return !!metadata && this._entities[metadata.ref] === entity;
  },

  /**
   * Check if an object with the id from the given entity is already attached.
   * @param {jspa.binding.Entity} entity - entity instance
   * @returns {Boolean} boolean indicating if entity with same id is attached
   */
  containsById: function(entity) {
    var metadata = util.Metadata.get(entity);
    return !!this._entities[metadata.ref];
  },

  /**
   * Remove the given entity from the persistence context, causing a managed entity to become detached.
   * Unflushed changes made to the entity if any (including removal of the entity),
   * will not be synchronized to the database. Entities which previously referenced the detached entity will continue to reference it.
   * @param {jspa.binding.Entity} entity - entity instance
   * @param {Function=} doneCallback
   * @param {function=} failCallback
   */
  detach: function(entity, doneCallback, failCallback) {
    return entity.withLock(function() {
      this.removeReference(entity);
      return entity;
    }).then(doneCallback, failCallback);
  },

  /**
   * Find by object ID. Search for an entity of the specified oid.
   * If the entity instance is contained in the persistence context, it is returned from there.
   * @param {(Function|String)} entityClass - entity class
   * @param {String} oid - Object ID
   * @param {boolean} refresh
   * @param {boolean|Number} depth
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @param {Array=} resolved
   */
  find: function(entityClass, oid, refresh, depth, doneCallback, failCallback, resolved) {
    var resolved = resolved || [];
    var entity = this.getReference(entityClass, oid);
    var state = util.Metadata.get(entity);

      var tid = 0, identifier = state.type.id.getValue(entity);

      //TODO: implement transactional changed case
      //if (this.transaction.isChanged(identifier))
      //  tid = this.transaction.tid;

    var msg = new message.GetObject(state.bucket, state.id);
    msg.setCacheControl('max-age=0, no-cache');
    if (state.version && !refresh)
      msg.setIfNoneMatch(state.version);

    return this._connector.send(msg).then(function(msg) {
      if (msg.response.statusCode != message.Message.StatusCode.NOT_MODIFIED) {
        state.setDatabaseObject(msg.response.entity);
      }

      state.setPersistent();

      var subPromise = [];
      if(depth) {
        this.getSubEntities(entity, 1).forEach(function(subEntity) {
          if(!~resolved.indexOf(subEntity)) {
            resolved.push(subEntity);
            var metadata = util.Metadata.get(subEntity);
            subPromise.push(this.find(subEntity.constructor, metadata.id, refresh, depth === true ? depth : depth-1, null, null, resolved));
          }
        }.bind(this));
      }

      return Q.all(subPromise).then(function() {
        return entity;
      });
    }.bind(this), function(e) {
      if (e.statusCode == message.Message.StatusCode.OBJECT_NOT_FOUND) {
        this.removeReference(entity);
        state.setRemoved();
        return null;
      } else {
        throw e;
      }
    }.bind(this)).then(doneCallback, failCallback);
  },

  /**
   * @param {jspa.binding.Entity} entity
   * @param {Boolean} refresh
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  insert: function(entity, refresh, depth, doneCallback, failCallback) {
    return this._save(entity, refresh, depth, function(state) {
      if(state.version)
        throw new Error('Existing objects can\'t be inserted.');
      return new message.CreateObject(state.bucket, state.getDatabaseObject());
    }).then(doneCallback, failCallback);
  },

  /**
   * @param {jspa.binding.Entity} entity
   * @param {Boolean} refresh
   * @param {Boolean} force
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  update: function(entity, refresh, force, depth, doneCallback, failCallback) {
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
    }).then(doneCallback, failCallback);
  },

  /**
   * @param {jspa.binding.Entity} entity
   * @param {Boolean} refresh
   * @param {Boolean} force
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   * @return Q.Promise
   */
  save: function(entity, refresh, force, depth, doneCallback, failCallback) {
    return this._save(entity, refresh, depth, function(state) {
      if (force) {
        return new message.ReplaceObject(state.bucket, state.id, state.getDatabaseObject(true));
      } else if (state.version) {
        var msg = new message.ReplaceObject(state.bucket, state.id, state.getDatabaseObject(false));
        msg.setIfMatch(state.version);
        return msg;
      } else {
        return new message.CreateObject(state.bucket, state.getDatabaseObject());
      }
    }).then(doneCallback, failCallback);
  },

  _save: function(entity, refresh, depth, msgFactory) {
    this.addReference(entity);

    return entity.withLock(function() {
      var state = util.Metadata.get(entity);
      var refPromises = [];
      this.getSubEntities(entity, depth).forEach(function(sub) {
        refPromises.push(this._save(sub, refresh, 0, msgFactory));
      }.bind(this));

      if (state.isDirty) {
        if(!refresh) {
          state.setPersistent();
        }

        var sendPromise = this._connector.send(msgFactory(state)).then(function(msg) {
          if(refresh) {
            state.setDatabaseObject(msg.response.entity);
            state.setPersistent();
          } else {
            state.setDatabaseObjectInfo(msg.response.entity._objectInfo);
          }
          return entity;
        }.bind(this), function(e) {
          if (e.statusCode == message.Message.StatusCode.OBJECT_NOT_FOUND) {
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
        refPromises.unshift(Q(entity));
      }
      return Q.all(refPromises).then(function() {
        return entity
      });
    }.bind(this));
  },

  /**
   * Returns all referenced sub entities for the given depth and root entity
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Boolean|Number} depth
   * @param {Array=} resolved
   * @param {jspa.metamodel.ManagedType=} initialEntity
   * @returns {Array}
   */
  getSubEntities: function(entity, depth, resolved, initialEntity) {
    resolved = resolved || [];
    if(!depth) {
      return resolved;
    }
    initialEntity = initialEntity || entity;

    var state = util.Metadata.get(entity);
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
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Array} path
   * @returns {Array}
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
   * @param {jspa.binding.Entity} entity
   * @param {Boolean} force
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  remove: function(entity, force, depth, doneCallback, failCallback) {
    this.addReference(entity);

    return entity.withLock(function() {
      var state = util.Metadata.get(entity);
      var refPromises = [];
      this.getSubEntities(entity, depth).forEach(function(sub) {
        refPromises.push(this.remove(sub, force));
      }.bind(this));

      if(!state.version && !force)
        throw new error.IllegalEntityError(entity);

      var msg = new message.DeleteObject(state.bucket, state.id, state.getDatabaseObjectInfo(force));

      if (!force)
        msg.setIfMatch(state.version);

      var sendPromise = this._connector.send(msg).then(function() {
        this.removeReference(entity);
        state.setRemoved();
        return entity;
      }.bind(this));

      refPromises.unshift(sendPromise);

      return Q.all(refPromises).then(function() {
        return entity;
      });
    }.bind(this)).then(doneCallback, failCallback);
  },

  /**
   * Synchronize the persistence context to the underlying database.
   *
   * @returns {jspa.Promise}
   */
  flush: function(doneCallback, failCallback) {
    // TODO: implement this
  },

  /**
   * Make an instance managed and persistent.
   * @param {jspa.binding.Entity} entity - entity instance
   */
  persist: function(entity) {
    entity.attach(this);
  },

  /**
   * Refresh the state of the instance from the database, overwriting changes made to the entity, if any.
   * @param {Object} entity - entity instance
   */
  refresh: function(entity, doneCallback, failCallback) {
    //TODO: reimplement this
    return this.yield().then(function() {
      if (!this.contains(entity)) {
        throw new error.IllegalEntityError(entity);
      } else {
        var state = util.Metadata.get(entity);

        if (state.isNew) {
          throw new error.IllegalEntityError(entity);
        } else {
          var tid = 0, identifier = state.type.id.getValue(entity);
          if (this.transaction.isChanged(identifier))
            tid = this.transaction.tid;

          state.isDirty = false; // allow incoming changes to overwrite local changes
          var result = this.send(new message.GetObject(state, tid)).then(function() {
            if (state.isDeleted) {
              this.removeReference(entity);
              throw new error.EntityNotFoundError(identifier);
            }
          });

          return this.wait(result);
        }
      }
    }).then(doneCallback, failCallback);
  },

  addReference: function(entity, depth) {
    if (!this.contains(entity)) {
      var type = this.metamodel.entity(entity.constructor);
      if (!type)
        throw new error.IllegalEntityError(entity);

      if(this.containsById(entity))
        throw new error.EntityExistsError(entity);

      var id = type.id.getValue(entity);

      this.setReference(type.identifier + '/' + (id || uuid.v4()), entity);
    }

    if (depth) {
      type = metadata.type;

      for (var iter = type.attributes(), item = iter.next(); !item.done; item = iter.next()) {
        var attribute = item.value;
        if (attribute.isAssociation) {
          var value = attribute.getValue(entity);
          if (value) {
            this.addReference(value, depth === true ? true : depth - 1);
          }
        }
      }
    }
  },

  setReference: function(identifier, entity) {
    var metadata = util.Metadata.get(entity);
    if (metadata.isAttached) {
      if (metadata.db != this) {
        throw new error.EntityExistsError(entity);
      }
    } else {
      metadata.db = this;
    }

    metadata.type.id.setValue(entity, identifier.substring(identifier.lastIndexOf('/') + 1));

    this._entities[identifier] = entity;
  },

  removeReference: function(entity) {
    var state = util.Metadata.get(entity);
    if (!state)
      throw new error.IllegalEntityError(entity);

    delete this._entities[state.ref];
  },

  register: function(username, password) {
    return this._userRequest(function() {
      return new message.Register({
        loginId: username,
        password: password
      });
    });
  },

  login: function(username, password) {
    return this._userRequest(function() {
      return new message.Login({
        loginId: username,
        password: password
      });
    });
  },

  logout: function() {
    return this.withLock(function() {
      return Q.fcall(function() {
        this._me = null;
        this._token = null;
      }.bind(this));
    }.bind(this));
  },

  _userRequest: function(messageFactory) {
    return this.withLock(function() {
      if (this._me)
        throw new Error('User is already logged in.');

      var msg = messageFactory();
      return this._connector.send(msg).then(function() {
        this._token = msg.getAuthorizationToken();

        var id = msg.response.entity._objectInfo.id;
        var user = this.getReference('_native.User', id);
        var metadata = util.Metadata.get(user);
        metadata.setDatabaseObject(msg.response.entity);
        metadata.setPersistent();
        return this._me = user;
      }.bind(this));
    }.bind(this));
  }
});