if (typeof DB == 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Global DB', function() {
  before(function() {
    expect(DB).be.ok;
    expect(DB).instanceof(DB.EntityManager);

    if (DB.isReady) {
      expect(function() {
        DB.connect(env.TEST_SERVER);
      }).throw(Error);
    } else {
      return DB.connect(env.TEST_SERVER).then(function(localDb) {
        expect(localDb).equal(DB);
      });
    }
  });

  it('should allow to add an callback to global DB object', function() {
    return DB.ready(function(localDb) {
      expect(localDb).equal(DB);
      expect(localDb).instanceof(DB.EntityManager);
    });
  });

  it('should only allow one connect call', function() {
    expect(function() {
      DB.connect(env.TEST_SERVER);
    }).throw(Error);
  });
});