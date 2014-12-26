var BasicType = require('./BasicType').BasicType;
var EntityType = require('./EntityType').EntityType;
var EmbeddableType = require('./EmbeddableType').EmbeddableType;

var ListAttribute = require('./ListAttribute').ListAttribute;
var MapAttribute = require('./MapAttribute').MapAttribute;
var SetAttribute = require('./SetAttribute').SetAttribute;
var SingularAttribute = require('./SingularAttribute').SingularAttribute;

var PersistentError = require('../error').PersistentError;

/**
 * @class baqend.metamodel.ModelBuilder
 */
exports.ModelBuilder = ModelBuilder = Object.inherit( /** @lends baqend.metamodel.ModelBuilder.prototype */ {

  /**
   * @type Object<string,baqend.metamodel.ManagedType>
   */
  models: null,

  /**
   * @type Object<string,Object>
   */
  modelDescriptors: null,

  /**
   * @param {baqend.metamodel.Metamodel} metamodel
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
   * @returns {baqend.metamodel.ManagedType}
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
   * @returns {Object<string,baqend.metamodel.ManagedType>}
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
   * @returns {baqend.metamodel.ManagedType}
   */
  buildModel: function (ref) {
    if (ref == EntityType.Object.ref) {
      return new EntityType.Object();
    } else if (ref in this.modelDescriptors) {
      var modelDescriptor = this.modelDescriptors[ref];

      if (modelDescriptor) {
        var type;
        if (modelDescriptor.embedded) {
          type = new EmbeddableType(ref)
        } else {
          var superTypeIdentifier = modelDescriptor['superClass'] || EntityType.Object.ref;
          type = new EntityType(ref, this.getModel(superTypeIdentifier));
        }

        var permissions = modelDescriptor['acl'];
        for (var permission in permissions) {
          type[permission + 'Permission'].fromJSON(permissions[permission]);
        }

        return type;
      }
    } else {
      throw new TypeError('No model available for ' + ref);
    }
  },

  /**
   * @param {baqend.metamodel.EntityType} model
   */
  buildAttributes: function (model) {
    var modelDescriptor = this.modelDescriptors[model.ref];
    var fields = modelDescriptor['fields'];

    var keys = [];
    for (var name in fields) {
      keys.push(name);
      var field = fields[name];
      model.addAttribute(this.buildAttribute(field.name, field.type));
    }

    if(modelDescriptor.validationCode) {
      model.validationCode = new Function(keys, modelDescriptor.validationCode);
    }
  },

  /**
   * @param {baqend.metamodel.EntityType} model
   * @param {String} name
   * @param {String} ref
   * @returns {baqend.metamodel.Attribute}
   */
  buildAttribute: function(name, ref) {
    if (ref.indexOf('/db/collection.') == 0) {
      var collectionType = ref.substring(0, ref.indexOf('['));

      var elementType = ref.substring(ref.indexOf('[') + 1, ref.indexOf(']')).trim();
      switch (collectionType) {
        case ListAttribute.ref:
          return new ListAttribute(name, this.getModel(elementType));
        case SetAttribute.ref:
          return new SetAttribute(name, this.getModel(elementType));
        case MapAttribute.ref:
          var keyType = elementType.substring(0, elementType.indexOf(',')).trim();
          elementType = elementType.substring(elementType.indexOf(',') + 1).trim();

          return new MapAttribute(name, this.getModel(keyType), this.getModel(elementType));
        default:
          throw new TypeError('No collection available for ' + ref);
      }
    } else {
      return new SingularAttribute(name, this.getModel(ref));
    }
  }
});