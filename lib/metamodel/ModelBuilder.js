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
    } else if (identifier in this.modelDescriptors) {
      return this.models[identifier] = this.buildModel(this.modelDescriptors[identifier]);
    } else {
      throw new TypeError('No model available for ' + identifier);
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

    return this.models;
  },

  /**
   * @param {String} identifier
   * @returns {jspa.metamodel.EntityType}
   */
  buildModel: function (identifier) {
    var modelDescriptor = this.modelDescriptors[identifier];
    if (modelDescriptor) {
      var type;
      if (identifier == '/db/_native.Object') {
        type = new EntityType.Object();
      } else if (modelDescriptor.embedded) {
        type = new EmbeddableType(identifier)
      } else {
        var superTypeIdentifier = modelDescriptor['superClass'] || '/db/_native.Object';
        type = new EntityType(identifier, this.getModel(superTypeIdentifier));
      }

      return type;
    } else {
      return null;
    }
  },

  /**
   * @param {jspa.metamodel.EntityType} model
   * @returns {jspa.metamodel.Attribute[]}
   */
  buildAttributes: function (model) {
    if (model.identifier in this.models) {
      var fields = this.modelDescriptors[model.identifier]['fields'];

      var attributes = model.declaredAttributes;
      for (var i = 0, field; field = fields[i]; ++i) {
        attributes.push(this.buildAttribute(model, field.name, field.type));
      }

      return attributes;
    } else {
      return null;
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
          throw new TypeError('no collection available for ' + identifier);
      }
    } else {
      return new SingularAttribute(model, name, this.getModel(identifier));
    }
  }
});