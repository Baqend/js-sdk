/**
 * @namespace baqend
 */
require('jahcode');
require('./polyfills');

var glob = typeof window !== 'undefined'? window: global;
glob.Promise = glob.Promise || require('lie');

require('./DB');

exports.Collection = require('./collection').Collection;
exports.List = require('./collection').List;
exports.Set = require('./collection').Set;
exports.Map = require('./collection').Map;

exports.binding = require('./binding');
exports.connector = require('./connector');
exports.error = require('./error');
exports.message = require('./message');
exports.metamodel = require('./metamodel');
exports.util = require('./util');

exports.EntityManager = require('./EntityManager').EntityManager;
exports.EntityManagerFactory = require('./EntityManagerFactory').EntityManagerFactory;
exports.EntityTransaction = require('./EntityTransaction').EntityTransaction;
exports.Query = require('./Query').Query;
exports.TypedQuery = require('./TypedQuery').TypedQuery;
exports.GeoPoint = require('./GeoPoint').GeoPoint;
