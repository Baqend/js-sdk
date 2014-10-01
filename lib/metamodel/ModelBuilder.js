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
   * @type Object<string,jspa.metamodel.ManagedType>
   */
  models: null,

  /**
   * @param {jspa.metamodel.Metamodel} metamodel
   */
  initialize: function() {
    this.models = {};

    for (var typeName in BasicType) {
      if (BasicType.hasOwnProperty(typeName)) {
        var basicType = BasicType[typeName];
        if (basicType instanceof BasicType) {
          this.models[basicType.ref] = basicType;
        }
      }
    }
  },

  /**
   * @param {String} ref
   * @returns {jspa.metamodel.ManagedType}
   */
  getModel: function (ref) {
    if (ref in this.models) {
      return this.models[ref];
    } else {
      return this.models[ref] = this.buildModel(ref);
    }
  },

  /**
   * @param {Object} modelDescriptors
   * @returns {Object<string,jspa.metamodel.ManagedType>}
   */
  buildModels: function (modelDescriptors) {
    this.modelDescriptors = {};
    for (var i = 0, modelDescriptor; modelDescriptor = modelDescriptors[i]; ++i) {
      this.modelDescriptors[modelDescriptor['class']] = modelDescriptor;
    }

    for (var ref in this.modelDescriptors) {
      try {
        var model = this.getModel(ref);
        this.buildAttributes(model);
      } catch (e) {
        throw new PersistentError('Can\'t create model for entity class ' + ref, e);
      }
    }

    //ensure at least an object entity
    this.getModel(EntityType.Object.ref);

    return this.models;
  },

  /**
   * @param {String} ref
   * @returns {jspa.metamodel.ManagedType}
   */
  buildModel: function (ref) {
    if (ref == EntityType.Object.ref) {
      return new EntityType.Object();
    } else if (ref in this.modelDescriptors) {
      var modelDescriptor = this.modelDescriptors[ref];
      if (modelDescriptor) {
        if (modelDescriptor.embedded) {
          return new EmbeddableType(ref)
        } else {
          var superTypeIdentifier = modelDescriptor['superClass'] || EntityType.Object.ref;
          return new EntityType(ref, this.getModel(superTypeIdentifier));
        }
      }
    } else {
      throw new TypeError('No model available for ' + ref);
    }
  },

  /**
   * @param {jspa.metamodel.EntityType} model
   */
  buildAttributes: function (model) {
    var fields = this.modelDescriptors[model.ref]['fields'];

    var attributes = model.declaredAttributes;
    for (var name in fields) {
      var field = fields[name];
      attributes.push(this.buildAttribute(model, field.name, field.type));
    }
  },

  /**
   * @param {jspa.metamodel.EntityType} model
   * @param {String} name
   * @param {String} ref
   * @returns {jspa.metamodel.Attribute}
   */
  buildAttribute: function (model, name, ref) {
    if (ref.indexOf('/db/_native.collection') == 0) {
      var collectionType = ref.substring(0, ref.indexOf('['));

      var elementType = ref.substring(ref.indexOf('[') + 1, ref.indexOf(']')).trim();
      switch (collectionType) {
        case ListAttribute.ref:
          return new ListAttribute(model, name, this.getModel(elementType));
        case SetAttribute.ref:
          return new SetAttribute(model, name, this.getModel(elementType));
        case MapAttribute.ref:
          var keyType = elementType.substring(0, elementType.indexOf(',')).trim();
          elementType = elementType.substring(elementType.indexOf(',') + 1).trim();

          return new MapAttribute(model, name, this.getModel(keyType), this.getModel(elementType));
        default:
          throw new TypeError('No collection available for ' + ref);
      }
    } else {
      return new SingularAttribute(model, name, this.getModel(ref));
    }
  }
});