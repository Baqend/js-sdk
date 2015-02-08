/**
 * @namespace baqend
 */
require('jahcode');
require('lie/lib/polyfill');
require('./polyfills');

var EntityManagerFactory = require('./EntityManagerFactory');
var EntityManager = require('./EntityManager');

var emf = new EntityManagerFactory({global: true});
exports = module.exports = emf.createEntityManager(true);

exports.collection = require('./collection');
exports.binding = require('./binding');
exports.connector = require('./connector');
exports.error = require('./error');
exports.message = require('./message');
exports.metamodel = require('./metamodel');
exports.util = require('./util');

exports.EntityManager = require('./EntityManager');
exports.EntityManagerFactory = require('./EntityManagerFactory');
exports.EntityTransaction = require('./EntityTransaction');
exports.Query = require('./Query');
exports.TypedQuery = require('./TypedQuery');

exports.connect = function(location, callback) {
  emf.connect(location);
  return this.ready(callback);
};
