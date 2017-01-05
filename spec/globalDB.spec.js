var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

before(function() {
  return DB.connect(env.TEST_SERVER).then(function(localDb) {
    expect(localDb).equal(DB);
  });
});

describe('Test Global DB', function() {
  it('should export global DB', function() {
    expect(DB).be.ok;
    expect(DB).instanceof(DB.EntityManager);
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