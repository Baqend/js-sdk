var EntityManagerFactory = require('./EntityManagerFactory').EntityManagerFactory;

var loader = global.DB;
var DB = global.DB = {
  _promise: null,

  /**
   * @param {Function} callback
   * @return {Promise<baqend.EntityManager>}
   */
  ready: function(callback) {
    if (!DB._location)
      DB.connect(window.location.protocol + '//' + window.location.host);

    return DB._promise.then(callback);
  },

  /**
   * @param {String} location
   * @param {Function} [callback]
   * @return {Promise<baqend.EntityManager>}
   */
  connect: function(location, callback) {
    if (this._location)
      throw new Error('DB already initialized.');

    this._location = location;
    DB._location = location;
    DB._promise = new EntityManagerFactory(location).createEntityManager().then(function(db) {
      return glob.DB = db;
    });

    return this.ready(callback);
  }
};

if (loader && loader._callbacks) {
  if (loader._location)
    DB.connect(loader._location);
  loader._callbacks.forEach(DB.ready);
}