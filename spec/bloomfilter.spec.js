'use strict';

var DB;
if (typeof module !== 'undefined') {
  require('./node');
  DB = require('../');
}

describe('Test Bloomfilter', function () {
  var BloomFilter = DB.caching.BloomFilter;
  var db, type;

  // Skip fo IE 9
  if (!DB.util.atob) {
    return;
  }

  before(function () {
    var emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage });

    return emf.ready().then(function () {
      var metamodel = emf.metamodel;
      type = helper.randomize('BFObject');
      var objectType = new DB.metamodel.EntityType(type, metamodel.entity(Object));
      metamodel.addType(objectType);
      objectType.addAttribute(new DB.metamodel.SingularAttribute('value', metamodel.baseType(String)));
      return metamodel.save();
    }).then(function () {
      db = emf.createEntityManager();
    });
  });

  after(function () {

  });

  it('should initially not contain objects that were not updated', function () {
    return db.refreshBloomFilter().then(function (BF) {
      if (db.isCachingDisabled) {
        expect(BF).not.ok;
        return; // Node do not use a bloomfilter;
      }

      for (var i = 0; i < 5; i += 1) {
        expect(BF.contains(DB.util.uuid())).equal(false);
      }
    });
  });

  it('should contain updated objects', function () {
    if (db.isCachingDisabled) { return; }

    var obj = new db[type]();
    return db.insert(obj).then(function () {
      return obj.load({ refresh: true });
    }).then(function () {
      return db.refreshBloomFilter();
    }).then(function (bf) {
      expect(bf.contains(obj.id)).equal(false);
      obj.value = 'Felix an Erik were here.';
      return obj.save();
    })
      .then(function () {
        return db.refreshBloomFilter();
      })
      .then(function (bf) {
        expect(bf.contains(obj.id)).equal(true);
      });
  });

  it('should perform fast lookups', function () {
    if (db.isCachingDisabled) { return; }

    var obj = new db[type]();
    return db.insert(obj).then(function () {
      return obj.load({ refresh: true });
    }).then(function () {
      obj.value = 'Muh.';
      return obj.save();
    }).then(function () {
      return db.refreshBloomFilter();
    })
      .then(function (bf) {
        expect(bf.contains(obj.id)).equal(true);
        // Do many contains
        for (var i = 0; i < 100000; i += 1) {
          bf.contains(Math.random());
        }
      });
  });

  it('should contain everything when full', function () {
    var raw = { m: 240, h: 4, b: '////////////////////////////////////////' };
    var bf = new BloomFilter(raw);
    for (var i = 0; i < 100; i += 1) {
      expect(bf.contains(DB.util.uuid())).to.be.true;
    }
  });

  it('should correctly implement Murmur3', function () {
    var test1 = 'Erik';
    var test2 = 'Witt';
    var test3 = 'Hello World';
    var test4 = 'demo';
    var test5 = 'demoo';
    var test6 = 'Lorem ipsum dolor sit amet';

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

    var hashes = [
      1364076727, 3831157163, 1814548639, 1579843702, 962700458, 1405797717, 2851871033, 1753412482,
      540458183, 3919258131, 2454642859, 1299793004, 2900468685, 3777108633, 3948372897, 344634232,
      579629687, 681429644, 2245896913, 3159267110, 12394096, 356444087, 3449745100, 3587710546,
      3807608861, 1526938615, 102911733, 1794611252, 3709264869, 3848507484, 1666560491, 2880013475,
      2129959832, 1919294708, 4236377267, 1151690575, 450942853, 398077695, 619178129, 2607720578,
      501150701, 3858194949, 338914844, 1687707964, 3417188605, 4182070047, 2941713443, 1248550479,
      3530670207, 2484513939, 19522071, 264741300, 3778137224, 1394226660, 670727360, 602572328,
      3180462103, 613148321, 723937430, 3021304693, 374178196, 258265502, 476236381, 2522961926,
      1447422055, 1423767502, 3433458314, 3927768715, 1673550086, 259535367, 2552959238, 2098726809,
      1082091529, 1418846154, 1638369751, 4023337626, 4080631615, 101877610, 3861777329, 1166910142,
      2920273415, 363704473, 2041800129, 2207914708, 4115314515, 3241479426, 1700007039, 3264816752,
      672454412, 3710514769, 1035649181, 1632932802, 2477198342, 1862135120, 91771610, 892005123,
      661569231, 1009084850, 2514386435, 3778205279, 655955059, 1701593959, 728008763, 4052411414,
      3565335251, 2165993515, 3396622905, 3485312465, 492661292, 1524906076, 3327252652, 1748272243,
      2557468570, 4286712296, 1553167345, 4283091697, 3397902157, 1646279392, 3182414933, 4282621215,
      1050319643, 1199411734, 3254163991, 3455799985, 711529291, 136607286, 2567287614, 1435096473,
      267099677, 1776355184, 2175597757, 272521088, 1966883557, 3994511173, 247276885, 1697460207,
      4074938132, 1890337584, 1192179359, 3800442591, 1668915632, 913677874, 1378527627, 743909151,
      1223574168, 2583159756, 4013859643, 1964534932, 3242117845, 2088096246, 2264660483, 3784088710,
      3480328892, 2016797207, 3168604042, 174021730, 3686369331, 289008462, 277667422, 2324143147,
      408952885, 2663495318, 927055923, 2811982699, 3106452808, 564796806, 1697645670, 3574226819,
      3644714120, 1418202238, 949919887, 140882879, 900193307, 1986777770, 712484612, 2301255856,
      1462646239, 2561712729, 3794441735, 417829534, 4138798396, 2425955554, 3907163483, 2172276605,
      1630601731, 2638891462, 4081816376, 1968006290, 223549888, 1609876186, 2842112964, 34533283,
      1111242131, 3171560226, 270853570, 702450259, 2994587973, 2050431426, 4258432967, 3787025922,
      223053920, 1429901129, 797764846, 3798914229, 3494976349, 1055180014, 3551460163, 1830721426,
      1649677981, 3755932964, 1670309861, 249356227, 743390714, 3403382476, 2340286700, 3677961386,
      1420136782, 1250054754, 1994449283, 2249597328, 336112823, 3551056407, 1614721412, 3733880549,
      1926798079, 164179502, 1907703051, 773096242, 2716524810, 245607123, 1530964421, 2185527759,
      4048057607, 1153881266, 3391667916, 3227303743, 1778247493, 3122299611, 797608481, 1065090666,
      198014573, 1351441008, 2378749789, 144209364, 116478471, 836216331, 1941745834, 156162024,
      842253482, 1598088655, 2210059883, 1343041090, 3226243446, 1254380909, 1172860420, 4251775245,
    ];

    for (var i = 0; i < hashes.length; i += 1) {
      expect(BloomFilter.murmur3(0, String.fromCharCode(i))).to.equal(hashes[i]);
    }
  });
});
