/**
 * Created by hannes on 27.01.15.
 */

if (typeof baqend == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  expect = chai.expect;
  baqend = require('../lib');
}

describe("Test Index", function() {

  var delay = function(delay, result) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve(result);
      }, delay)
    });
  };

  var db, personType, meta;

  before(function() {
    var emf = new baqend.EntityManagerFactory(env.TEST_SERVER);
    meta = emf.metamodel;

    meta.init();
    meta.addType(personType = new baqend.metamodel.EntityType(randomize("IndexPerson"), meta.entity(Object)));
    personType.addAttribute(new baqend.metamodel.SingularAttribute("name", meta.baseType(String)));

    return saveMetamodel(meta).then(function() {
      return new baqend.EntityManagerFactory(env.TEST_SERVER).createEntityManager();
    }).then(function(em) {
      db = em;
      return db.User.login('root', 'root');
    });
  });

  afterEach(function() {
    return meta.dropAllIndexes(personType.name, db.token);
  });

  it('should retrieve indexes', function() {
    var index = new baqend.metamodel.DbIndex("name");
    expect(index.isCompound).be.false;

    return meta.createIndex(personType.name, index, db.token).then(function() {
      return delay(50);
    }).then(function() {
      return meta.getIndexes(personType.name, db.token);
    }).then(function(indexes) {
      expect(indexes).have.length(1);
      expect(indexes[0].isCompound).be.false;
      expect(indexes[0].keys[0].name).eqls(baqend.metamodel.DbIndex.ASC);
    });
  });

  it('should retrieve all indexes', function() {
    var index1 = new baqend.metamodel.DbIndex("name");
    var index2 = new baqend.metamodel.DbIndex("address");

    return Promise.all([meta.createIndex(personType.name, index1, db.token), meta.createIndex(personType.name, index2, db.token)]).then(function() {
      return delay(50);
    }).then(function() {
      return meta.getIndexes(personType.name, db.token);
    }).then(function(indexes) {
      expect(indexes).have.length(2);
    });
  });

  it('should drop all indexes', function() {
    var index1 = new baqend.metamodel.DbIndex("name");
    var index2 = new baqend.metamodel.DbIndex("address");

    return Promise.all([meta.createIndex(personType.name, index1, db.token), meta.createIndex(personType.name, index2, db.token)]).then(function() {
      return delay(50);
    }).then(function() {
      return meta.getIndexes(personType.name, db.token);
    }).then(function(indexes) {
      expect(indexes).have.length(2);
      return meta.dropAllIndexes(personType.name, db.token);
    }).then(function() {
      return delay(50);
    }).then(function() {
      return meta.getIndexes(personType.name, db.token);
    }).then(function(indexes) {
      expect(indexes).be.empty;
    });
  });

  it('should drop index', function() {
    var index = new baqend.metamodel.DbIndex("name");

    return meta.createIndex(personType.name, index, db.token).then(function() {
      return delay(50);
    }).then(function() {
      return meta.dropIndex(personType.name, index, db.token);
    }).then(function() {
      return delay(50);
    }).then(function() {
      return meta.getIndexes(personType.name, db.token);
    }).then(function(indexes) {
      expect(indexes).be.empty;
    });
  });

  it('should create index', function() {
    var index = new baqend.metamodel.DbIndex("name");

    return meta.getIndexes(personType.name, db.token).then(function(indexes) {
      expect(indexes).be.empty;
      return meta.createIndex(personType.name, index, db.token);
    }).then(function() {
      return delay(50);
    }).then(function() {
      return meta.getIndexes(personType.name, db.token);
    }).then(function(indexes) {
      expect(indexes).have.length(1);
    });
  });

  it('should create compound index', function() {
    var index = new baqend.metamodel.DbIndex([
      {name: baqend.metamodel.DbIndex.ASC},
      {age: baqend.metamodel.DbIndex.DESC}
    ]);

    expect(index.isCompound).be.true;
    expect(index.hasKey("name")).be.true;
    expect(index.hasKey("age")).be.true;

    return meta.createIndex(personType.name, index, db.token).then(function() {
      return delay(50);
    }).then(function() {
      return meta.getIndexes(personType.name, db.token);
    }).then(function(indexes) {
      expect(indexes).have.length(1);
      expect(indexes[0].isCompound).be.true;
      expect(indexes[0].keys[0].name).eqls(baqend.metamodel.DbIndex.ASC);
      expect(indexes[0].keys[1].age).eqls(baqend.metamodel.DbIndex.DESC);
    });
  });

  it('should not allowed to create an unsupported index', function() {
    var index = new baqend.metamodel.DbIndex([
      {name: "text"}
    ]);

    return expect(meta.createIndex(personType.name, index, db.token)).be.rejected;
  });

  it('should not allowed to use illegal arguments', function() {
    var index = new baqend.metamodel.DbIndex([
      {
        name: baqend.metamodel.DbIndex.DESC,
        foo: baqend.metamodel.DbIndex.DESC
      }
    ]);

    return expect(meta.createIndex(personType.name, index, db.token)).be.rejected.then(function() {
      index = new baqend.metamodel.DbIndex([]);
      expect(index.hasKey("test")).be.false;
      return expect(meta.createIndex(personType.name, index, db.token)).be.rejected;
    });
  });

  it('should create unique index', function() {
    var index = new baqend.metamodel.DbIndex("name", true);
    return meta.createIndex(personType.name, index, db.token).then(function() {
      return delay(50);
    }).then(function() {
      var person1 = db[personType.name]();
      var person2 = db[personType.name]();
      person1.name = "foobar";
      person2.name = "foobar";
      return expect(Promise.all([person1.insert(), person2.insert()])).be.rejected;
    });
  });
});