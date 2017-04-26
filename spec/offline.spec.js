var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Offline', function() {

  var db, emf;
  before(function() {
    emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage});
    db = emf.createEntityManager();
    return db.ready();
  });

  after(function() {

  });

    it('should be created with an empty rule set', function() {
        expect(true).be.true;
    });

});