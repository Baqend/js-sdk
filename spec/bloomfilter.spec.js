if (typeof DB == 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Bloomfilter', function() {
  var BloomFilter = DB.caching.BloomFilter;
  var db, type;

  before(function() {
    emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage});

    return emf.ready().then(function() {
      var metamodel = emf.metamodel;
      type = helper.randomize("BFObject");
      var objectType = new DB.metamodel.EntityType(type, metamodel.entity(Object));
      metamodel.addType(objectType);
      objectType.addAttribute(new DB.metamodel.SingularAttribute("value", metamodel.baseType(String)));
      return metamodel.save();
    }).then(function() {
      db = emf.createEntityManager();
    });
  });

  it('should initially not contain objects that were not updated', function() {
    db.refreshBloomFilter().then(function(BF) {
      for (var i = 0; i < 5; i++) {
        expect(BF.contains(DB.util.uuid())).equal(false);
      }
    });
  });

  it('should contain updated objects', function() {
    var obj = new db[type]();
    return db.insert(obj).then(function() {
      return obj.load({refresh: true});
    }).then(function() {
      return db.refreshBloomFilter();
    }).then(function(bf) {
      expect(bf.contains(obj.id)).equal(false);
      obj.value = "Felix an Erik were here.";
      return obj.save();
    }).then(function() {
      return db.refreshBloomFilter();
    }).then(function(bf) {
      expect(bf.contains(obj.id)).equal(true);
    });
  });

  it('should perform fast lookups', function() {
    var obj = new db[type]();
    return db.insert(obj).then(function() {
      return obj.load({refresh: true});
    }).then(function() {
      obj.value = "Muh.";
      return obj.save();
    }).then(function() {
      return db.refreshBloomFilter();
    }).then(function(bf) {
      expect(bf.contains(obj.id)).equal(true);
      //Do many contains
      for (var i = 0; i < 100000; i++) {
        bf.contains(Math.random());
      }
    });
  });

  it('should contain everything when full', function() {
    var raw = {"m": 240, "h": 4, "b": "////////////////////////////////////////"};
    var bf = new BloomFilter(raw);
    for (var i = 0; i < 100; i++) {
      expect(bf.contains(DB.util.uuid())).to.be.true;
    }
  });

  it('should correctly implement Murmur3', function() {
    var test1 = "Erik";
    var test2 = "Witt";

    expect(BloomFilter._murmur3(0, test1)).equal(3050897767);
    expect(BloomFilter._murmur3(0, test2)).equal(545263713);
    expect(BloomFilter._murmur3(666, test1)).equal(3471908579);
    expect(BloomFilter._murmur3(666, test2)).equal(2040362262);
    expect(BloomFilter._getHashes(test1, 10000, 5)).eqls([7767, 415, 3063, 5711, 8359]);
  });

  after(function() {

  });

});