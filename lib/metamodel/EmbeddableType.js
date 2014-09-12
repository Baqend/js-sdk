var ManagedType = require('./ManagedType').ManagedType;
var Type = require('./Type').Type;

/**
 * @class jspa.metamodel.EmbeddableType
 * @extends jspa.metamodel.ManagedType
 */
exports.EmbeddableType = EmbeddableType = ManagedType.inherit(/** @lends jspa.metamodel.EmbeddableType.prototype */ {
  persistenceType: Type.PersistenceType.EMBEDDABLE,

  /**
   * {@inheritDoc}
   * @param {jspa.util.Metadata} state {@inheritDoc}
   * @param {*} object {@inheritDoc}
   * @return {Object} {@inheritDoc}
   */
  toDatabaseValue: function (state, object) {
    if (this.typeConstructor.isInstance(object) && !object.hasOwnProperty('_metadata')) {
      object._metadata = {
        _root: state._root
      };
    }

    return this.superCall(state, object);
  },

  /**
   * @param {jspa.util.Metadata} state {@inheritDoc}
   * @param {Object} jsonObject {@inheritDoc}
   * @param {*} currentObject {@inheritDoc}
   * @return {*} {@inheritDoc}
   */
  fromDatabaseValue: function (state, jsonObject, currentObject) {
    if (!currentObject && jsonObject) {
      currentObject = this.create();
      currentObject._metadata._root = state._root;
    }

    return this.superCall(state, jsonObject, currentObject);
  },

  /**
   * @param {Function} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if (this._typeConstructor) {
      throw new Error("typeConstructor has already been set.")
    }
    this._typeConstructor = typeConstructor;
    this._classFactory.enhance(this, this._typeConstructor, false);
  },

  /**
   * @type {Function}
   */
  get typeConstructor() {
    if (!this._typeConstructor) {
      this.typeConstructor = this._classFactory.createProxyClass(this);
    }
    return this._typeConstructor;
  },

  toString: function() {
    return "EmbeddableType(" + this.identifier + ")";
  }
});