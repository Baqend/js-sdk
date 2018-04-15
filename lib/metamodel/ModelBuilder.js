'use strict';

const BasicType = require('./BasicType');
const EntityType = require('./EntityType');
const EmbeddableType = require('./EmbeddableType');

const ListAttribute = require('./ListAttribute');
const MapAttribute = require('./MapAttribute');
const SetAttribute = require('./SetAttribute');
const SingularAttribute = require('./SingularAttribute');

const PersistentError = require('../error/PersistentError');

/**
 * @alias metamodel.ModelBuilder
 */
class ModelBuilder {
  constructor() {
    /** @type Object<string,metamodel.ManagedType> */
    this.models = {};

    /** @type Object<string,Object> */
    this.modelDescriptors = null;

    Object.keys(BasicType).forEach((typeName) => {
      const basicType = BasicType[typeName];
      if (basicType instanceof BasicType) {
        this.models[basicType.ref] = basicType;
      }
    });
  }

  /**
   * @param {string} ref
   * @returns {metamodel.ManagedType}
   */
  getModel(ref) {
    if (ref in this.models) {
      return this.models[ref];
    }

    const model = this.buildModel(ref);
    this.models[ref] = model;
    return model;
  }

  /**
   * @param {Object[]} modelDescriptors
   * @returns {Object<string,metamodel.ManagedType>}
   */
  buildModels(modelDescriptors) {
    this.modelDescriptors = {};

    modelDescriptors.forEach((modelDescriptor) => {
      this.modelDescriptors[modelDescriptor.class] = modelDescriptor;
    });

    Object.keys(this.modelDescriptors).forEach((ref) => {
      try {
        const model = this.getModel(ref);
        this.buildAttributes(model);
      } catch (e) {
        throw new PersistentError('Can\'t create model for entity class ' + ref, e);
      }
    });

    // ensure at least an object entity
    this.getModel(EntityType.Object.ref);

    return this.models;
  }

  /**
   * @param {string} ref
   * @returns {metamodel.ManagedType}
   */
  buildModel(ref) {
    const modelDescriptor = this.modelDescriptors[ref];
    let type;
    if (ref === EntityType.Object.ref) {
      type = new EntityType.Object();
    } else if (modelDescriptor) {
      if (modelDescriptor.embedded) {
        type = new EmbeddableType(ref);
      } else {
        const superTypeIdentifier = modelDescriptor.superClass || EntityType.Object.ref;
        type = new EntityType(ref, this.getModel(superTypeIdentifier));
      }
    } else {
      throw new TypeError('No model available for ' + ref);
    }

    type.metadata = {};

    if (modelDescriptor) {
      type.metadata = modelDescriptor.metadata || {};
      const permissions = modelDescriptor.acl || {};
      Object.keys(permissions).forEach((permission) => {
        type[permission + 'Permission'].fromJSON(permissions[permission]);
      });
    }

    return type;
  }

  /**
   * @param {metamodel.EntityType} model
   */
  buildAttributes(model) {
    const modelDescriptor = this.modelDescriptors[model.ref];
    const fields = modelDescriptor.fields;

    Object.keys(fields).forEach((name) => {
      const field = fields[name];
      if (!model.getAttribute(name)) { // skip predefined attributes
        model.addAttribute(this.buildAttribute(field), field.order);
      }
    });

    if (modelDescriptor.validationCode) {
      model.validationCode = modelDescriptor.validationCode;
    }
  }

  /**
   * @param {Object} field The field metadata
   * @param {string} field.name The name of zhe field
   * @param {string} field.type The type reference of the field
   * @param {number} field.order The order number of the field
   * @param {Object<string,*>} field.metadata Additional metadata of the field
   * @returns {metamodel.Attribute}
   */
  buildAttribute(field) {
    // TODO: remove readonly if createdAt and updatedAt becomes real metadata fields in the schema
    const isMetadata = field.flags && (field.flags.indexOf('METADATA') !== -1 || field.flags.indexOf('READONLY') !== -1);
    const name = field.name;
    const ref = field.type;
    if (ref.indexOf('/db/collection.') !== 0) {
      const singularAttribute = new SingularAttribute(name, this.getModel(ref), isMetadata);
      singularAttribute.metadata = field.metadata;
      return singularAttribute;
    }
    const collectionType = ref.substring(0, ref.indexOf('['));
    const elementType = ref.substring(ref.indexOf('[') + 1, ref.indexOf(']')).trim();

    switch (collectionType) {
      case ListAttribute.ref:
        return new ListAttribute(name, this.getModel(elementType));
      case SetAttribute.ref:
        return new SetAttribute(name, this.getModel(elementType));
      case MapAttribute.ref: {
        const keyType = elementType.substring(0, elementType.indexOf(',')).trim();
        const valueType = elementType.substring(elementType.indexOf(',') + 1).trim();

        return new MapAttribute(name, this.getModel(keyType), this.getModel(valueType));
      }
      default:
        throw new TypeError('No collection available for ' + ref);
    }
  }
}

module.exports = ModelBuilder;
