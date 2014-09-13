var EntityFactory = require('./EntityFactory').EntityFactory;
var UserFactory;

/**
 * @class jspa.binding.UserFactory
 * @extends jspa.binding.EntityFactory<T>
 * @template <T> The type of the factory
 */
exports.UserFactory = UserFactory = EntityFactory.inherit(/** @lends jspa.binding.UserFactory.prototype */ {

  /** @lends jspa.binding.UserFactory */
  extend: {
    /**
     * Creates a new UserFactory for the given type
     * @param {jspa.metamodel.ManagedType} managedType The metadata of type T
     * @param {jspa.EntityManager} db
     * @return {jspa.binding.UserFactory<T>} A new object factory to created instances of T
     */
    create: function(managedType, db) {
      var factory = EntityFactory.create(managedType, db);
      Object.cloneOwnProperties(factory, UserFactory.prototype);
      return factory;
    }
  },

  register: function() {

  },

  login: function() {

  },

  logout: function() {

  },

  me: function() {

  }


});