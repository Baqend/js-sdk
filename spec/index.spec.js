'use strict';

if (typeof module !== 'undefined') {
  require('./node');
}

describe('Test Index', function () {
  this.timeout(16000);

  var sleepTime = 2500;

  var db, personType, meta;

  before(function () {
    var emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage });
    meta = emf.metamodel;

    meta.addType(personType = new DB.metamodel.EntityType(helper.randomize('IndexPerson'), meta.entity(Object)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('name', meta.baseType(String)));

    return meta.save().then(function () {
      db = new DB.EntityManagerFactory({ host: env.TEST_SERVER, staleness: 0 }).createEntityManager();
      return db.ready();
    });
  });

  afterEach(function () {
    return meta.dropAllIndexes(personType.name).then(function () {
      return helper.sleep(sleepTime);
    });
  });

  it('should retrieve indexes', function () {
    var index = new DB.metamodel.DbIndex('name');
    expect(index.isCompound).be.false;

    return meta.createIndex(personType.name, index).then(function () {
      return helper.sleep(sleepTime);
    }).then(function () {
      return meta.getIndexes(personType.name);
    }).then(function (indexes) {
      expect(indexes).have.length(2);
      var index = indexes.filter(function (el) { return el.keys[0].name; })[0];
      expect(index.isCompound).be.true;
      expect(index.keys[0].name).eqls(DB.metamodel.DbIndex.ASC);
      expect(index.keys[1].id).eqls(DB.metamodel.DbIndex.ASC);
    });
  });

  it('should retrieve all indexes', function () {
    var index1 = new DB.metamodel.DbIndex('name');
    var index2 = new DB.metamodel.DbIndex('address');

    return Promise.all([
      meta.createIndex(personType.name, index1),
      meta.createIndex(personType.name, index2),
    ]).then(function () {
      return helper.sleep(sleepTime);
    }).then(function () {
      return meta.getIndexes(personType.name);
    }).then(function (indexes) {
      expect(indexes).have.length(3);
    });
  });

  it('should drop all indexes', function () {
    var index1 = new DB.metamodel.DbIndex('name');
    var index2 = new DB.metamodel.DbIndex('address');

    return Promise.all([
      meta.createIndex(personType.name, index1),
      meta.createIndex(personType.name, index2),
    ]).then(function () {
      return helper.sleep(sleepTime);
    }).then(function () {
      return meta.getIndexes(personType.name);
    }).then(function (indexes) {
      expect(indexes).have.length(3);
      return meta.dropAllIndexes(personType.name);
    })
      .then(function () {
        return helper.sleep(sleepTime);
      })
      .then(function () {
        return expect(meta.getIndexes(personType.name)).eventually.have.length(1);
      });
  });

  it('should drop index', function () {
    var index = new DB.metamodel.DbIndex('name');

    return meta.createIndex(personType.name, index).then(function () {
      return helper.sleep(sleepTime);
    }).then(function () {
      return meta.dropIndex(personType.name, index);
    }).then(function () {
      return helper.sleep(sleepTime);
    })
      .then(function () {
        return expect(meta.getIndexes(personType.name)).eventually.have.length(1);
      });
  });

  it('should create index', function () {
    var index = new DB.metamodel.DbIndex('name');

    return meta.getIndexes(personType.name).then(function (indexes) {
      expect(indexes).have.length(1);
      return meta.createIndex(personType.name, index);
    }).then(function () {
      return helper.sleep(sleepTime);
    }).then(function () {
      return meta.getIndexes(personType.name);
    })
      .then(function (indexes) {
        expect(indexes).have.length(2);
      });
  });

  it('should create compound index', function () {
    var index = new DB.metamodel.DbIndex([
      { name: DB.metamodel.DbIndex.ASC },
      { age: DB.metamodel.DbIndex.DESC },
    ]);

    expect(index.isCompound).be.true;
    expect(index.hasKey('name')).be.true;
    expect(index.hasKey('age')).be.true;

    return meta.createIndex(personType.name, index).then(function () {
      return helper.sleep(sleepTime);
    }).then(function () {
      return meta.getIndexes(personType.name);
    }).then(function (indexes) {
      expect(indexes).have.length(2);
      var index = indexes.filter(function (el) { return el.keys[0].name; })[0];
      expect(index.isCompound).be.true;
      expect(index.keys[0].name).eqls(DB.metamodel.DbIndex.ASC);
      expect(index.keys[1].age).eqls(DB.metamodel.DbIndex.DESC);
      expect(index.keys[2].id).eqls(DB.metamodel.DbIndex.DESC);
    });
  });

  it('should not allowed to create an unsupported index', function () {
    var index = new DB.metamodel.DbIndex([
      { name: 'text' },
    ]);

    return expect(meta.createIndex(personType.name, index)).be.rejected;
  });

  it('should not allowed to use illegal arguments', function () {
    var index = new DB.metamodel.DbIndex([
      {
        name: DB.metamodel.DbIndex.DESC,
        foo: DB.metamodel.DbIndex.DESC,
      },
    ]);

    return expect(meta.createIndex(personType.name, index)).be.rejected.then(function () {
      index = new DB.metamodel.DbIndex([]);
      expect(index.hasKey('test')).be.false;
      return expect(meta.createIndex(personType.name, index)).be.rejected;
    });
  });

  it('should create unique index', function () {
    var index = new DB.metamodel.DbIndex('name', true);
    return meta.createIndex(personType.name, index).then(function () {
      return helper.sleep(sleepTime);
    }).then(function () {
      var person1 = new db[personType.name]();
      var person2 = new db[personType.name]();
      person1.name = 'foobar';
      person2.name = 'foobar';
      return expect(Promise.all([person1.insert(), person2.insert()])).be.rejected;
    });
  });
});
