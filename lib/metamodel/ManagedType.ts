'use strict';

import { Type } from "./Type";
import { Class, Json, JsonMap } from "../util";
import { deprecated } from "../util/deprecated";
import { Enhancer, Entity, Managed, ManagedFactory } from "../binding";
import { Attribute } from "./Attribute";
import { EntityManager } from "../EntityManager";
import { EntityType } from "./EntityType";
import { PluralAttribute } from "./PluralAttribute";
import { SingularAttribute } from "./SingularAttribute";
import { EmbeddableType } from "./index";
import { Metadata, Permission } from "../intersection";

const VALIDATION_CODE = Symbol('ValidationCode');
const TYPE_CONSTRUCTOR = Type.TYPE_CONSTRUCTOR;

export abstract class ManagedType<T extends Managed> extends Type<T> {
  public enhancer: Enhancer | null = null;
  public declaredAttributes: Attribute<any>[] = [];
  public schemaAddPermission: Permission = new Permission();
  public schemaReplacePermission: Permission = new Permission();
  public metadata: {[key: string]: string} | null = null;
  public superType: EntityType<any> | null = null;

  /**
   * @type Function
   */
  get validationCode(): Function | null {
    return this[VALIDATION_CODE];
  }

  /**
   * @param code
   */
  set validationCode(code: Function | null) {
    this[VALIDATION_CODE] = code;
  }

  /**
   * The Managed class
   */
  get typeConstructor(): Class<T> {
    if (!this[TYPE_CONSTRUCTOR]) {
      this.typeConstructor = this.createProxyClass();
    }
    return this[TYPE_CONSTRUCTOR];
  }

  /**
   * The Managed class constructor
   * @param typeConstructor The managed class constructor
   */
  set typeConstructor(typeConstructor: Class<T>) {
    if (this[TYPE_CONSTRUCTOR]) {
      throw new Error('Type constructor has already been set.');
    }

    const isEntity = typeConstructor.prototype instanceof Entity;
    if (this.isEntity) {
      if (!isEntity) {
        throw new TypeError('Entity classes must extends the Entity class.');
      }
    } else if (!(typeConstructor.prototype instanceof Managed) || isEntity) {
      throw new TypeError('Embeddable classes must extends the Managed class.');
    }

    this.enhancer!!.enhance(this, typeConstructor);
    this[TYPE_CONSTRUCTOR] = typeConstructor;
  }

  /**
   * @param ref or full class name
   * @param typeConstructor The type constructor of the managed lass
   */
  constructor(ref: string, typeConstructor?: Class<T>) {
    super(ref.indexOf('/db/') !== 0 ? '/db/' + ref : ref, typeConstructor);
  }

  /**
   * Initialize this type
   * @param enhancer The class enhancer used to instantiate an instance of this managed class
   */
  init(enhancer: Enhancer): void {
    this.enhancer = enhancer;

    if (this[TYPE_CONSTRUCTOR] && !Enhancer.getIdentifier(this[TYPE_CONSTRUCTOR])) {
      Enhancer.setIdentifier(this[TYPE_CONSTRUCTOR], this.ref);
    }
  }

  /**
   * Creates an ProxyClass for this type
   * @return the crated proxy class for this type
   */
  abstract createProxyClass(): Class<T>;

  /**
   * Creates an ObjectFactory for this type and the given EntityManager
   * @param db The created instances will be attached to this EntityManager
   * @return the crated object factory for the given EntityManager
   */
  abstract createObjectFactory(db: EntityManager): ManagedFactory<T>;

  /**
   * Creates a new instance of the managed type, without invoking any constructors
   *
   * This method is used to create object instances which are loaded form the backend.
   *
   * @return The created instance
   */
  create(): T {
    const instance = Object.create(this.typeConstructor.prototype);
    Managed.init(instance);

    return instance;
  }

  /**
   * An iterator which returns all attributes declared by this type and inherited form all super types
   * @return
   */
  attributes(): IterableIterator<Attribute<any>> {
    let iter;
    let index = 0;
    const type = this;

    if (this.superType) {
      iter = this.superType.attributes();
    }

    return {
      [Symbol.iterator]() {
        return this;
      },

      next() {
        if (iter) {
          const item = iter.next();
          if (!item.done) {
            return item;
          }

          iter = null;
        }

        if (index < type.declaredAttributes.length) {
          const value = type.declaredAttributes[index];
          index += 1;
          return { value, done: false };
        }

        return { done: true };
      },
    };
  }

