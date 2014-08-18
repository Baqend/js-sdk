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
   * @param {jspa.connector.Connector} connector
   */
  initialize: function(connector) {
    this.baseTypes = {};
    this.entities = {};
    this.embeddables = {};
    this.connector = connector;
    this.usedBy = [];

    this.classFactory = new ClassFactory();
  },

  /**
   * @param {(Function|String)} arg
   * @return {String}
   */
  identifierArg: function (arg) {
    var identifier;
    if (String.isInstance(arg)) {
      identifier = arg;

      if (identifier.indexOf('/db/') != 0) {
        identifier = '/db/' + arg;
      }
    } else {
      identifier = this.classFactory.getIdentifier(arg);
    }

    return identifier;
  },

  /**
   * Return the metamodel entity type representing the entity.
   *
   * @param {(Function|String)} typeConstructor - the type of the represented entity
   * @returns {jspa.metamodel.EntityType} the metamodel entity type
   */
  entity: function (typeConstructor) {
    var identifier = this.identifierArg(typeConstructor);
    return identifier ? this.entities[identifier] : null;
  },

  /**
   * Return the metamodel basic type representing the native class.
   * @param {(Function|String)} typeConstructor - the type of the represented native class
   * @returns {jspa.metamodel.BasicType} the metamodel basic type
   */
  baseType: function (typeConstructor) {
    var identifier = null;
    if (String.isInstance(typeConstructor) && typeConstructor.indexOf('_native.') == -1) {
      identifier = '/db/_native.' + typeConstructor;
    } else if (String.isInstance(typeConstructor)) {
      identifier = this.identifierArg(typeConstructor);
    } else {
      for (var name in this.baseTypes) {
        var type = this.baseTypes[name];
        if (!type.noResolving && type.typeConstructor == typeConstructor) {
          identifier = name;
          break;
        }
      }
    }

    return identifier ? this.baseTypes[identifier] : null;

  },

  /**
   * Return the metamodel embeddable type representing the embeddable class.
   * @param {(Function|String)} typeConstructor - the type of the represented embeddable class
   * @returns {jspa.metamodel.EmbeddableType} the metamodel embeddable type
   */
  embeddable: function (typeConstructor) {
    var identifier = this.identifierArg(typeConstructor);
    return identifier ? this.embeddables[identifier] : null;
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
      types = this.baseTypes;
    } else if (type.isEmbeddable) {
      type.init(this.classFactory);
      types = this.embeddables;
    } else if (type.isEntity) {
      type.init(this.classFactory);
      types = this.entities;

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
    if(!this._saveLoadPromise && !this.usedBy.length) {
      var msg = new message.GetDbSchema();
      return this._saveLoadPromise = this.connector.send(this, msg).then(function(message) {
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
   * @returns {jspa.Promise}
   */
  save: function(managedType, doneCallback, failCallback) {
    if (this.usedBy.length) {
      throw new Error("Metamodel is already used by an EntityManager instance")
    }

    if (Function.isInstance(managedType)) {
      failCallback = doneCallback;
      doneCallback = managedType;
      managedType = null;
    }

    var msg;
    if (managedType) {
      msg = new message.PutDbSchemaBucket(managedType.name, managedType.toJSON());
    } else {
      msg = new message.PutDbSchema(this.toJSON());
    }

    if(this._saveLoadPromise) {
      this._saveLoadPromise = this._saveLoadPromise.then(function() {
        return this.connector.send(this, msg);
      }.bind(this));
    } else {
      this._saveLoadPromise = this.connector.send(this, msg);
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
   * Get the current schema types as json
   * @returns {object} the json data
   */
  toJSON: function() {
    var json = [];

    for (var identifier in this.entities) {
      json.push(this.entities[identifier].toJSON());
    }

    for (identifier in this.embeddables) {
      json.push(this.embeddables[identifier].toJSON());
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

    for (var identifier in models) {
      var type = models[identifier];
      this.addType(type);
    }
  }
});