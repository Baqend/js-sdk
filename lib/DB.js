var EntityManagerFactory = require('./EntityManagerFactory').EntityManagerFactory;

if(typeof window != "undefined") {
  var dbPromise;

  window.DB = {
    /**
     * @param {String} [host]
     * @param {Function} [callback]
     */
    ready: function(host, callback) {
      callback = String.isInstance(host) ? callback : host;
      dbPromise = dbPromise || new EntityManagerFactory(host).createEntityManager();
      return dbPromise.then(function(db) {
        return window.db = window.db || db;
      }).then(callback);
    }
  };
}