  /**
   * Adds an attribute to this type
   * @param attr The attribute to add
   * @param order Position of the attribute
   * @return
   */
  addAttribute(attr: Attribute<any>, order?: number): void {
    if (this.getAttribute(attr.name)) {
      throw new Error('An attribute with the name ' + attr.name + ' is already declared.');
    }

    let initOrder;
    if (!attr.order) {
      initOrder = typeof order === 'undefined' ? this.declaredAttributes.length : order;
    } else {
      initOrder = attr.order;
    }

    attr.init(this, initOrder);

    this.declaredAttributes.push(attr);
    if (this[TYPE_CONSTRUCTOR] && this.name !== 'Object') {
      this.enhancer!!.enhanceProperty(this[TYPE_CONSTRUCTOR], attr);
    }
  }

  /**
   * Removes an attribute from this type
   * @param name The Name of the attribute which will be removed
   * @return
   */
  removeAttribute(name: string): void {
    const length = this.declaredAttributes.length;
    this.declaredAttributes = this.declaredAttributes.filter(val => val.name !== name);

    if (length === this.declaredAttributes.length) {
      throw new Error('An Attribute with the name ' + name + ' is not declared.');
    }
  }

  /**
   * @param name
   * @return
   */
  getAttribute(name: string): Attribute<any> | null {
    let attr = this.getDeclaredAttribute(name);

    if (!attr && this.superType) {
      attr = this.superType.getAttribute(name);
    }

    return attr;
  }

  /**
   * @param val Name or order of the attribute
   * @return
   */
  getDeclaredAttribute(val: string | number): Attribute<any> | null {
    return this.declaredAttributes.filter(attr => attr.name === val || attr.order === val)[0] || null;
  }

  /**
   * @inheritDoc
   */
  fromJsonValue(state: Metadata, jsonObject: Json, currentObject: T | null, options: { onlyMetadata?: boolean }) {
    if (!jsonObject || !currentObject) {
      return null;
    }

    const iter = this.attributes();
    for (let el = iter.next(); !el.done; el = iter.next()) {
      const attribute = el.value;
      if (!options.onlyMetadata || attribute.isMetadata) {
        attribute.setJsonValue(state, currentObject, jsonObject[attribute.name], options);
      }
    }

    return currentObject;
  }

  /**
   * @inheritDoc
   */
  toJsonValue(state: Metadata, object: T | null, options: { excludeMetadata?: boolean; depth?: number | boolean }): Json {
    if (!(object instanceof this.typeConstructor)) {
      return null;
    }

    const value = {};
    const iter = this.attributes();
    for (let el = iter.next(); !el.done; el = iter.next()) {
      const attribute = el.value;
      if (!options.excludeMetadata || !attribute.isMetadata) {
        value[attribute.name] = attribute.getJsonValue(state, object, options);
      }
    }

    return value;
  }

  /**
   * Converts ths type schema to json
   * @return
   */
  toJSON(): JsonMap {
    const fields = {};
    this.declaredAttributes.forEach((attribute) => {
      if (!attribute.isMetadata) {
        fields[attribute.name] = attribute;
      }
    });

    return {
      class: this.ref,
      fields,
      acl: {
        schemaAdd: this.schemaAddPermission.toJSON(),
        schemaReplace: this.schemaReplacePermission.toJSON(),
      },
      ...(this.superType && {superClass: this.superType.ref}),
      ...(this.isEmbeddable && {embedded: true}),
      ...(this.metadata && {metadata: this.metadata}),
    };
  }

  /**
   * Returns iterator to get all referenced entities
   * @return
   */
  references(): IterableIterator<{ path: string[] }> {
    const attributes = this.attributes();
    let attribute: Attribute<any>;
    let embeddedAttributes: IterableIterator<{ path: string[] }> | null;

    return {
      [Symbol.iterator]() {
        return this;
      },

      next() {
        for (;;) {
          if (embeddedAttributes) {
            const item = embeddedAttributes.next();
            if (!item.done) {
              return { value: { path: [attribute.name].concat(item.value.path) } };
            }
            embeddedAttributes = null;
          }

          const item = attributes.next();
          if (item.done) {
            // currently TS requires a undefined value here https://github.com/microsoft/TypeScript/issues/38479
            return { done: true, value: undefined };
          }

          attribute = item.value;
          const type = attribute.isCollection
              ? (attribute as PluralAttribute<any, any>).elementType
              : (attribute as SingularAttribute<any>).type;

          if (type.isEntity) {
            return { value: { path: [attribute.name] } };
          } else if (type.isEmbeddable) {
            embeddedAttributes = (type as EmbeddableType<any>).references();
          }
        }
      },
    };
  }

  /**
   * Retrieves whether this type has specific metadata
   *
   * @param key
   * @return
   */
  hasMetadata(key: string): boolean {
    return !!this.metadata && !!this.metadata[key];
  }

  /**
   * Gets some metadata of this type
   *
   * @param key
   * @return
   */
  getMetadata(key: string): string | null {
    if (!this.hasMetadata(key)) {
      return null;
    }

    return this.metadata!![key];
  }
}
