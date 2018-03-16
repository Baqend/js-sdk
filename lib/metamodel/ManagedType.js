'use strict';

const Type = require('./Type');
const Permission = require('../util/Permission');
const Validator = require('../util/Validator');
const binding = require('../binding');
const deprecated = require('../util/deprecated');

/**
 * @alias metamodel.ManagedType
 * @extends metamodel.Type
 */
class ManagedType extends Type {
  /**
   * @type Function
   */
  get validationCode() {
    return this.compiledValidationCode;
  }

  set validationCode(code) {
    if (!code) {
      this.compiledValidationCode = null;
    } else {
      this.compiledValidationCode = Validator.compile(this, code);
    }
  }

  /**
   * The Managed class
   * @type Class<binding.Managed>
   */
  get typeConstructor() {
    if (!this.enhancedTypeConstructor) {
      this.typeConstructor = this.createProxyClass();
    }
    return this.enhancedTypeConstructor;
  }

  /**
   * The Managed class constructor
   * @param {Class<binding.Managed>} typeConstructor The managed class constructor
   */
  set typeConstructor(typeConstructor) {
    if (this.enhancedTypeConstructor) {
      throw new Error('Type constructor has already been set.');
    }

    const isEntity = typeConstructor.prototype instanceof binding.Entity;
    if (this.isEntity) {
      if (!isEntity) {
        throw new TypeError('Entity classes must extends the Entity class.');
      }
    } else if (!(typeConstructor.prototype instanceof binding.Managed) || isEntity) {
      throw new TypeError('Embeddable classes must extends the Managed class.');
    }

    this.enhancer.enhance(this, typeConstructor);
    this.enhancedTypeConstructor = typeConstructor;
  }

  /**
   * @param {string} ref or full class name
   * @param {Class<binding.Managed>=} typeConstructor
   */
  constructor(ref, typeConstructor) {
    super(ref.indexOf('/db/') !== 0 ? '/db/' + ref : ref, typeConstructor);

    /** @type binding.Enhancer */
    this.enhancer = null;
    /** @type {metamodel.Attribute[]} */
    this.declaredAttributes = [];

    /** @type util.Permission */
    this.schemaAddPermission = new Permission();
    /** @type util.Permission */
    this.schemaReplacePermission = new Permission();

    /** @type Object<string,string>|null */
    this.metadata = null;
  }

  /**
   * Initialize this type
   * @param {binding.Enhancer} enhancer The class enhancer
   * used to enhance and instantiate instance of this managed class
   */
  init(enhancer) {
    this.enhancer = enhancer;

    if (this.enhancedTypeConstructor && !binding.Enhancer.getIdentifier(this.enhancedTypeConstructor)) {
      binding.Enhancer.setIdentifier(this.enhancedTypeConstructor, this.ref);
    }
  }

  /**
   * Creates an ProxyClass for this type
   * @return {Class<*>} the crated proxy class for this type
   * @abstract
   */
  createProxyClass() {}

  /**
   * Creates an ObjectFactory for this type and the given EntityManager
   * @param {EntityManager} db The created instances will be attached to this EntityManager
   * @return {binding.ManagedFactory<*>} the crated object factory for the given EntityManager
   * @abstract
   */
  createObjectFactory(db) {} // eslint-disable-line no-unused-vars

  /**
   * Creates a new instance of the managed type, without invoking any constructors
   * This method is used to create object instances which are loaded form the backend
   * @returns {Object} The created instance
   */
  create() {
    const instance = Object.create(this.typeConstructor.prototype);
    binding.Managed.init(instance);

    return instance;
  }

