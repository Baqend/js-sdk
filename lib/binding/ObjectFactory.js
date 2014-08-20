/**
 * @class jspa.binding.ObjectFactory
 */

/**
 * @param {Function} typeConstructor
 * @param {jspa.EntityManager} db
 */
exports.ObjectFactory = function(typeConstructor, db) {

  return Object.extend(function() {
    var typeInstance = Object.create(typeConstructor.prototype);
    typeInstance.attach(db);
    typeConstructor.apply(typeInstance, arguments);
    return typeInstance;
  }, {
    get: function(id, doneCallback, failCallback) {
      return db.find(typeConstructor, id, doneCallback, failCallback);
    },

    find: function() {
      throw new Error("find is not yet implemented.");
    },

    methods: typeConstructor.prototype,

    addMethods: function(methods) {
      Object.extend(typeConstructor.prototype, methods);
    },

    addMethod: function(name, fn) {
      typeConstructor.prototype[name] = fn;
    },

    partialUpdate: function() {
      throw new Error("partialUpdate is not yet implemented.");
    }
  });
};
