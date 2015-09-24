/**
 * @namespace baqend
 *
 * @borrows baqend.EntityManager#User
 * @borrows baqend.EntityManager#Role
 * @borrows baqend.EntityManager#run
 * @borrows baqend.EntityManager#getReference
 * @borrows baqend.EntityManager#contains
 * @borrows baqend.EntityManager#&lt;<i>YourEmbeddableClass</i>&gt;
 * @borrows baqend.EntityManager#&lt;<i>YourEntityClass</i>&gt;
 */

require('core-js/modules/es6.object.assign');
require('core-js/modules/es6.symbol');
require('core-js/modules/es6.promise');
require('core-js/modules/es6.set');
require('core-js/modules/es6.map');
require('core-js/modules/es6.array.from');
require('core-js/modules/es6.array.iterator');

var EntityManagerFactory = require('./EntityManagerFactory');
var EntityManager = require('./EntityManager');

var emf = new EntityManagerFactory({global: true});

exports = module.exports = emf.createEntityManager(true);

//exports.collection = require('./collection');
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

/**
 * Connects the DB with the baqend server and calls the callback on success
 * @param {String=} location The url to connect to
 * @param {function=} callback The callback, called when a connection is established
 * @function
 * @alias baqend#connect
 */
exports.connect = function(location, callback) {
  emf.connect(location);
  return this.ready(callback);
};
