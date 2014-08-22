var uuid = require('node-uuid');

var util = require('./util');
var message = require('./message');
var error = require('./error');

var Q = require('q');
var EntityTransaction = require('./EntityTransaction').EntityTransaction;
var Query = require('./Query').Query;
var TypedQuery = require('./TypedQuery').TypedQuery;
var ObjectFactory = require('./binding').ObjectFactory;

/**
 * @class jspa.EntityManager
 * @extends jspa.util.QueueConnector
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
            value: ObjectFactory(entityType.typeConstructor, this),
            writable: false
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
   * @param {String=} oid
   */
  getReference: function(entityClass, oid) {
    var identifier, type;
    if (String.isInstance(entityClass)) {
      if (String.isInstance(oid)) {
        entityClass += '/' + oid;
      }

      identifier = entityClass;
      type = this.metamodel.entity(identifier.substring(0, identifier.lastIndexOf('/')));
    } else {
      type = this.metamodel.entity(entityClass);
      identifier = type.identifier + '/' + oid;
    }

    var entity = this._entities[identifier];
    if (!entity) {
      entity = type.create();
      this.setReference(identifier, entity);
      util.Metadata.get(entity._metadata).setUnavailable();
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
    var type = this.metamodel.entity(entity.constructor);
    return this._entities[type.id.getValue(entity)] === entity;
  },

  /**
   * Remove the given entity from the persistence context, causing a managed entity to become detached.
   * Unflushed changes made to the entity if any (including removal of the entity),
   * will not be synchronized to the database. Entities which previously referenced the detached entity will continue to reference it.
   * @param {Object} entity - entity instance
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

    if (state.isLoaded) {
      promise = Q(entity);
    } else {
      var tid = 0, identifier = state.type.id.getValue(entity);
      if (this.transaction.isChanged(identifier))
        tid = this.transaction.tid;

      promise = this._connector.send(new message.GetObject(tid)).then(function(message) {
        if (message.response.statusCode == 404) {
          state.setDeleted();
          this.removeReference(entity);
          entity = null;
        } else {
          state.setDatabaseObject(message.response.body);
          state.setPersistent();
        }

        return entity;
      }.bind(this));
    }

    return promise.then(doneCallback, failCallback);
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

  /**
   * Remove the entity instance.
   * @param {Object} entity - entity instance
   */
  remove: function(entity, doneCallback, failCallback) {
    //TODO: reimplement this
    return this.yield().then(function() {
      var state = util.Metadata.get(entity);
      if (state) {
        if (this.contains(entity)) {
          if (state.isNew) {
            this.removeReference(entity);
          } else {
            state.setDeleted();
          }
        }
      } else {
        var type = this.metamodel.entity(entity.constructor);
        if (type) {
          var identity = type.id.getValue(entity);
          if (identity) {
            throw new error.EntityExistsError(identity);
          }
        } else {
          throw new error.IllegalEntityError(entity);
        }
      }
    }).then(doneCallback, failCallback);
  },

  addReference: function(entity, depth) {
    if (!this.contains(entity)) {
      var type = this.metamodel.entity(entity.constructor);
      if (!type)
        throw new error.IllegalEntityError(entity);

      var identity = type.id.getValue(entity);
      if (identity)
        throw new error.EntityExistsError(identity);

      this.setReference(type.identifier + '/' + uuid.v4(), entity);
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
        throw new error.IllegalEntityError(entity);
      }
    } else {
      metadata.db = this;
    }

    metadata.type.id.setValue(entity, identifier);

    this._entities[identifier] = entity;
  },

  removeReference: function(entity) {
    var state = util.Metadata.get(entity);
    if (!state)
      throw new error.IllegalEntityError(entity);

    state.remove();

    delete this._entities[state.type.id.getValue(entity)];
  },

  /**
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Boolean} refresh
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  save: function(entity, refresh, depth, doneCallback, failCallback) {
    throw new Error("Save is not yet implemented.");
  },

  /**
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Boolean} refresh
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  insert: function(entity, refresh, depth, doneCallback, failCallback) {
    throw new Error("Insert is not yet implemented.");
  },

  /**
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Boolean} refresh
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  update: function(entity, refresh, depth, doneCallback, failCallback) {
    throw new Error("Update is not yet implemented.");
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
  },

  /**
   * @param {jspa.metamodel.ManagedType} entity
   * @param {Boolean} refresh
   * @param {(Number|Boolean)} depth
   * @param {Function} doneCallback
   * @param {Function} failCallback
   */
  remove: function(entity, refresh, depth, doneCallback, failCallback) {
    throw new Error("Remove is not yet implemented.");
  }

});