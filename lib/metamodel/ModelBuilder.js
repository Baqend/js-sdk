var BasicType = require('./BasicType').BasicType;
var EntityType = require('./EntityType').EntityType;
var EmbeddableType = require('./EmbeddableType').EmbeddableType;

var ListAttribute = require('./ListAttribute').ListAttribute;
var MapAttribute = require('./MapAttribute').MapAttribute;
var SetAttribute = require('./SetAttribute').SetAttribute;
var SingularAttribute = require('./SingularAttribute').SingularAttribute;

var PersistentError = require('../error').PersistentError;

/**
 * @class jspa.metamodel.ModelBuilder
 */
exports.ModelBuilder = ModelBuilder = Object.inherit( /** @lends jspa.metamodel.ModelBuilder.prototype */ {
  /**
   * @param {jspa.metamodel.Metamodel} metamodel
   */
  initialize: function() {
    this.models = {};

    for (var typeName in BasicType) {
      if (BasicType.hasOwnProperty(typeName)) {
        var basicType = BasicType[typeName];
        if (basicType instanceof BasicType) {
          this.models[basicType.identifier] = basicType;
        }
      }
    }
  },

  /**
   * @param {String} identifier
   * @returns {jspa.metamodel.EntityType}
   */
  getModel: function (identifier) {
    if (identifier in this.models) {
      return this.models[identifier];
    } else {
      return this.models[identifier] = this.buildModel(identifier);
    }
  },

  /**
   * @param {Object} modelDescriptors
   * @returns {jspa.metamodel.EntityType[]}
   */
  buildModels: function (modelDescriptors) {
    this.modelDescriptors = {};
    for (var i = 0, modelDescriptor; modelDescriptor = modelDescriptors[i]; ++i) {
      this.modelDescriptors[modelDescriptor['class']] = modelDescriptor;
    }

    for (var identifier in this.modelDescriptors) {
      try {
        var model = this.getModel(identifier);
        this.buildAttributes(model);
      } catch (e) {
        throw new PersistentError('Can\'t create model for entity class ' + identifier, e);
      }
    }

    //ensure at least an object entity
    this.getModel(EntityType.Object.identifier);

    return this.models;
  },

  /**
   * @param {String} identifier
   * @returns {jspa.metamodel.ManagedType}
   */
  buildModel: function (identifier) {
    if (identifier == EntityType.Object.identifier) {
      return new EntityType.Object();
    } else if (identifier in this.modelDescriptors) {
      var modelDescriptor = this.modelDescriptors[identifier];
      if (modelDescriptor) {
        if (modelDescriptor.embedded) {
          return new EmbeddableType(identifier)
        } else {
          var superTypeIdentifier = modelDescriptor['superClass'] || EntityType.Object.identifier;
          return new EntityType(identifier, this.getModel(superTypeIdentifier));
        }
      }
    } else {
      throw new TypeError('No model available for ' + identifier);
    }
  },

  /**
   * @param {jspa.metamodel.EntityType} model
   */
  buildAttributes: function (model) {
    var fields = this.modelDescriptors[model.identifier]['fields'];

    var attributes = model.declaredAttributes;
    for (var name in fields) {
      var field = fields[name];
      attributes.push(this.buildAttribute(model, field.name, field.type));
    }
  },

  /**
   * @param {jspa.metamodel.EntityType} model
   * @param {String} name
   * @param {String} identifier
   * @returns {jspa.metamodel.Attribute}
   */
  buildAttribute: function (model, name, identifier) {
    if (identifier.indexOf('/db/_native.collection') == 0) {
      var collectionType = identifier.substring(0, identifier.indexOf('['));

      var elementType = identifier.substring(identifier.indexOf('[') + 1, identifier.indexOf(']')).trim();
      switch (collectionType) {
        case '/db/_native.collection.List':
          return new ListAttribute(model, name, this.getModel(elementType));
        case '/db/_native.collection.Set':
          return new SetAttribute(model, name, this.getModel(elementType));
        case '/db/_native.collection.Map':
          var keyType = elementType.substring(0, elementType.indexOf(',')).trim();
          elementType = elementType.substring(elementType.indexOf(',') + 1).trim();

          return new MapAttribute(model, name, this.getModel(keyType), this.getModel(elementType));
        default:
          throw new TypeError('No collection available for ' + identifier);
      }
    } else {
      return new SingularAttribute(model, name, this.getModel(identifier));
    }
  }
});