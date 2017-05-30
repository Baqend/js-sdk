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
 * @alias metamodel.ModelBuilder
 */
class ModelBuilder {
  constructor() {
    /** @type Object<string,metamodel.ManagedType> */
    this.models = {};

    /** @type Object<string,Object> */
    this.modelDescriptors = null;

    for (let typeName of Object.keys(BasicType)) {
      let basicType = BasicType[typeName];
      if (basicType instanceof BasicType) {
        this.models[basicType.ref] = basicType;
      }
    }
  }

  /**
   * @param {string} ref
   * @returns {metamodel.ManagedType}
   */
  getModel (ref) {
    if (ref in this.models) {
      return this.models[ref];
    }

    return this.models[ref] = this.buildModel(ref);
  }

  /**
   * @param {Object[]} modelDescriptors
   * @returns {Object<string,metamodel.ManagedType>}
   */
  buildModels (modelDescriptors) {
    this.modelDescriptors = {};
    for (var i = 0, modelDescriptor; modelDescriptor = modelDescriptors[i]; ++i) {
      this.modelDescriptors[modelDescriptor['class']] = modelDescriptor;
    }

    for (let ref in this.modelDescriptors) {
      try {
        const model = this.getModel(ref);
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
   * @param {string} ref
   * @returns {metamodel.ManagedType}
   */
  buildModel (ref) {
    const modelDescriptor = this.modelDescriptors[ref];
    let type;
    if (ref === EntityType.Object.ref) {
      type = new EntityType.Object();
    } else if (modelDescriptor) {
      if (modelDescriptor.embedded) {
        type = new EmbeddableType(ref)
      } else {
        const superTypeIdentifier = modelDescriptor['superClass'] || EntityType.Object.ref;
        type = new EntityType(ref, this.getModel(superTypeIdentifier));
      }
    } else {
      throw new TypeError('No model available for ' + ref);
    }

    type.metadata = {};

    if (modelDescriptor) {
      type.metadata = modelDescriptor.metadata || {};
      const permissions = modelDescriptor['acl'];
      for (let permission in permissions) {
        type[permission + 'Permission'].fromJSON(permissions[permission]);
      }
    }

    return type;
  }

  /**
   * @param {metamodel.EntityType} model
   */
  buildAttributes (model) {
    const modelDescriptor = this.modelDescriptors[model.ref];
    const fields = modelDescriptor['fields'];

    for (let name in fields) {
      let field = fields[name];
      if (!model.getAttribute(name)) //skip predefined attributes
        model.addAttribute(this.buildAttribute(field), field.order);
    }

    if(modelDescriptor.validationCode) {
      model.validationCode = modelDescriptor.validationCode;
    }
  }

  /**
   * @param {{ name: string, type: string, order: number, metadata: Object<string,string>|undefined }} field
   * @returns {metamodel.Attribute}
   */
  buildAttribute(field) {
    const name = field.name;
    const ref = field.type;
    if (ref.indexOf('/db/collection.') !== 0) {
      const singularAttribute = new SingularAttribute(name, this.getModel(ref));
      singularAttribute.metadata = field.metadata;

      return singularAttribute;
    }
    const collectionType = ref.substring(0, ref.indexOf('['));
    let elementType = ref.substring(ref.indexOf('[') + 1, ref.indexOf(']')).trim();
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
  }
}

module.exports = ModelBuilder;
