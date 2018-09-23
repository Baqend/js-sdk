'use strict';

const Enhancer = require('./Enhancer');
const Metadata = require('../util/Metadata');

/**
 * @alias binding.Managed
 */
class Managed {
  /**
   * Initialize the given instance
   * @param {binding.Managed} instance The managed instance to initialize
   * @param {Object<string,*>=} properties The optional properties to set on the instance
   * @return {void}
   */
  static init(instance, properties) {
    const type = Enhancer.getBaqendType(instance.constructor);
    if (type.isEntity) {
      Object.defineProperty(instance, '_metadata', {
        value: Metadata.create(type),
        configurable: true,
      });
    }

    if (properties) {
      Object.assign(instance, properties);
    }
  }

  /**
   * Creates a subclass of this class
   * @param {Class<*>} childClass
   * @return {Class<*>} The extended child class
   */
  static extend(childClass) {
    childClass.prototype = Object.create(this.prototype, {
      constructor: {
        value: childClass,
        configurable: true,
        writable: true,
      },
    });
    childClass.extend = Managed.extend;
    return childClass;
  }

  /**
   * Create a temporary state object for a managed object
   * @param {metamodel.ManagedType} type
   * @param {EntityManager=} db
   * @return {util.State}
   */
  static createState(type, db) {
    return { type, db, setDirty() {} };
  }

  /**
   * The default constructor, copy all given properties to this object
   * @param {Object<string,*>=} properties - The optional properties to copy
   */
  constructor(properties) {
    Managed.init(this, properties);
  }
}

Object.defineProperties(Managed.prototype, /** @lends binding.Managed.prototype */ {
  /**
   * Returns this object identifier or the baqend type of this object
   * @return {string} the object id or type whatever is available
   * @method
   */
  toString: {
    value: function toString() {
      const type = Enhancer.getBaqendType(this.constructor);
      return (type.isEntity && this._metadata.id) || type.ref;
    },
    enumerable: false,
  },

  /**
   * Converts the managed object to an JSON-Object.
   * @return {json} JSON-Object
   * @method
   */
  toJSON: {
    value: function toJSON() {
      const type = Enhancer.getBaqendType(this.constructor);
      return type.toJsonValue(Managed.createState(type), this, {});
    },
  },
});

/**
 * Contains the metadata of this managed object
 * @type util.Metadata
 * @name metadata
 * @memberOf binding.Managed
 * @private
 */

module.exports = Managed;
