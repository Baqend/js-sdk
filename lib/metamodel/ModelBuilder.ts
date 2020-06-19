'use strict';

import { BasicType } from "./BasicType";
import { EntityType } from "./EntityType";
import { EmbeddableType } from "./EmbeddableType";
import { ListAttribute } from "./ListAttribute";
import { MapAttribute } from "./MapAttribute";
import { SetAttribute } from "./SetAttribute";
import { SingularAttribute } from "./SingularAttribute";
import { PersistentError } from "../error";
import { JsonMap } from "../util";
import { Type } from "./Type";
import { ManagedType } from "./ManagedType";
import { Attribute } from "./Attribute";
import { Validator } from "../intersection";

export class ModelBuilder {
  private models: {[name: string]: Type<any>} = {};
  private modelDescriptors: {[name: string]: JsonMap} | null = null;

  constructor() {
    Object.keys(BasicType).forEach((typeName) => {
      const basicType = BasicType[typeName];
      if (basicType instanceof BasicType) {
        this.models[basicType.ref] = basicType;
      }
    });
  }

  /**
   * @param ref
   * @return
   */
  getModel(ref: string): ManagedType<any> {
    if (ref in this.models) {
      return this.models[ref] as ManagedType<any>;
    }

    const model = this.buildModel(ref);
    this.models[ref] = model;
    return model;
  }

  /**
   * @param modelDescriptors
   * @return
   */
  buildModels(modelDescriptors: JsonMap[]): {[name: string]: Type<any>} {
    this.modelDescriptors = {};

    modelDescriptors.forEach((modelDescriptor: JsonMap) => {
      this.modelDescriptors![modelDescriptor.class as string] = modelDescriptor;
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
   * @param ref
   * @return
   */
  buildModel(ref: string): ManagedType<any> {
    const modelDescriptor = this.modelDescriptors![ref];
    let type;
    if (ref === EntityType.Object.ref) {
      type = new EntityType.Object();
    } else if (modelDescriptor) {
      if (modelDescriptor.embedded) {
        type = new EmbeddableType(ref);
      } else {
        const superTypeIdentifier = modelDescriptor.superClass || EntityType.Object.ref;
        type = new EntityType(ref, this.getModel(superTypeIdentifier) as EntityType<any>);
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
   * @param model
   * @return
   */
  buildAttributes(model: ManagedType<any>): void {
    const modelDescriptor = this.modelDescriptors![model.ref];
    const fields = modelDescriptor.fields!;

    Object.keys(fields).forEach((name) => {
      const field = fields[name];
      if (!model.getAttribute(name)) { // skip predefined attributes
        model.addAttribute(this.buildAttribute(field), field.order);
      }
    });

    if (typeof modelDescriptor.validationCode === 'string') {
      (model as EntityType<any>).validationCode = Validator.compile(model, modelDescriptor.validationCode);
    }
  }

  /**
   * @param field The field metadata
   * @param field.name The name of zhe field
   * @param field.type The type reference of the field
   * @param field.order The order number of the field
   * @param field.metadata Additional metadata of the field
   * @return
   */
  buildAttribute(field: {name: string, type: string, order: number, metadata: {[key: string]: string}, flags: string[]}): Attribute<any> {
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
