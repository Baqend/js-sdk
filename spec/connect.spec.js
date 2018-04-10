var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Connect', function() {
  var user, origin;

  before(function() {
    user = helper.makeLogin();
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    var em = emf.createEntityManager();

    return em.ready().then(function() {
      return em.User.register(user, 'secret');
    });
  });

  beforeEach(function() {
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    var db = emf.createEntityManager(true);

    return db.ready().then(function() {
      if (!db.User.me)
        return db.User.login(user, 'secret');
    });
  });

  afterEach(function() {
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    var db = emf.createEntityManager(true);
    return db.ready().then(function() {
      return db.User.logout();
    });
  });

  it('should resume a logged in session', function() {
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    var db = emf.createEntityManager(true);

    return db.ready().then(function(db) {
      expect(db.User.me).be.ok;
      expect(db.User.me.username).be.equal(user);
      expect(db.token).be.ok;
    });
  });

  it('should resume a logged in session with new connection', function() {
    DB.connection.Connector.connections = {};

    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    var db = emf.createEntityManager(true);

    return db.ready().then(function(db) {
      expect(db.User.me).be.ok;
      expect(db.User.me.username).be.equal(user);
      expect(db.token).be.ok;
    });
  });

  it('should set gzip flag', function() {
    var connector = DB.connection.Connector.create(env.TEST_SERVER);
    expect(connector.gzip).eql(typeof global == "undefined");
  })
});
