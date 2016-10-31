/**
 * @interface baqend
 * @extends EntityManager
 */
var EntityManagerFactory = require('./EntityManagerFactory');
var EntityManager = require('./EntityManager');

EntityManager.prototype.binding = require('./binding');
EntityManager.prototype.connector = require('./connector');
EntityManager.prototype.error = require('./error');
EntityManager.prototype.message = require('./message');
EntityManager.prototype.metamodel = require('./metamodel');
EntityManager.prototype.util = require('./util');
EntityManager.prototype.caching = require('./caching');
EntityManager.prototype.query = require('./query');

EntityManager.prototype.EntityManager = require('./EntityManager');
EntityManager.prototype.EntityManagerFactory = require('./EntityManagerFactory');
EntityManager.prototype.EntityTransaction = require('./EntityTransaction');
EntityManager.prototype.Acl = require('./Acl');

var emf = new EntityManagerFactory();
var db = emf.createEntityManager(true);

/**
 * Configures the DB with additional config options
 * @param {Object} options The additional configuration options
 * @param {util.TokenStorage} [options.tokenStorage] The tokenStorage which should be used by this emf
 * @param {util.TokenStorageFactory} [options.tokenStorageFactory] The tokenStorage factory implementation which should
 * be used for token storage
 * @param {number} [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached data,
 * <code>0</code> to always bypass the browser cache
 * @function
 * @return {baqend}
 * @alias baqend#configure
 */
db.configure = function(options) {
  emf.configure(options);
  return this;
};

/**
 * Connects the DB with the server and calls the callback on success
 * @param {string} hostOrApp The host or the app name to connect with
 * @param {boolean} [secure=false] <code>true</code> To use a secure connection
 * @param {util.Lockable~callback=} doneCallback The callback, called when a connection is established and the
 * SDK is ready to use
 * @param {util.Lockable~callback=} failCallback When an error occurred while initializing the SDK
 * @function
 * @return {Promise<EntityManager>}
 * @alias baqend#connect
 */
db.connect = function(hostOrApp, secure, doneCallback, failCallback) {
  if (secure instanceof Function) {
    failCallback = doneCallback;
    doneCallback = secure;
    secure = undefined;
  }

  emf.connect(hostOrApp, secure);
  return this.ready(doneCallback, failCallback);
};

exports = module.exports = db;
//import {db} from 'baqend';
exports.db = db;
//import db from 'baqend';
exports.default = db;
