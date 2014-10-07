var EntityManagerFactory = require('./EntityManagerFactory').EntityManagerFactory;
var Q = require('q');

var glob = typeof window != "undefined"? window: global;
var loader = glob.DB;
var DB = glob.DB = {
  _deferred: Q.defer(),

  /**
   * @param {Function} callback
   * @return {Q.Promise<baqend.EntityManager>}
   */
  ready: function(callback) {
    return DB._deferred.promise.then(callback);
  },

  /**
   * @param {String} location
   * @param {Function} [callback]
   * @return {Q.Promise<baqend.EntityManager>}
   */
  connect: function(location, callback) {
    if (this._location)
      throw new Error('DB already initialized.');

    this._location = location;
    var dbPromise = new EntityManagerFactory(location).createEntityManager();
    dbPromise.then(function(db) {
      return glob.DB = db;
    }).then(function(db) {
      DB._deferred.resolve(db);
    });

    return this.ready(callback);
  }
};

if (loader && loader._callbacks) {
  loader._callbacks.forEach(DB.ready);
  if (loader._location)
    DB.connect(loader._location);
}