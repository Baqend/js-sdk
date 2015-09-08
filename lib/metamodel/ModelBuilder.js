"use strict";

var BasicType = require('./BasicType');
var EntityType = require('./EntityType');
var EmbeddableType = require('./EmbeddableType');

var ListAttribute = require('./ListAttribute');
var MapAttribute = require('./MapAttribute');
var SetAttribute = require('./SetAttribute');
var SingularAttribute = require('./SingularAttribute');

var PersistentError = require('../error/PersistentError');

/**
 * @class baqend.metamodel.ModelBuilder
 */
class ModelBuilder {
  /**
   * @param {baqend.metamodel.Metamodel} metamodel
   */
  constructor() {
    /** @type Object<string,baqend.metamodel.ManagedType> */
    this.models = {};

    /** @type Object<string,Object> */
    this.modelDescriptors = null;

    for (let typeName of Object.getOwnPropertyNames(BasicType)) {
      let basicType = BasicType[typeName];
      if (basicType instanceof BasicType) {
        this.models[basicType.ref] = basicType;
      }
    }
  }

  /**
   * @param {String} ref
   * @returns {baqend.metamodel.ManagedType}
   */
  getModel (ref) {
    if (ref in this.models) {
      return this.models[ref];
    } else {
      return this.models[ref] = this.buildModel(ref);
    }
  }

  /**
   * @param {Object[]} modelDescriptors
   * @returns {Object<string,baqend.metamodel.ManagedType>}
   */
  buildModels (modelDescriptors) {
    this.modelDescriptors = {};
    for (var i = 0, modelDescriptor; modelDescriptor = modelDescriptors[i]; ++i) {
      this.modelDescriptors[modelDescriptor['class']] = modelDescriptor;
    }

    for (let ref in this.modelDescriptors) {
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
  }

  /**
   * @param {String} ref
   * @returns {baqend.metamodel.ManagedType}
   */
  buildModel (ref) {
    var modelDescriptor = this.modelDescriptors[ref];
    var type;
    if (ref == EntityType.Object.ref) {
      type = new EntityType.Object();
    } else if (modelDescriptor) {
      if (modelDescriptor.embedded) {
        type = new EmbeddableType(ref)
      } else {
        var superTypeIdentifier = modelDescriptor['superClass'] || EntityType.Object.ref;
        type = new EntityType(ref, this.getModel(superTypeIdentifier));
      }
    } else {
      throw new TypeError('No model available for ' + ref);
    }

    if (modelDescriptor) {
      var permissions = modelDescriptor['acl'];
      for (var permission in permissions) {
        type[permission + 'Permission'].fromJSON(permissions[permission]);
      }
    }

    return type;
  }

  /**
   * @param {baqend.metamodel.EntityType} model
   */
  buildAttributes (model) {
    var modelDescriptor = this.modelDescriptors[model.ref];
    var fields = modelDescriptor['fields'];

    for (let name in fields) {
      let field = fields[name];
      if (!model.getAttribute(name)) //skip predefined attributes
        model.addAttribute(this.buildAttribute(field.name, field.type), field.order);
    }

    if(modelDescriptor.validationCode) {
      model.validationCode = modelDescriptor.validationCode;
    }
  }

  /**
   * @param {baqend.metamodel.EntityType} model
   * @param {String} name
   * @param {String} ref
   * @returns {baqend.metamodel.Attribute}
   */
  buildAttribute(name, ref) {
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
}

module.exports = ModelBuilder;