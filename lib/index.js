'use strict';

/**
 * @namespace baqend
 *
 * @borrows baqend.EntityManager#User
 * @borrows baqend.EntityManager#Role
 * @borrows baqend.EntityManager#run
 * @borrows baqend.EntityManager#getReference
 * @borrows baqend.EntityManager#contains
 * @borrows baqend.EntityManager#[<i>MyEmbeddableClass</i>]
 * @borrows baqend.EntityManager#[<i>MyEntityClass</i>]
 */

require('jahcode');
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
