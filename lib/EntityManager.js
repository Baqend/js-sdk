var uuid = require('node-uuid');

var util = require('./util');
var message = require('./message');
var error = require('./error');

var Q = require('q');
var EntityTransaction = require('./EntityTransaction').EntityTransaction;
var Query = require('./Query').Query;
var TypedQuery = require('./TypedQuery').TypedQuery;
var Enhanced = require('./binding/Enhanced').Enhanced;

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
   * Determine whether the entity manager is open.
   * true until the entity manager has been closed
   * @type {Boolean}
   */
  isOpen: {
    get: function() {
      return this.queue.isPrevented;
    }
  },

  /**
   * @param {jspa.EntityManagerFactory} entityManagerFactory
   */
  initialize: function(entityManagerFactory) {
    this._connector = entityManagerFactory.connector;
    this._entities = {};

    this.entityManagerFactory = entityManagerFactory;
    this.metamodel = entityManagerFactory.metamodel;
    this.metamodel.finalize();

    Object.keys(this.metamodel._entities).forEach(function(identifier) {
      var entityType = this.metamodel.entity(identifier);
      Object.defineProperty(this, entityType.name, {
        get: function() {
          Object.defineProperty(this, entityType.name, {
            value: Enhanced.createFactory(entityType.typeConstructor, this)
          });

          return this[entityType.name];
        },
        set: function(typeConstructor) {
          entityType.typeConstructor = typeConstructor;
        },
        configurable: true
      });
    }, this);

    this.transaction = new EntityTransaction(this);
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
   * @param {Object} entity - entity instance
   * @returns {Boolean} boolean indicating if entity is in persistence context
   */
  contains: function(entity) {
    var metadata = util.Metadata.get(entity);
    return !!metadata && this._entities[metadata.ref] === entity;
  },

  /**
   * Check if an object with the id from the given entity is already attached.
   * @param {Object} entity - entity instance
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
   * @param {Object} entity - entity instance
   * @param {Function=} doneCallback
   * @param {function=} failCallback
   */
  detach: function(entity, doneCallback, failCallback) {
    return entity.ready().then(function() {
      this.removeReference(entity);
      return entity;
    }).then(doneCallback, failCallback);
  },

  /**
   * Find by object ID. Search for an entity of the specified oid.
   * If the entity instance is contained in the persistence context, it is returned from there.
   * @param {(Function|String)} entityClass - entity class
   * @param {String=} oid - Object ID
   * @param {Function=} doneCallback
   * @param {function=} failCallback
   */
  find: function(entityClass, oid, doneCallback, failCallback) {
    var promise;
    var entity = this.getReference(entityClass, oid);
    var state = util.Metadata.get(entity);

      var tid = 0, identifier = state.type.id.getValue(entity);

      //TODO: implement transactional changed case
      //if (this.transaction.isChanged(identifier))
      //  tid = this.transaction.tid;

    var msg = new message.GetObject(state.bucket, state.id);
    msg.setCacheControl('max-age=0, no-cache');
    if (state.version)
      msg.setIfNoneMatch(state.version);

    return this._connector.send(msg).then(function(message) {
      if (message.response.statusCode != 304) {
        state.setDatabaseObject(message.response.entity);
      }

      state.setPersistent();

      return entity;
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
   * @param {jspa.metamodel.ManagedType} entity
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  insert: function(entity, depth, doneCallback, failCallback) {
    return this._save(entity, depth, function(state) {
      return new message.CreateObject(state.bucket, state.getDatabaseObject());
    }).then(doneCallback, failCallback);
  },

  /**
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Boolean} force
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  update: function(entity, force, depth, doneCallback, failCallback) {
    return this._save(entity, depth, function(state) {
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
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Boolean} force
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  save: function(entity, force, depth, doneCallback, failCallback) {
    return this._save(entity, depth, function(state) {
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

  _save: function(entity, depth, msgFactory) {
    this.addReference(entity);

    return entity.ready(function() {
      var state = util.Metadata.get(entity);

      if (state.isDirty) {
        state.setPersistent();
        return this._connector.send(msgFactory(state)).then(function(msg) {
          if (refresh) {
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
      } else {
        return entity;
      }
    }.bind(this));
  },

  /**
   * Remove the entity instance.
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Boolean} force
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  remove: function(entity, force, depth, doneCallback, failCallback) {
    this.addReference(entity);

    return entity.ready(function() {
      var state = util.Metadata.get(entity);

      var msg = new message.DeleteObject(state.bucket, state.id, state.getDatabaseObjectInfo());

      if(!state.version && !force) {
        throw new error.IllegalEntityError(entity);
      }

      msg.setIfMatch(!force ? state.version : '*');

      return this._connector.send(msg).then(function() {
        this.removeReference(entity);
        state.setRemoved();
        return entity;
      }.bind(this));
    }.bind(this)).then(doneCallback, failCallback);
  },

  /**
   * Synchronize the persistence context to the underlying database.
   *
   * @returns {jspa.Promise}
   */
  flush: function(doneCallback, failCallback) {
    //TODO: reimplement this
    var result = this.yield().then(function() {
      var promises = [];

      for (var identifier in this._entities) {
        var entity = this._entities[identifier];
        var state = util.Metadata.get(entity);

        if (state.isDirty) {
          var promise;
          if (state.isNew) {
            var msg = new message.PostObject(state);
            msg.temporaryIdentifier = state.type.id.getValue(entity);

            promise = this.send(msg).done(function(msg) {
              var state = msg.state;
              var id = state.type.id.getValue(state.entity);

              this.transaction.setChanged(id);
              this.replaceReference(msg.temporaryIdentifier, id, state.entity);
            });
          } else if (state.isDeleted) {
            promise = this.send(new message.DeleteObject(state)).done(function(msg) {
              var state = msg.state;
              var id = state.type.id.getValue(state.entity);
              this.transaction.setChanged(id);

              if (!this.transaction.isActive)
                this.removeReference(state.entity);
            });
          } else {
            promise = this.send(new message.PutObject(state)).done(function(msg) {
              var state = msg.state;
              if (msg.state.isDeleted) {
                this.removeReference(state.entity);
              } else {
                var id = state.type.id.getValue(state.entity);
                this.transaction.setChanged(id);
              }
            });
          }

          promises.push(promise);
        }
      }

      if (promises.length)
        return Promise.when(promises);
    }).then(function() {
      if (!this.transaction.isActive) {
        var promises = [];

        //update all objects which have referenced a temporary object
        for (var identifier in this._entities) {
          var entity = this._entities[identifier];
          var state = util.Metadata.get(entity);

          if (state.isDirty) {
            var promise = this.send(new message.PutObject(state)).done(function(msg) {
              if (msg.state.isDeleted) {
                this.removeReference(msg.state.entity);
              }
            });

            promises.push(promise);
          }
        }

        if (promises.length)
          return Promise.when(promises);
      }
    });

    return this.wait(result).then(doneCallback, failCallback);
  },

  /**
   * Merge the state of the given entity into the current persistence context.
   *
   * @param {*} entity - entity instance
   * @return {jspa.Promise} the promise will be called with the managed instance that the state was merged to
   */
  merge: function(entity, doneCallback, failCallback) {
    // TODO: reimplement this
    return this.yield().then(function() {
      var type = this.metamodel.entity(entity.constructor);
      var identifier = type.id.getValue(entity);
      if (identifier) {
        return this.find(identifier).then(function(persistentEntity) {
          if (persistentEntity && persistentEntity.constructor == entity.constructor) {
            var type = this.metamodel.entity(persistentEntity.constructor);
            for (var iter = type.attributes(); iter.hasNext;) {
              var attribute = iter.next();

              attribute.setValue(persistentEntity, attribute.getValue(entity));
            }

            return persistentEntity;
          } else {
            throw new error.EntityNotFoundError(identifier);
          }
        });
      } else {
        throw new error.IllegalEntityError(entity);
      }
    }).then(doneCallback, failCallback);
  },

  /**
   * Make an instance managed and persistent.
   * @param {Object} entity - entity instance
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


  /**
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Boolean} refresh
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  refresh: function(entity, depth, doneCallback, failCallback) {
    throw new Error("Refresh is not yet implemented.");
  }
});