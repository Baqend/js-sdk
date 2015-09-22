"use strict";

var Type = require('./Type');
var Permission = require('../util/Permission');
var Validator = require('../util/Validator');

/**
 * @class baqend.metamodel.ManagedType
 * @extends baqend.metamodel.Type
 */
class ManagedType extends Type {

  /**
   * @param {Function|String} code
   */
  set validationCode(code) {
    if(!code) {
      this._validationCode = null;
    } else {
      this._validationCode = Validator.compile(this, code);
    }
  }

  /**
   * @return {Function}
   */
  get validationCode() {
    return this._validationCode;
  }

  /**
   * @return {Function}
   */
  get typeConstructor() {
    if (!this._typeConstructor) {
      this.typeConstructor = this._enhancer.createProxyClass(this);
    }
    return this._typeConstructor;
  }

  /**
   * @param {Function} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if (this._typeConstructor) {
      throw new Error("typeConstructor has already been set.")
    }
    this._typeConstructor = typeConstructor;
    this._enhancer.enhance(this, this._typeConstructor);
  }

  /**
   * @param {String} ref or full class name
   * @param {Function} typeConstructor
   */
  constructor(ref, typeConstructor) {
    super(ref.indexOf('/db/') != 0 ? '/db/' + ref : ref, typeConstructor);

    /** @type baqend.binding.Enhancer */
    this._enhancer = null;
    /** @type {baqend.metamodel.Attribute[]} */
    this.declaredAttributes = [];

    /** @type baqend.util.Permission */
    this.loadPermission = new Permission();
    /** @type baqend.util.Permission */
    this.schemaAddPermission = new Permission();
    /** @type baqend.util.Permission */
    this.schemaReplacePermission = new Permission();
  }

  /**
   * Initialize this type
   * @param {baqend.binding.Enhancer} enhancer The class enhancer
   * used to enhance and instantiate instance of this managed class
   */
  init(enhancer) {
    this._enhancer = enhancer;

    if (this._typeConstructor && !this._enhancer.getIdentifier(this._typeConstructor))
      this._enhancer.setIdentifier(this._typeConstructor, this.ref);
  }

  /**
   * Creates an ObjectFactory for this type and the given EntityManager
   * @param {baqend.EntityManager} db The created instances will be attached to this EntityManager
   * @return {baqend.binding.ManagedFactory} the crated object factory for the given EntityManager
   * @abstract
   */
  createObjectFactory(db) {}

  /**
   * @returns {Object}
   */
  create() {
    return this._enhancer.create(this);
  }

  /**
   * An iterator which returns all attributes declared by this type and inherited form all super types
   * @return {Iterator<baqend.metamodel.Attribute>}
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
       * @return {Boolean} item.done
       * @return {baqend.metamodel.Attribute=} item.value
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
   * @param {baqend.metamodel.Attribute} attr The attribute to add
   * @param {Number=} order Position of the attribute
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
   * @param {String} name The Name of the attribute which will be removed
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
   * @param {!String} name
   * @returns {baqend.metamodel.Attribute}
   */
  getAttribute(name) {
    var attr = this.getDeclaredAttribute(name);

    if (!attr && this.superType) {
      attr = this.superType.getAttribute(name);
    }

    return attr;
  }

  /**
   * @param {String|Number} val Name or order of the attribute
   * @returns {baqend.metamodel.Attribute}
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
  toJsonValue(state, object) {
    var value = null;

    if (object instanceof this.typeConstructor) {
      value = {};
      for (let attribute of this.attributes()) {
        if (!attribute.isMetadata)
          value[attribute.name] = attribute.getJsonValue(state, object);
      }
    }

    return value;
  }

  /**
   * Converts ths type schema to json
   * @returns {Object}
   */
  toJSON() {
    var json = {};
    json['class'] = this.ref;

    if (this.superType)
      json['superClass'] = this.superType.ref;

    if (this.isEmbeddable)
      json['embedded'] = true;

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
       * @return {Boolean} item.done
       * @return {Object=} item.value
       */
      next() {
        for (let attribute of attributes) {
          var type = attribute.isCollection ? attribute.elementType : attribute.type;
          if(type.isEntity) {
            return {done: false, value: {path: [attribute.name]}};
          } else if(type.isEmbeddable) {
            for (let emItem of type.references()) {
              embedded.push({done: false, value: {path: [attribute.name].concat(emItem.value.path)}});
            }
          }
        }

        return this.embedded.length ? this.embedded.pop() : {done: true};
      }
    }
  }
}

module.exports = ManagedType;