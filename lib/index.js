/**
 * @namespace baqend
 *
 * @borrows baqend.EntityManager#User
 * @borrows baqend.EntityManager#Role
 * @borrows baqend.EntityManager#Device
 * @borrows baqend.EntityManager#&lt;<i>YourEmbeddableClass</i>&gt;
 * @borrows baqend.EntityManager#&lt;<i>YourEntityClass</i>&gt;
 */

require('core-js/modules/es6.object.assign');
require('core-js/modules/es6.object.set-prototype-of');
require('core-js/modules/es6.promise');
require('core-js/modules/es6.set');
require('core-js/modules/es6.map');
require('core-js/modules/es6.array.from');
require('core-js/modules/es6.array.iterator');

var EntityManagerFactory = require('./EntityManagerFactory');
var EntityManager = require('./EntityManager');

EntityManager.prototype.binding = require('./binding');
EntityManager.prototype.connector = require('./connector');
EntityManager.prototype.error = require('./error');
EntityManager.prototype.message = require('./message');
EntityManager.prototype.metamodel = require('./metamodel');
EntityManager.prototype.util = require('./util');
EntityManager.prototype.caching = require('./caching');

EntityManager.prototype.EntityManager = require('./EntityManager');
EntityManager.prototype.EntityManagerFactory = require('./EntityManagerFactory');
EntityManager.prototype.EntityTransaction = require('./EntityTransaction');
EntityManager.prototype.Query = require('./Query');

var emf = new EntityManagerFactory();
exports = module.exports = emf.createEntityManager(true);

/**
 * Connects the DB with the baqend server and calls the callback on success
 * @param {String} hostOrApp The host or the app name to connect with
 * @param {Boolean} [secure=false] <code>true</code> To use a secure connection
 * @param {baqend.util.Lockable~callback=} doneCallback The callback, called when a connection is established and the
 * SDK is ready to use
 * @param {baqend.util.Lockable~callback=} failCallback When an error occurred while initializing the SDK
 * @function
 * @alias baqend#connect
 */
exports.connect = function(hostOrApp, secure, doneCallback, failCallback) {
  if (secure instanceof Function) {
    failCallback = doneCallback;
    doneCallback = secure;
    secure = false;
  }

  emf.connect(hostOrApp, secure);
  return this.ready(doneCallback, failCallback);
};
