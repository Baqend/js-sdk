var BasicType = require('./BasicType').BasicType;
var EntityType = require('./EntityType').EntityType;
var ClassUtil = require('../binding').ClassUtil;
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

    this.classUtil = new ClassUtil();
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
      identifier = this.classUtil.getIdentifier(arg);
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
    if (String.isInstance(typeConstructor) && typeConstructor.indexOf('_native.') == -1)
      typeConstructor = '/db/_native.' + typeConstructor;

    var identifier = this.identifierArg(typeConstructor);
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
  managedType: function (typeConstructor) {
    return this.baseType(typeConstructor) || this.entity(typeConstructor) || this.embeddable(typeConstructor);
  },

  addType: function (type) {
    var types;

    if (type.isBasic) {
      types = this.baseTypes;
    } else if (type.isEmbeddable) {
      types = this.embeddables;
    } else if (type.isEntity) {
      types = this.entities;
    }

    if (!(type.identifier in types)) {
      type.init(this.classUtil);
      types[type.identifier] = type;
    }
  },

  /**
   * Load all schema data from the server
   * @returns {jspa.Promise}
   */
  load: function() {
    return this.connector.send(this, new message.GetDbSchema()).then(function(message) {
      this.fromJSON(message.response.entity);
      return this;
    });
  },

  /**
   * Store all local schema data on the server
   * @returns {jspa.Promise}
   */
  store: function() {
    return this.connector.send(this, new message.PutDbSchema(this.toJSON())).then(function(message) {
      this.fromJSON(message.response.entity);
      return this;
    });
  },

  /**
   * Get the current schema types as json
   * @returns {object} the json data
   */
  toJSON: function() {
    var json = [];

    for (var entity in this.entities) {
      json.push(entity.toJSON());
    }

    for (var embedded in this.embeddables) {
      json.push(embedded.toJSON());
    }

    return json;
  },

  /**
   * Restore the schema types form json
   * @param json The json data
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