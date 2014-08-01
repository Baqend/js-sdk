/**
 * @namespace jspa
 */
require('jahcode');
require('./polyfills');

exports.collection = require('./collection');
exports.promise = require('./promise');

exports.binding = require('./binding');
exports.connector = require('./connector');
exports.error = require('./error');
exports.message = require('./message');
exports.metamodel = require('./metamodel');
exports.tracked = require('./tracked');
exports.util = require('./util');

exports.EntityManager = require('./EntityManager').EntityManager;
exports.EntityManagerFactory = require('./EntityManagerFactory').EntityManagerFactory;
exports.EntityTransaction = require('./EntityTransaction').EntityTransaction;
exports.PersistenceUnitUtil = require('./PersistenceUnitUtil').PersistenceUnitUtil;
exports.Query = require('./Query').Query;
exports.TypedQuery = require('./TypedQuery').TypedQuery;
