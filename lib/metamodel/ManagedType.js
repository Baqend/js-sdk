var Type = require('./Type').Type;
var col = require('../collection');

/**
 * @class jspa.metamodel.ManagedType
 * @extends jspa.metamodel.Type
 */
exports.ManagedType = ManagedType = Type.inherit(/** @lends jspa.metamodel.ManagedType.prototype */ {
  AttributeIterator: Object.inherit(col.Iterator, {
    index: 0,

    initialize: function(type) {
      this.type = type;
    },

    /**
     * @return {jspa.metamodel.Attribute}
     */
    next: function() {
      while (this.type && this.type.declaredAttributes.length == this.index) {
        this.type = this.type.superType;
        this.index = 0;
      }

      if (this.type) {
        return {done: false, value: this.type.declaredAttributes[this.index++]};
      } else {
        return {done: true};
      }
    }
  }),

  /**
   * @type jspa.binding.Enhancer
   */
  _enhancer: null,

  /**
   * @type {jspa.metamodel.Attribute[]}
   */
  declaredAttributes: null,

  /**
   * @type {jspa.metamodel.EntityType}
   */
  superType: null,

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
   * @param {String} identifier or full class name
   * @param {Function} typeConstructor
   */
  initialize: function(identifier, typeConstructor) {
    this.superCall(identifier.indexOf('/db/') != 0 ? '/db/' + identifier : identifier, typeConstructor);

    this.declaredAttributes = [];
  },

  /**
   * Initialize this type
   * @param {jspa.binding.Enhancer} enhancer The class enhancer
   * used to enhance and instantiate instance of this managed class
   */
  init: function(enhancer) {
    this._enhancer = enhancer;

    if (this._typeConstructor && !this._enhancer.getIdentifier(this._typeConstructor))
      this._enhancer.setIdentifier(this._typeConstructor, this.identifier);
  },

  /**
   * Creates an ObjectFactory for this type and the given EntityManager
   * @param {jspa.EntityManager} db The created instances will be attached to this EntityManager
   * @return {jspa.binding.ManagedFactory} the crated object factory for the given EntityManager
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
   * @return {jspa.metamodel.ManagedType.AttributeIterator}
   */
  attributes: function() {
    return new this.AttributeIterator(this);
  },

  /**
   * @param {!String} name
   * @returns {jspa.metamodel.Attribute}
   */
  getAttribute: function(name) {
    var attr = this.getDeclaredAttribute(name);

    if (!attr && this.superType) {
      attr = this.superType.getAttribute(name);
    }

    return attr;
  },

  /**
   * @param {String} name
   * @returns {jspa.metamodel.Attribute}
   */
  getDeclaredAttribute: function(name) {
    for (var i = 0, attr; attr = this.declaredAttributes[i]; ++i) {
      if (attr.name == name) {
        return attr;
      }
    }

    return null;
  },

  /**
   * Merge the json data into the current object instance and returns the merged object
   * @param {jspa.util.Metadata} state The root object state
   * @param {Object} jsonObject The json data to merge
   * @param {*=} currentObject The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @return {*} The merged object instance
   */
  fromDatabaseValue: function(state, jsonObject, currentObject) {
    if (jsonObject) {
      for (var iter = this.attributes(), item = iter.next(); !item.done; item = iter.next()) {
        var attribute = item.value;
        attribute.setDatabaseValue(state, currentObject, jsonObject[attribute.name]);
      }
    } else {
      currentObject = null;
    }

    return currentObject;
  },

  /**
   * Converts the given object to json
   * @param {jspa.util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @return {Object} The converted object as json
   */
  toDatabaseValue: function(state, object) {
    var value = null;

    if (this.typeConstructor.isInstance(object)) {
      value = {};
      for (var iter = this.attributes(), item = iter.next(); !item.done; item = iter.next()) {
        var attribute = item.value;
        value[attribute.name] = attribute.getDatabaseValue(state, object);
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
    json['class'] = this.identifier;

    if (this.superType)
      json['superClass'] = this.superType.identifier;

    if (this.isEmbeddable)
      json['embedded'] = true;

    var fields = json['fields'] = {};
    for (var i = 0, attribute; attribute = this.declaredAttributes[i]; i++) {
      fields[attribute.name] = attribute.toJSON();
    }

    return json;
  },

  /**
   * Returns iterator to get all referenced entities
   * @return {jspa.metamodel.ManagedType.ReferenceIterator}
   */
  references: function() {
    return new this.ReferenceIterator(this);
  },

  ReferenceIterator: Object.inherit({

    initialize: function(type) {
      this.type = type;
      this.attributes = this.type.attributes();
      this.embedded = [];
    },

    /**
     * @return {jspa.metamodel.Attribute}
     */
    next: function() {
      for (var iter = this.attributes, item = iter.next(); !item.done; item = iter.next()) {
        var attribute = item.value;
        var type = attribute.isCollection ? attribute.elementType : attribute.type;
        if(type.isEntity) {
          return {done: false, value: {path: [attribute.name]}};
        } else if(type.isEmbeddable) {
          for (var emIter = type.references(), emItem = emIter.next(); !emItem.done; emItem = emIter.next()) {
            this.embedded.push({done: false, value: {path: [attribute.name].concat(emItem.value.path)}});
          }
        }
      }

      return this.embedded.length ? this.embedded.pop() : {done: true};
    }
  })
});