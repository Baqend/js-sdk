"use strict";

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
 * @memberOf baqend.metamodel
 * @extends baqend.util.Lockable
 */
class Metamodel extends Lockable {

  constructor() {
    super();

    /**
     * Defines if the Metamodel has been finalized
     * @type Boolean
     */
    this.isInitialized = false;

    /**
     * @type baqend.connector.Connector
     */
    this._connector = null;

    /**
     * @type Array.<baqend.metamodel.EntityType>
     */
    this.entities = null;

    /**
     * @type Array.<baqend.metamodel.EmbeddableType>
     */
    this.embeddables = null;

    /**
     * @type Array.<baqend.metamodel.BasicType>
     */
    this.baseTypes = null;

    this._enhancer = new Enhancer();
  }

  /**
   * Connects this instance with the given connector
   * @param {baqend.connector.Connector} connector
   */
  connected(connector) {
    this._connector = connector;
  }

  /**
   * Prepare the Metamodel for custom schema creation
   * @param {Object=} jsonMetamodel initialize the metamodel with the serialized json schema
   * @return {Promise<*>} A promise which will be resolved, if the metamodel is initialized
   */
  init(jsonMetamodel) {
    if (jsonMetamodel) {
      if (this.isInitialized) {
        throw new Error('Metamodel is already initialized.');
      }

      this.fromJSON(jsonMetamodel || []);
      this.isInitialized = true;
    } else if (!this.isInitialized && this.isReady) { // check if load has already been called
      return this.load();
    }

    return this.ready();
  }

  /**
   * @param {(Function|String)} arg
   * @return {String}
   */
  _getRef(arg) {
    var ref;
    if (Object(arg) instanceof String) {
      ref = arg;

      if (ref.indexOf('/db/') != 0) {
        ref = '/db/' + arg;
      }
    } else {
      ref = this._enhancer.getIdentifier(arg);
    }

    return ref;
  }

  /**
   * Return the metamodel entity type representing the entity.
   *
   * @param {(Function|String)} typeConstructor - the type of the represented entity
   * @returns {baqend.metamodel.EntityType} the metamodel entity type
   */
  entity(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.entities[ref] : null;
  }

  /**
   * Return the metamodel basic type representing the native class.
   * @param {(Function|String)} typeConstructor - the type of the represented native class
   * @returns {baqend.metamodel.BasicType} the metamodel basic type
   */
  baseType(typeConstructor) {
    var ref = null;
    if (Object(typeConstructor) instanceof String) {
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
  }

  /**
   * Return the metamodel embeddable type representing the embeddable class.
   * @param {(Function|String)} typeConstructor - the type of the represented embeddable class
   * @returns {baqend.metamodel.EmbeddableType} the metamodel embeddable type
   */
  embeddable(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.embeddables[ref] : null;
  }

  /**
   * Return the metamodel managed type representing the entity, mapped superclass, or embeddable class.
   *
   * @param {(Function|String)} typeConstructor - the type of the represented managed class
   * @returns {baqend.metamodel.Type} the metamodel managed type
   */
  managedType(typeConstructor) {
    return this.baseType(typeConstructor) || this.entity(typeConstructor) || this.embeddable(typeConstructor);
  }

  /**
   * @param {baqend.metamodel.Type} type
   * @return the added type
   */
  addType(type) {
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
  }

  /**
   * Load all schema data from the server
   * @returns {Promise<baqend.metamodel.Metamodel>}
   */
  load() {
    if(!this.isInitialized) {
      return this.withLock(function() {
        var msg = new message.GetAllSchemas();

        return this._connector.send(msg).then(function(message) {
          this.fromJSON(message.response.entity);
          this.isInitialized = true;
          return this;
        }.bind(this));
      }.bind(this));
    } else {
      throw new Error("Metamodel is already initialized.");
    }
  }

  /**
   * Store all local schema data on the server, or the provided one
   *
   * Note: The schema must be initialized, by init or load
   *
   * @param {baqend.metamodel.ManagedType=} managedType The specific type to persist, if omitted the complete schema will be updated
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @returns {Promise<baqend.metamodel.Metamodel>}
   */
  save(managedType, token) {
    if (!(managedType instanceof ManagedType)) {
      token = managedType;
      managedType = null;
    }

    return this._send(managedType || this.toJSON(), token).then(function() {
      return this;
    }.bind(this));
  }

  /**
   * The provided options object will be forwarded to the UpdateAllSchemas resource.
   * The underlying schema of this Metamodel object will be replaced by the result.
   *
   * @param {Object} data The JSON which will be send to the UpdateAllSchemas resource.
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @returns {Promise<baqend.metamodel.Metamodel>}
   */
  update(data, token) {
    return this._send(data, token).then(function(message) {
      this.fromJSON(message.response.entity);
      return this;
    }.bind(this))
  }

  _send(data, token) {
    if (!this.isInitialized)
      throw new Error("Metamodel is not initialized.");

    return this.withLock(function() {
      var msg;
      if(data instanceof ManagedType) {
        msg = new message.UpdateSchema(data.name, data.toJSON());
      } else {
        msg = new message.UpdateAllSchemas(data);
      }

      msg.withAuthorizationToken(token);

      return this._connector.send(msg);
    }.bind(this));
  }

  /**
   * Get the current schema types as json
   * @returns {object} the json data
   */
  toJSON() {
    var json = [];

    for (var ref in this.entities) {
      json.push(this.entities[ref]);
    }

    for (ref in this.embeddables) {
      json.push(this.embeddables[ref]);
    }

    return json;
  }

  /**
   * Replace the current schema by the provided one in json
   * @param json The json schema data
   */
  fromJSON(json) {
    var builder = new ModelBuilder();
    var models = builder.buildModels(json);

    this.baseTypes = {};
    this.embeddables = {};
    this.entities = {};

    for (var ref in models) {
      var type = models[ref];
      this.addType(type);
    }
  }

  /**
   * Creates an index
   *
   * @param {String} bucket Name of the Bucket
   * @param {baqend.metamodel.DbIndex} index Will be applied for the given bucket
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @return {Promise}
   */
  createIndex(bucket, index, token) {
    index.drop = false;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    msg.withAuthorizationToken(token);
    return this._connector.send(msg);
  }

  /**
   * Drops an index
   *
   * @param {String} bucket Name of the Bucket
   * @param {baqend.metamodel.DbIndex} index Will be dropped for the given bucket
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @return {Promise}
   */
  dropIndex(bucket, index, token) {
    index.drop = true;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    msg.withAuthorizationToken(token);
    return this._connector.send(msg);
  }

  /**
   * Drops all indexes
   *
   * @param bucket Indexes will be dropped for the given bucket
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @returns {Promise}
   */
  dropAllIndexes(bucket, token) {
    var msg = new message.DropAllIndexes(bucket);
    msg.withAuthorizationToken(token);
    return this._connector.send(msg);
  }

  /**
   * Loads all indexes for the given bucket
   *
   * @param bucket Current indexes will be loaded for the given bucket
   * @param {String=} token The authorization token to use, otherwise the global credentials will be used
   * @returns {Promise<Array<baqend.metamodel.DbIndex>>}
   */
  getIndexes(bucket, token) {
    var msg = new message.ListIndexes(bucket);
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function(data) {
      return data.response.entity.map(function(el) {
        return new DbIndex(el.keys, el.unique);
      });
    }, function(e) {
      if (e.status == StatusCode.BUCKET_NOT_FOUND || e.status == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    });
  }
}

module.exports = Metamodel;