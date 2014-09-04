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
   * @type jspa.binding.ClassFactory
   */
  classFactory: null,

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
      this.typeConstructor = this._classFactory.createProxyClass(this);
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
    this._classFactory.enhance(this, this._typeConstructor);
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
   * @param {jspa.binding.ClassFactory} classFactory The class factory
   * used to instantiate instance of this managed class
   */
  init: function(classFactory) {
    this._classFactory = classFactory;

    if (this._typeConstructor && !this._classFactory.getIdentifier(this._typeConstructor))
      this._classFactory.setIdentifier(this._typeConstructor, this.identifier);
  },

  /**
   * @returns {Object}
   */
  create: function() {
    return this._classFactory.create(this);
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
      value = {
        _objectInfo: {
          'class': this.identifier
        }
      };

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
  }
});