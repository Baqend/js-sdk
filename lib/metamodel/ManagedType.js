"use strict";

var Type = require('./Type');
var Permission = require('../util/Permission');
var Validator = require('../util/Validator');
var binding = require('../binding');

/**
 * @alias metamodel.ManagedType
 * @extends metamodel.Type
 */
class ManagedType extends Type {

  /**
   * @type Function
   */
  get validationCode() {
    return this._validationCode;
  }

  set validationCode(code) {
    if(!code) {
      this._validationCode = null;
    } else {
      this._validationCode = Validator.compile(this, code);
    }
  }

  /**
   * The Managed class
   * @type Class<binding.Managed>
   */
  get typeConstructor() {
    if (!this._typeConstructor) {
      this.typeConstructor = this.createProxyClass();
    }
    return this._typeConstructor;
  }

  /**
   * The Managed class constructor
   * @param {Class<binding.Managed>} typeConstructor The managed class constructor
   */
  set typeConstructor(typeConstructor) {
    if (this._typeConstructor) {
      throw new Error("Type constructor has already been set.");
    }

    var isEntity = typeConstructor.prototype instanceof binding.Entity;
    if (this.isEntity) {
      if (!isEntity)
        throw new TypeError("Entity classes must extends the Entity class.");
    } else {
      if (!(typeConstructor.prototype instanceof binding.Managed) || isEntity)
        throw new TypeError("Embeddable classes must extends the Managed class.");
    }

    this._enhancer.enhance(this, typeConstructor);
    this._typeConstructor = typeConstructor;
  }

  /**
   * @param {string} ref or full class name
   * @param {Class<binding.Managed>} typeConstructor
   */
  constructor(ref, typeConstructor) {
    super(ref.indexOf('/db/') != 0 ? '/db/' + ref : ref, typeConstructor);

    /** @type binding.Enhancer */
    this._enhancer = null;
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
    this._enhancer = enhancer;

    if (this._typeConstructor && !this._enhancer.getIdentifier(this._typeConstructor))
      this._enhancer.setIdentifier(this._typeConstructor, this.ref);
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
  createObjectFactory(db) {}

  /**
   * Creates a new instance of the managed type, without invoking any constructors
   * This method is used to create object instances which are loaded form the backend
   * @returns {Object} The created instance
   */
  create() {
    var instance;
    instance = Object.create(this.typeConstructor.prototype);
    binding.Managed.init(instance);

    return instance;
  }

  /**
   * An iterator which returns all attributes declared by this type and inherited form all super types
   * @return {Iterator<metamodel.Attribute>}
   */
  attributes() {
    let iter, index = 0, type = this;
    if (this.superType) {
      iter = this.superType.attributes();
    }

    return {
      [Symbol.iterator]() {
        return this
      },

      /**
       * @return {Object} item
       * @return {boolean} item.done
       * @return {metamodel.Attribute} item.value
       */
      next() {
        if (iter) {
          let item = iter.next();
          if (item.done) {
            iter = null;
          } else {
            return item;
          }
        }

        if (index < type.declaredAttributes.length) {
          return {
            value: type.declaredAttributes[index++],
            done: false
          }
        } else {
          return {done: true}
        }
      }
    }
  }

  /**
   * Adds an attribute to this type
   * @param {metamodel.Attribute} attr The attribute to add
   * @param {number=} order Position of the attribute
   */
  addAttribute(attr, order) {
    if (this.getAttribute(attr.name))
      throw new Error("An attribute with the name " + attr.name + " is already declared.");

    if(attr.order == null) {
      order = typeof order == 'undefined'? this.declaredAttributes.length: order;
    } else {
      order = attr.order;
    }
    attr.init(this, order);

    this.declaredAttributes.push(attr);
    if (this._typeConstructor && this.name != 'Object')
      this._enhancer.enhanceProperty(this._typeConstructor, attr);
  }

  /**
   * Removes an attribute from this type
   * @param {string} name The Name of the attribute which will be removed
   */
  removeAttribute(name) {
    var length = this.declaredAttributes.length;
    this.declaredAttributes = this.declaredAttributes.filter(function(val) {
      return val.name != name;
    });

    if (length == this.declaredAttributes.length)
      throw new Error("An Attribute with the name " + name + " is not declared.");
  }

  /**
   * @param {!string} name
   * @returns {metamodel.Attribute}
   */
  getAttribute(name) {
    var attr = this.getDeclaredAttribute(name);

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
    for (let attr of this.declaredAttributes) {
      if (attr.name === val || attr.order === val) {
        return attr;
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  fromJsonValue(state, jsonObject, currentObject) {
    if (jsonObject) {
      for (let attribute of this.attributes()) {
        if (!attribute.isMetadata)
          attribute.setJsonValue(state, currentObject, jsonObject[attribute.name]);
      }
    } else {
      currentObject = null;
    }

    return currentObject;
  }

  /**
   * @inheritDoc
   */
  toJsonValue(state, object, options) {
    var value = null;
    if (object instanceof this.typeConstructor) {
      value = {};
      for (let attribute of this.attributes()) {
        if (!attribute.isMetadata)
          value[attribute.name] = attribute.getJsonValue(state, object, options);
      }
      // if (object._metadata.isAttached && options && !options.excludeMetadata) {
      //   Object.assign(value, object._metadata.getJsonMetadata())
      // }
    }


    return value;
  }

  /**
   * Converts ths type schema to json
   * @returns {json}
   */
  toJSON() {
    var json = {};
    json['class'] = this.ref;

    if (this.superType)
      json['superClass'] = this.superType.ref;

    if (this.isEmbeddable)
      json['embedded'] = true;

    if (this.metadata)
      json['metadata'] = this.metadata;

    json['acl'] = {
      load: this.loadPermission,
      schemaAdd: this.schemaAddPermission,
      schemaReplace: this.schemaReplacePermission
    };

    var fields = json['fields'] = {};
    for (let attribute of this.declaredAttributes) {
      if (!attribute.isMetadata)
        fields[attribute.name] = attribute;
    }

    return json;
  }

  /**
   * Returns iterator to get all referenced entities
   * @return {Iterator<EntityType>}
   */
  references() {
    let attributes = this.attributes();
    let embedded = [];

    return {
      [Symbol.iterator]() {
        return this
      },

      /**
       * @return {Object} item
       * @return {boolean} item.done
       * @return {Object} item.value
       */
      next() {
        for (let attribute of attributes) {
          var type = attribute.isCollection ? attribute.elementType : attribute.type;
          if(type.isEntity) {
            return {done: false, value: {path: [attribute.name]}};
          } else if(type.isEmbeddable) {
            for (let emItem of type.references()) {
              embedded.push({done: false, value: {path: [attribute.name].concat(emItem.path)}});
            }
          }
        }

        return embedded.length ? embedded.pop() : {done: true};
      }
    }
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
    if (!this.hasMetadata(key))
      return null;

    return this.metadata[key];
  }
}

module.exports = ManagedType;
