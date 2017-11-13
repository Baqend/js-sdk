var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Bloomfilter', function() {
  var BloomFilter = DB.caching.BloomFilter;
  var db, type;

  //skip fo IE 9
  if (!DB.util.atob) {
    return;
  }

  before(function() {
    var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage});

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

  after(function() {

  });

  it('should initially not contain objects that were not updated', function() {
    return db.refreshBloomFilter().then(function(BF) {
      if (db.isCachingDisabled) {
        expect(BF).not.ok;
        return; // node do not use a bloomfilter;
      }

      for (var i = 0; i < 5; i++) {
        expect(BF.contains(DB.util.uuid())).equal(false);
      }
    });
  });

  it('should contain updated objects', function() {
    if (db.isCachingDisabled)
      return;

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
    if (db.isCachingDisabled)
      return;

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
    var test3 = "Hello World";
    var test4 = "demo";
    var test5 = "demoo";
    var test6 = "Lorem ipsum dolor sit amet";

    expect(BloomFilter.murmur3(0, test1)).equal(3050897767);
    expect(BloomFilter.murmur3(0, test2)).equal(545263713);
    expect(BloomFilter.murmur3(0, test3)).equal(427197390);
    expect(BloomFilter.murmur3(0, test4)).equal(2714225050);
    expect(BloomFilter.murmur3(0, test5)).equal(1838221292);
    expect(BloomFilter.murmur3(0, test6)).equal(875169970);
    expect(BloomFilter.murmur3(42, test1)).equal(3678409999);
    expect(BloomFilter.murmur3(42, test2)).equal(3132235112);
    expect(BloomFilter.murmur3(42, test3)).equal(1233774035);
    expect(BloomFilter.murmur3(42, test4)).equal(2755392248);
    expect(BloomFilter.murmur3(42, test5)).equal(3694137869);
    expect(BloomFilter.murmur3(42, test6)).equal(4206322987);
    expect(BloomFilter.murmur3(666, test1)).equal(3471908579);
    expect(BloomFilter.murmur3(666, test2)).equal(2040362262);
    expect(BloomFilter.murmur3(666, test3)).equal(1460628018);
    expect(BloomFilter.murmur3(666, test4)).equal(3836085620);
    expect(BloomFilter.murmur3(666, test5)).equal(244294033);
    expect(BloomFilter.murmur3(666, test6)).equal(688456789);
    expect(BloomFilter.getHashes(test1, 10000, 5)).eqls([7767, 415, 3063, 5711, 8359]);
  });

});
