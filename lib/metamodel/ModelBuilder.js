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
exports.ModelBuilder = ModelBuilder = Object.inherit(
    /**
     * @lends jspa.metamodel.ModelBuilder.prototype
     */
    {
  /**
   * @param {jspa.metamodel.Metamodel} metamodel
   */
  initialize: function (metamodel) {
    this.metamodel = metamodel;
    this.objectType = metamodel.entity(Object);
  },

  /**
   * @param {String} identifier
   * @returns {jspa.metamodel.EntityType}
   */
  getModel: function (identifier) {
    var model = null;
    if (identifier.indexOf('/db/_native') == 0) {
      model = this.metamodel.baseType(identifier);
    } else {
      model = this.metamodel.entity(identifier);
      if (!model) {
        model = this.metamodel.embeddable(identifier);
      }

      if (!model && identifier in this.models) {
        model = this.models[identifier];
      }

      if (!model) {
        model = this.buildModel(identifier);
      }
    }

    if (model) {
      return model;
    } else {
      throw new TypeError('no model available for ' + identifier);
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

    this.models = {};
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
      var superTypeIdentifier = modelDescriptor['superClass'];
      var superType = superTypeIdentifier ? this.getModel(superTypeIdentifier) : this.objectType;

      var type;
      if (modelDescriptor.embedded) {
        type = new EmbeddableType(identifier)
      } else {
        type = new EntityType(identifier, superType);
      }

      this.models[identifier] = type;
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