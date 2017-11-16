'use strict';

/**
 * @interface baqend
 * @extends EntityManager
 */
const EntityManagerFactory = require('./EntityManagerFactory');
const EntityManager = require('./EntityManager');

EntityManager.prototype.binding = require('./binding');
EntityManager.prototype.connector = require('./connector');
EntityManager.prototype.error = require('./error');
EntityManager.prototype.message = require('./message');
EntityManager.prototype.metamodel = require('./metamodel');
EntityManager.prototype.util = require('./util');
EntityManager.prototype.caching = require('./caching');
EntityManager.prototype.query = require('./query');
EntityManager.prototype.partialupdate = require('./partialupdate');

EntityManager.prototype.EntityManager = require('./EntityManager');
EntityManager.prototype.EntityManagerFactory = require('./EntityManagerFactory');
EntityManager.prototype.EntityTransaction = require('./EntityTransaction');
EntityManager.prototype.Acl = require('./Acl');

const emf = new EntityManagerFactory();
const db = emf.createEntityManager(true);

/**
 * Configures the DB with additional config options
 * @param {Object} options The additional configuration options
 * @param {util.TokenStorage} [options.tokenStorage] The tokenStorage which should be used by this emf
 * @param {util.TokenStorageFactory} [options.tokenStorageFactory] The tokenStorage factory implementation which should
 * be used for token storage
 * @param {number} [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached
 * data, <code>0</code> to always bypass the browser cache
 * @function
 * @return {baqend}
 * @alias baqend#configure
 */
db.configure = function configure(options) {
  emf.configure(options);
  return this;
};

/**
 * Connects the DB with the server and calls the callback on success
 * @param {string} hostOrApp The host or the app name to connect with
 * @param {boolean} [secure=false] <code>true</code> To use a secure connection
 * @param {util.Lockable~doneCallback=} doneCallback The callback, called when a connection is established and the
 * SDK is ready to use
 * @param {util.Lockable~failCallback=} failCallback When an error occurred while initializing the SDK
 * @function
 * @return {Promise<EntityManager>}
 * @alias baqend#connect
 */
db.connect = function connect(hostOrApp, secure, doneCallback, failCallback) {
  if (secure instanceof Function) {
    failCallback = doneCallback;
    doneCallback = secure;
    secure = undefined;
  }

  emf.connect(hostOrApp, secure);
  return this.ready(doneCallback, failCallback);
};

exports = db;
// import {db} from 'baqend';
exports.db = db;
// import db from 'baqend';
exports.default = db;

module.exports = exports;
