var BasicType = require('./BasicType').BasicType;
var ManagedType = require('./ManagedType').ManagedType;
var EntityType = require('./EntityType').EntityType;
var ClassFactory = require('../binding').ClassFactory;
var ModelBuilder = require('./ModelBuilder').ModelBuilder;

var message = require('../message');

/**
 * @class jspa.metamodel.Metamodel
 */
exports.Metamodel = Metamodel = Object.inherit(/** @lends jspa.metamodel.Metamodel.prototype */ {

  /**
   * Defines if the Metamodel has been finalized
   * @type boolean
   * @private
   */
  _isFinalized: false,

  /**
   * @type jspa.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @type Array.<jspa.metamodel.EntityType>
   * @private
   */
  _entities: null,

  /**
   * @type Array.<jspa.metamodel.EmbeddableType>
   * @private
   */
  _embeddables: null,

  /**
   * @type Array.<jspa.metamodel.BasicType>
   * @private
   */
  _baseTypes: null,

  /**
   * @param {jspa.connector.Connector} connector
   */
  initialize: function(connector) {
    this._connector = connector;

    this._classFactory = new ClassFactory();
  },

  /**
   * Prepare the Metamodel for custom schema creation
   */
  init: function() {
    if (this._entities) {
      throw new Error('Metamodel is already initialized.');
    }

    this.fromJSON([]);
  },

  /**
   * @param {(Function|String)} arg
   * @return {String}
   */
  identifierArg: function(arg) {
    var identifier;
    if (String.isInstance(arg)) {
      identifier = arg;

      if (identifier.indexOf('/db/') != 0) {
        identifier = '/db/' + arg;
      }
    } else {
      identifier = this._classFactory.getIdentifier(arg);
    }

    return identifier;
  },

  /**
   * Return the metamodel entity type representing the entity.
   *
   * @param {(Function|String)} typeConstructor - the type of the represented entity
   * @returns {jspa.metamodel.EntityType} the metamodel entity type
   */
  entity: function(typeConstructor) {
    var identifier = this.identifierArg(typeConstructor);
    return identifier ? this._entities[identifier] : null;
  },

  /**
   * Return the metamodel basic type representing the native class.
   * @param {(Function|String)} typeConstructor - the type of the represented native class
   * @returns {jspa.metamodel.BasicType} the metamodel basic type
   */
  baseType: function(typeConstructor) {
    var identifier = null;
    if (String.isInstance(typeConstructor) && typeConstructor.indexOf('_native.') == -1) {
      identifier = '/db/_native.' + typeConstructor;
    } else if (String.isInstance(typeConstructor)) {
      identifier = this.identifierArg(typeConstructor);
    } else {
      for (var name in this._baseTypes) {
        var type = this._baseTypes[name];
        if (!type.noResolving && type.typeConstructor == typeConstructor) {
          identifier = name;
          break;
        }
      }
    }

    return identifier ? this._baseTypes[identifier] : null;
  },

  /**
   * Return the metamodel embeddable type representing the embeddable class.
   * @param {(Function|String)} typeConstructor - the type of the represented embeddable class
   * @returns {jspa.metamodel.EmbeddableType} the metamodel embeddable type
   */
  embeddable: function(typeConstructor) {
    var identifier = this.identifierArg(typeConstructor);
    return identifier ? this._embeddables[identifier] : null;
  },

  /**
   * Return the metamodel managed type representing the entity, mapped superclass, or embeddable class.
   *
   * @param {(Function|String)} typeConstructor - the type of the represented managed class
   * @returns {jspa.metamodel.Type} the metamodel managed type
   */
  managedType: function(typeConstructor) {
    return this.baseType(typeConstructor) || this.entity(typeConstructor) || this.embeddable(typeConstructor);
  },

  /**
   * @param {jspa.metamodel.Type} type
   * @return the added type
   */
  addType: function(type) {
    var types;

    if (type.isBasic) {
      types = this._baseTypes;
    } else if (type.isEmbeddable) {
      type.init(this._classFactory);
      types = this._embeddables;
    } else if (type.isEntity) {
      type.init(this._classFactory);
      types = this._entities;

      if (type.superType == null && type.identifier != EntityType.Object.identifier) {
        type.superType = this.entity(EntityType.Object.identifier);
      }
    }

    if (types[type.identifier]) {
      throw new Error("The type " + type.identifier + " is already declared.");
    }

    return types[type.identifier] = type;
  },

  /**
   * Load all schema data from the server
   * @param {Function=} doneCallback
   * @param {function=} failCallback
   * @returns {Q.Promise<jspa.metamodel.Metamodel>}
   */
  load: function(doneCallback, failCallback) {
    if(!this._saveLoadPromise && !this._isFinalized) {
      var msg = new message.GetAllSchemas();
      return this._saveLoadPromise = this._connector.send(msg).then(function(message) {
        this.fromJSON(message.response.entity);
        return this;
      }.bind(this)).then(doneCallback, failCallback);
    } else {
      throw new Error("Metamodel has already been set.")
    }
  },

  /**
   * Store all local schema data on the server, or the provided one
   * @param {jspa.metamodel.ManagedType=} managedType
   * @param {Function=} doneCallback
   * @param {function=} failCallback
   * @returns {Q.Promise<jspa.metamodel.Metamodel>}
   */
  save: function(managedType, doneCallback, failCallback) {
    if (this._isFinalized) {
      throw new Error("Metamodel is already used by an EntityManager instance")
    }

    if (Function.isInstance(managedType)) {
      failCallback = doneCallback;
      doneCallback = managedType;
      managedType = null;
    }

    var msg;
    if (managedType) {
      msg = new message.ReplaceSchema(managedType.name, managedType.toJSON());
    } else {
      msg = new message.ReplaceAllSchemas(this.toJSON());
    }

    if (this._saveLoadPromise) {
      this._saveLoadPromise = this._saveLoadPromise.then(function() {
        return this._connector.send(msg);
      }.bind(this));
    } else {
      this._saveLoadPromise = this._connector.send(msg);
    }

    return this._saveLoadPromise.then(function(message) {
      return this;
    }).then(doneCallback, failCallback);
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

    for (var identifier in this._entities) {
      json.push(this._entities[identifier].toJSON());
    }

    for (identifier in this._embeddables) {
      json.push(this._embeddables[identifier].toJSON());
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

    for (var identifier in models) {
      var type = models[identifier];
      this.addType(type);
    }
  }
});