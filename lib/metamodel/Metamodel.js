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
 * @alias metamodel.Metamodel
 * @extends util.Lockable
 */
class Metamodel extends Lockable {

  constructor(entityManagerFactory) {
    super();

    /**
     * Defines if the Metamodel has been finalized
     * @type boolean
     */
    this.isInitialized = false;

    /**
     * @type EntityManagerFactory
     */
    this.entityManagerFactory = entityManagerFactory;

    /**
     * @type Array.<metamodel.EntityType>
     */
    this.entities = null;

    /**
     * @type Array.<metamodel.EmbeddableType>
     */
    this.embeddables = null;

    /**
     * @type Array.<metamodel.BasicType>
     */
    this.baseTypes = null;

    this._enhancer = new Enhancer();
  }

  /**
   * Prepare the Metamodel for custom schema creation
   * @param {Object=} jsonMetamodel initialize the metamodel with the serialized json schema
   */
  init(jsonMetamodel) {
    if (this.isInitialized) {
      throw new Error('Metamodel is already initialized.');
    }

    this.fromJSON(jsonMetamodel || []);
    this.isInitialized = true;
  }

  /**
   * @param {(Class<binding.Managed>|string)} arg
   * @return {string}
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
   * @param {(Class<binding.Entity>|string)} typeConstructor - the type of the represented entity
   * @returns {metamodel.EntityType} the metamodel entity type
   */
  entity(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.entities[ref] : null;
  }

  /**
   * Return the metamodel basic type representing the native class.
   * @param {(Class<*>|string)} typeConstructor - the type of the represented native class
   * @returns {metamodel.BasicType} the metamodel basic type
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
   * @param {Class<binding.Managed>|string} typeConstructor - the type of the represented embeddable class
   * @returns {metamodel.EmbeddableType} the metamodel embeddable type
   */
  embeddable(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.embeddables[ref] : null;
  }

  /**
   * Return the metamodel managed type representing the entity, mapped superclass, or embeddable class.
   *
   * @param {(Class<binding.Managed>|string)} typeConstructor - the type of the represented managed class
   * @returns {metamodel.Type} the metamodel managed type
   */
  managedType(typeConstructor) {
    return this.baseType(typeConstructor) || this.entity(typeConstructor) || this.embeddable(typeConstructor);
  }

  /**
   * @param {metamodel.Type} type
   * @return {metamodel.Type} the added type
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
   * @returns {Promise<metamodel.Metamodel>}
   */
  load() {
    if(!this.isInitialized) {
      return this.withLock(() => {
        var msg = new message.GetAllSchemas();

        return this.entityManagerFactory.send(msg).then((response) => {
          this.init(response.entity);
          return this;
        });
      });
    } else {
      throw new Error("Metamodel is already initialized.");
    }
  }

  /**
   * Store all local schema data on the server, or the provided one
   *
   * Note: The schema must be initialized, by init or load
   *
   * @param {metamodel.ManagedType=} managedType The specific type to persist, if omitted the complete schema will be updated
   * @returns {Promise<metamodel.Metamodel>}
   */
  save(managedType) {
    return this._send(managedType || this.toJSON()).then(() => {
      return this;
    });
  }

  /**
   * The provided options object will be forwarded to the UpdateAllSchemas resource.
   * The underlying schema of this Metamodel object will be replaced by the result.
   *
   * @param {json} data The JSON which will be send to the UpdateAllSchemas resource.
   * @returns {Promise<metamodel.Metamodel>}
   */
  update(data) {
    return this._send(data).then((response) => {
      this.fromJSON(response.entity);
      return this;
    });
  }

  _send(data) {
    if (!this.isInitialized)
      throw new Error("Metamodel is not initialized.");

    return this.withLock(() => {
      var msg;
      if(data instanceof ManagedType) {
        msg = new message.UpdateSchema(data.name, data.toJSON());
      } else {
        msg = new message.UpdateAllSchemas(data);
      }

      return this.entityManagerFactory.send(msg);
    });
  }

  /**
   * Get the current schema types as json
   * @returns {json} the json data
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
   * @param {json} json The json schema data
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
   * @param {string} bucket Name of the Bucket
   * @param {metamodel.DbIndex} index Will be applied for the given bucket
   * @return {Promise<*>}
   */
  createIndex(bucket, index) {
    index.drop = false;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    return this.entityManagerFactory.send(msg);
  }

  /**
   * Drops an index
   *
   * @param {string} bucket Name of the Bucket
   * @param {metamodel.DbIndex} index Will be dropped for the given bucket
   * @return {Promise<*>}
   */
  dropIndex(bucket, index) {
    index.drop = true;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    return this.entityManagerFactory.send(msg);
  }

  /**
   * Drops all indexes
   *
   * @param {string} bucket Indexes will be dropped for the given bucket
   * @returns {Promise<*>}
   */
  dropAllIndexes(bucket) {
    var msg = new message.DropAllIndexes(bucket);
    return this.entityManagerFactory.send(msg);
  }

  /**
   * Loads all indexes for the given bucket
   *
   * @param {string} bucket Current indexes will be loaded for the given bucket
   * @returns {Promise<Array<metamodel.DbIndex>>}
   */
  getIndexes(bucket) {
    var msg = new message.ListIndexes(bucket);
    return this.entityManagerFactory.send(msg).then((response) => {
      return response.entity.map(function(el) {
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