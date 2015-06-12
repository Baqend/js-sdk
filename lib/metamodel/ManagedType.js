var Type = require('./Type');
var Permission = require('../util/Permission');
var Iterator = require('../collection').Iterator;

/**
 * @class baqend.metamodel.ManagedType
 * @extends baqend.metamodel.Type
 */
var ManagedType = Type.inherit(/** @lends baqend.metamodel.ManagedType.prototype */ {

  /**
   * @class baqend.Metamodel.prototype.AttributeIterator
   * @extends baqend.collection.Iterator
   */
  AttributeIterator: Object.inherit(Iterator, /* @lends baqend.Metamodel.prototype.AttributeIterator.prototype */ {
    index: 0,

    constructor: function AttributeIterator(type) {
      this.types = [];

      do {
        this.types.push(type);
      } while (type = type.superType);
    },

    /**
     * @return {Object} item
     * @return {Boolean} item.done
     * @return {baqend.metamodel.Attribute} item.value
     */
    next: function() {
      var type = this.types.pop();

      while (type && type.declaredAttributes.length == this.index) {
        type = this.types.pop();
        this.index = 0;
      }

      if (type) {
        this.types.push(type);
        return {done: false, value: type.declaredAttributes[this.index++]};
      } else {
        return Iterator.DONE;
      }
    }
  }),

  /**
   * @type baqend.binding.Enhancer
   */
  _enhancer: null,

  /**
   * @type {baqend.metamodel.Attribute[]}
   */
  declaredAttributes: null,

  /**
   * @type {baqend.metamodel.EntityType}
   */
  superType: null,

  /**
   * @type baqend.util.Permission
   */
  loadPermission: null,

  /**
   * @type baqend.util.Permission
   */
  schemaAddPermission: null,

  /**
   * @type baqend.util.Permission
   */
  schemaReplacePermission: null,

  /**
   * @type Function
   * @param {String|Function} code
   */
  set validationCode(code) {
    if(!code) {
      code = null;
    } else if(String.isInstance(code)) {
      var keys = [];
      for (var iter = this.attributes(), item; !(item = iter.next()).done; ) {
        keys.push(item.value.name);
      }
      code = new Function(keys, code);
    }
    this._validationCode = code;
  },

  /**
   * @type Function
   */
  get validationCode() {
    return this._validationCode;
  },

  /**
   * @type Function
   * @private
   */
  _validationCode: null,

  /**
   * @type {Function}
   */
  get typeConstructor() {
    if (!this._typeConstructor) {
      this.typeConstructor = this._enhancer.createProxyClass(this);
    }
    return this._typeConstructor;
  },

  /**
   * @param {Function} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if (this._typeConstructor) {
      throw new Error("typeConstructor has already been set.")
    }
    this._typeConstructor = typeConstructor;
    this._enhancer.enhance(this, this._typeConstructor);
  },

  /**
   * @param {String} ref or full class name
   * @param {Function} typeConstructor
   */
  constructor: function ManagedType(ref, typeConstructor) {
    Type.call(this, ref.indexOf('/db/') != 0 ? '/db/' + ref : ref, typeConstructor);
    this.declaredAttributes = [];
    this.loadPermission = new Permission();
    this.schemaAddPermission = new Permission();
    this.schemaReplacePermission = new Permission();
  },

  /**
   * Initialize this type
   * @param {baqend.binding.Enhancer} enhancer The class enhancer
   * used to enhance and instantiate instance of this managed class
   */
  init: function(enhancer) {
    this._enhancer = enhancer;

    if (this._typeConstructor && !this._enhancer.getIdentifier(this._typeConstructor))
      this._enhancer.setIdentifier(this._typeConstructor, this.ref);
  },

  /**
   * Creates an ObjectFactory for this type and the given EntityManager
   * @param {baqend.EntityManager} db The created instances will be attached to this EntityManager
   * @return {baqend.binding.ManagedFactory} the crated object factory for the given EntityManager
   * @abstract
   */
  createObjectFactory: function(db) {},

  /**
   * @returns {Object}
   */
  create: function() {
    return this._enhancer.create(this);
  },

  /**
   * @return {baqend.metamodel.ManagedType.AttributeIterator}
   */
  attributes: function() {
    return new this.AttributeIterator(this);
  },

  /**
   * Adds an attribute to this type
   * @param {baqend.metamodel.Attribute} attr The attribute to add
   * @param {Number=} order Position of the attribute
   */
  addAttribute: function(attr, order) {
    if (this.getAttribute(attr.name))
      throw new Error("An attribute with the name " + attr.name + " is already declared.");

    if(attr.order == null) {
      order = typeof order == 'undefined'? this.declaredAttributes.length: order;
    } else {
      order = attr.order;
    }
    attr.init(this, order);

    this.declaredAttributes.push(attr);
    if (this._typeConstructor)
      this._enhancer.enhanceProperty(this._typeConstructor, attr);
  },

  /**
   * Removes an attribute from this type
   * @param {String} name The Name of the attribute which will be removed
   */
  removeAttribute: function(name) {
    var length = this.declaredAttributes.length;
    this.declaredAttributes = this.declaredAttributes.filter(function(val) {
      return val.name != name;
    });

    if (length == this.declaredAttributes.length)
      throw new Error("An Attribute with the name " + name + " is not declared.");
  },

  /**
   * @param {!String} name
   * @returns {baqend.metamodel.Attribute}
   */
  getAttribute: function(name) {
    var attr = this.getDeclaredAttribute(name);

    if (!attr && this.superType) {
      attr = this.superType.getAttribute(name);
    }

    return attr;
  },

  /**
   * @param {String|Number} val Name or order of the attribute
   * @returns {baqend.metamodel.Attribute}
   */
  getDeclaredAttribute: function(val) {
    for (var i = 0, attr; attr = this.declaredAttributes[i]; ++i) {
      if (attr.name === val || attr.order === val) {
        return attr;
      }
    }

    return null;
  },

  /**
   * @inheritDoc
   */
  fromJsonValue: function(state, jsonObject, currentObject) {
    if (jsonObject) {
      for (var iter = this.attributes(), item; !(item = iter.next()).done; ) {
        var attribute = item.value;
        attribute.setJsonValue(state, currentObject, jsonObject[attribute.name]);
      }
    } else {
      currentObject = null;
    }

    return currentObject;
  },

  /**
   * @inheritDoc
   */
  toJsonValue: function(state, object) {
    var value = null;

    if (this.typeConstructor.isInstance(object)) {
      value = {};
      for (var iter = this.attributes(), item; !(item = iter.next()).done; ) {
        var attribute = item.value;
        value[attribute.name] = attribute.getJsonValue(state, object);
      }
    }

    return value;
  },

  /**
   * Converts ths type schema to json
   * @returns {Object}
   */
  toJSON: function() {
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
    for (var i = 0, attribute; attribute = this.declaredAttributes[i]; i++) {
      fields[attribute.name] = attribute;
    }

    return json;
  },

  /**
   * Returns iterator to get all referenced entities
   * @return {baqend.metamodel.ManagedType.ReferenceIterator}
   */
  references: function() {
    return new this.ReferenceIterator(this);
  },

  ReferenceIterator: Object.inherit({

    constructor: function ReferenceIterator(type) {
      this.type = type;
      this.attributes = this.type.attributes();
      this.embedded = [];
    },

    /**
     * @return {baqend.metamodel.Attribute}
     */
    next: function() {
      for (var iter = this.attributes, item; !(item = iter.next()).done; ) {
        var attribute = item.value;
        var type = attribute.isCollection ? attribute.elementType : attribute.type;
        if(type.isEntity) {
          return {done: false, value: {path: [attribute.name]}};
        } else if(type.isEmbeddable) {
          for (var emIter = type.references(), emItem; !(emItem = emIter.next()).done; ) {
            this.embedded.push({done: false, value: {path: [attribute.name].concat(emItem.value.path)}});
          }
        }
      }

      return this.embedded.length ? this.embedded.pop() : {done: true};
    }
  })
});

module.exports = ManagedType;