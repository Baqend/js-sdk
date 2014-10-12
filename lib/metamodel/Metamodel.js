var BasicType = require('./BasicType').BasicType;
var ManagedType = require('./ManagedType').ManagedType;
var EntityType = require('./EntityType').EntityType;
var Enhancer = require('../binding').Enhancer;
var ModelBuilder = require('./ModelBuilder').ModelBuilder;
var Q = require('q');

var message = require('../message');

/**
 * @class baqend.metamodel.Metamodel
 */
exports.Metamodel = Metamodel = Object.inherit(/** @lends baqend.metamodel.Metamodel.prototype */ {

  /**
   * Defines if the Metamodel has been finalized
   * @type boolean
   * @private
   */
  _isFinalized: false,

  /**
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @type Array.<baqend.metamodel.EntityType>
   * @private
   */
  _entities: null,

  /**
   * @type Array.<baqend.metamodel.EmbeddableType>
   * @private
   */
  _embeddables: null,

  /**
   * @type Array.<baqend.metamodel.BasicType>
   * @private
   */
  _baseTypes: null,

  /**
   * @param {baqend.connector.Connector} connector
   */
  initialize: function(connector) {
    this._connector = connector;

    this._enhancer = new Enhancer();
  },

  /**
   * Prepare the Metamodel for custom schema creation
   */
  init: function(jsonMetamodel) {
    if (this._entities) {
      throw new Error('Metamodel is already initialized.');
    }

    this.fromJSON(jsonMetamodel || []);
    this._saveLoadPromise = Q(this);
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
    return ref ? this._entities[ref] : null;
  },

  /**
   * Return the metamodel basic type representing the native class.
   * @param {(Function|String)} typeConstructor - the type of the represented native class
   * @returns {baqend.metamodel.BasicType} the metamodel basic type
   */
  baseType: function(typeConstructor) {
    var ref = null;
    if (String.isInstance(typeConstructor) && typeConstructor.indexOf('_native.') == -1) {
      ref = '/db/_native.' + typeConstructor;
    } else if (String.isInstance(typeConstructor)) {
      ref = this._getRef(typeConstructor);
    } else {
      for (var name in this._baseTypes) {
        var type = this._baseTypes[name];
        if (!type._noResolving && type.typeConstructor == typeConstructor) {
          ref = name;
          break;
        }
      }
    }

    return ref ? this._baseTypes[ref] : null;
  },

  /**
   * Return the metamodel embeddable type representing the embeddable class.
   * @param {(Function|String)} typeConstructor - the type of the represented embeddable class
   * @returns {baqend.metamodel.EmbeddableType} the metamodel embeddable type
   */
  embeddable: function(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this._embeddables[ref] : null;
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
      types = this._baseTypes;
    } else if (type.isEmbeddable) {
      type.init(this._enhancer);
      types = this._embeddables;
    } else if (type.isEntity) {
      type.init(this._enhancer);
      types = this._entities;

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
   * @param {Boolean|String=} globalCredentialsOrToken
   * @returns {Q.Promise<baqend.metamodel.Metamodel>}
   */
  load: function() {
    if(!this._saveLoadPromise && !this._isFinalized) {
      var msg = new message.GetAllSchemas();

      return this._saveLoadPromise = this._connector.send(msg).then(function(message) {
        this.fromJSON(message.response.entity);
        return this;
      }.bind(this));
    } else {
      throw new Error("Metamodel has already been set.")
    }
  },

  /**
   * Store all local schema data on the server, or the provided one
   * @param {baqend.metamodel.ManagedType=} managedType
   * @param {Boolean=} forceReplace
   * @param {Boolean|String=} globalCredentialsOrToken
   * @returns {Q.Promise<baqend.metamodel.Metamodel>}
   */
  save: function(managedType, forceReplace, globalCredentialsOrToken) {
    if (this._isFinalized)
      throw new Error("Metamodel is already used by an EntityManager instance.");

    if (!this._saveLoadPromise)
      throw new Error("Metamodel is not initialized.");

    if (!ManagedType.isInstance(managedType)) {
      globalCredentialsOrToken = forceReplace;
      forceReplace = managedType;
      managedType = null;
    }

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

    msg.withAuthorizationToken(globalCredentialsOrToken);

    this._saveLoadPromise = this._saveLoadPromise.then(function() {
      return this._connector.send(msg);
    }.bind(this)).thenResolve(this);

    return this._saveLoadPromise;
  },

  /**
   * @returns {Q.promise}
   */
  ready: function() {
    if (!this._saveLoadPromise) {
      this.load();
    }

    return this._saveLoadPromise;
  },

  /**
   * Finalizes the Metamodel instance.
   * A Metamodel is only allowed to be used by one instance of an EntityManager
   */
  finalize: function() {
    this._isFinalized = true;
  },

  /**
   * Get the current schema types as json
   * @returns {object} the json data
   */
  toJSON: function() {
    var json = [];

    for (var ref in this._entities) {
      json.push(this._entities[ref]);
    }

    for (ref in this._embeddables) {
      json.push(this._embeddables[ref]);
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

    this._baseTypes = {};
    this._embeddables = {};
    this._entities = {};

    for (var ref in models) {
      var type = models[ref];
      this.addType(type);
    }
  }
});