  /**
   * An iterator which returns all attributes declared by this type and inherited form all super types
   * @return {Iterator<metamodel.Attribute>}
   */
  attributes() {
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

      /**
       * @return {Object} item
       * @return {boolean} item.done
       * @return {metamodel.Attribute} item.value
       */
      next() {
        if (iter) {
          const item = iter.next();
          if (!item.done) {
            return item;
          }

          iter = null;
        }

        if (index < type.declaredAttributes.length) {
          index += 1;
          return {
            value: type.declaredAttributes[index],
            done: false,
          };
        }

        return { done: true };
      },
    };
  }

  /**
   * Adds an attribute to this type
   * @param {metamodel.Attribute} attr The attribute to add
   * @param {number=} order Position of the attribute
   */
  addAttribute(attr, order) {
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
    if (this.enhancedTypeConstructor && this.name !== 'Object') {
      this.enhancer.enhanceProperty(this.enhancedTypeConstructor, attr);
    }
  }

  /**
   * Removes an attribute from this type
   * @param {string} name The Name of the attribute which will be removed
   */
  removeAttribute(name) {
    const length = this.declaredAttributes.length;
    this.declaredAttributes = this.declaredAttributes.filter(val => val.name !== name);

    if (length === this.declaredAttributes.length) {
      throw new Error('An Attribute with the name ' + name + ' is not declared.');
    }
  }

  /**
   * @param {!string} name
   * @returns {metamodel.Attribute}
   */
  getAttribute(name) {
    let attr = this.getDeclaredAttribute(name);

    if (!attr && this.superType) {
      attr = this.superType.getAttribute(name);
    }

    return attr;
  }

  /**
   * @param {string|number} val Name or order of the attribute
   * @returns {metamodel.Attribute}
   */
  getDeclaredAttribute(val) {
    return this.declaredAttributes.filter(attr => attr.name === val || attr.order === val)[0] || null;
  }

  /**
   * @inheritDoc
   */
  fromJsonValue(state, jsonObject, currentObject, options) {
    if (!jsonObject) {
      return null;
    }

    const iter = this.attributes();
    for (let el = iter.next(); !el.done; iter.next()) {
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
  toJsonValue(state, object, options) {
    if (!(object instanceof this.typeConstructor)) {
      return null;
    }

    const value = {};
    const iter = this.attributes();
    for (let el = iter.next(); !el.done; iter.next()) {
      const attribute = el.value;
      if (!options.excludeMetadata || !attribute.isMetadata) {
        value[attribute.name] = attribute.getJsonValue(state, object, options);
      }
    }

    return value;
  }

  /**
   * Converts ths type schema to json
   * @returns {json}
   */
  toJSON() {
    const fields = {};
    this.declaredAttributes.forEach((attribute) => {
      if (!attribute.isMetadata) {
        fields[attribute.name] = attribute;
      }
    });

    const json = {
      class: this.ref,
      fields,
      acl: {
        load: this.loadPermission,
        schemaAdd: this.schemaAddPermission,
        schemaReplace: this.schemaReplacePermission,
      },
    };

    if (this.superType) {
      json.superClass = this.superType.ref;
    }

    if (this.isEmbeddable) {
      json.embedded = true;
    }

    if (this.metadata) {
      json.metadata = this.metadata;
    }

    return json;
  }

  /**
   * Returns iterator to get all referenced entities
   * @return {Iterator<EntityType>}
   */
  references() {
    const attributes = this.attributes();
    let attribute;
    let embeddedAttributes;

    return {
      [Symbol.iterator]() {
        return this;
      },

      /**
       * @return {Object} item
       * @return {boolean} item.done
       * @return {Object} item.value
       */
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
            return item;
          }

          attribute = item.value;
          const type = attribute.isCollection ? attribute.elementType : attribute.type;
          if (type.isEntity) {
            return { value: { path: [attribute.name] } };
          } else if (type.isEmbeddable) {
            embeddedAttributes = type.references();
          }
        }
      },
    };
  }

  /**
   * Retrieves whether this type has specific metadata
   *
   * @param {string} key
   * @returns {boolean}
   */
  hasMetadata(key) {
    return this.metadata && !!this.metadata[key];
  }

  /**
   * Gets some metadata of this type
   *
   * @param {string} key
   * @returns {null|string}
   */
  getMetadata(key) {
    if (!this.hasMetadata(key)) {
      return null;
    }

    return this.metadata[key];
  }
}

deprecated(ManagedType.prototype, '_enhancer', 'enhancer');
deprecated(ManagedType.prototype, '_validationCode', 'compiledValidationCode');
deprecated(ManagedType.prototype, '_typeConstructor', 'enhancedTypeConstructor');

module.exports = ManagedType;
