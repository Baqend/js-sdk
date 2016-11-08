if (typeof DB == 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe("Streaming Queries", function() {
  // skips test for ie9 and ie10
  if (typeof window != 'undefined' && !window.WebSocket) {
    return;
  }

  var Stream = DB.query.Stream;
  var t = 400;
  var bucket = helper.randomize("StreamingQueryPerson");
  var emf, metamodel, db, stream, otherstream, subscription, othersubscription;
  var p0, p1, p2, p3, objects;

  beforeEach(function() {

    var personType, addressType;
    emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage});
    metamodel = emf.metamodel;

    metamodel.addType(personType = new DB.metamodel.EntityType(bucket, metamodel.entity(Object)));
    metamodel.addType(addressType = new DB.metamodel.EmbeddableType("QueryAddress"));

    personType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("address", addressType));
    personType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("date", metamodel.baseType(Date)));
    personType.addAttribute(new DB.metamodel.ListAttribute("colors", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("birthplace", metamodel.baseType(DB.GeoPoint)));

    addressType.addAttribute(new DB.metamodel.SingularAttribute("zip", metamodel.baseType(Number)));
    addressType.addAttribute(new DB.metamodel.SingularAttribute("city", metamodel.baseType(String)));

    return metamodel.save().then(function() {
      db = emf.createEntityManager();

      p0 = new db[bucket]({
        key: 'query_p0'
      });

      p1 = new db[bucket]({
        key: 'query_p1',
        name: 'QueryPerson 1',
        age: 45,
        date: new Date('1978-02-03T00:00Z'),
        address: new db.QueryAddress({city: 'Hamburg', zip: 22865}),
        colors: new DB.List(['red', 'green']),
        birthplace: new DB.GeoPoint(35, 110)
      });

      p2 = new db[bucket]({
        key: 'query_p2',
        name: 'QueryPerson 2',
        age: 33,
        date: new Date('1966-05-01T00:00Z'),
        address: new db.QueryAddress({city: 'Hamburg', zip: 23432}),
        colors: new DB.List(['blue', 'green', 'red']),
        birthplace: new DB.GeoPoint(32, 112)
      });

      p3 = new db[bucket]({
        key: 'query_p3',
        name: 'QueryPerson 3',
        age: 23,
        date: new Date('1989-05-01T00:00Z'),
        address: new db.QueryAddress({city: 'Munich', zip: 92438}),
        colors: new DB.List(['yellow', 'blue', 'white']),
        birthplace: new DB.GeoPoint(29, 109)
      });
      objects = [p0, p1, p2, p3];
      return Promise.all([p0.save({force: true}), p1.save({force: true}), p2.save({force: true}), p3.save({force: true})]);
    }).then(()=>helper.sleep(t));
  });

  afterEach(function() {
    this.timeout(5000);
    //Remove excess objects
    return helper.sleep(t).then(()=> {
      //Unregister subscriptions and streams
      if (subscription) {
        subscription.unsubscribe();
        subscription = undefined;
      }
      if (othersubscription) {
        othersubscription.unsubscribe();
        othersubscription = undefined;
      }
      if (stream) {
        // stream.unsubscribe();
        stream = undefined;
      }
      if (otherstream) {
        // otherstream.unsubscribe();
        otherstream = undefined;
      }
    }).then(()=> {
      return db[bucket].find().resultList(function(result) {
        return Promise.all(result.map(function(person) {
          return person.delete();
        }));
      });
    }).then(()=>helper.sleep(t));
  });

  it("should return the initial result", function() {
    var received = [];
    var query = db[bucket].find().limit(3);
    stream = query.stream();
    subscription = stream.subscribe(function(e) {
      received.push(e);
    });

    return helper.sleep(t).then(function() {
      expect(received.length).to.be.equal(3);
      received.forEach(function(result) {
        expect(result.matchType).to.be.equal("match");
        expect(objects).to.include(result.data);
        expect(result.operation).to.be.equal('none');
        expect(result.target).to.be.equal(query);
        expect(result.date.getTime()).be.ok;
        expect(result.initial).be.true;
      });
    });
  });

  it("should return updated object", function() {
    var result;
    var query = db[bucket].find();
    stream = query.stream({initial: false, matchTypes: 'match'});
    subscription = stream.subscribe(function(e) {
      result = e;
    });

    return helper.sleep(t).then(function() {
      p1.name = "Felix";
      return helper.sleep(t, p1.save());
    }).then(function() {
      expect(result.matchType).to.be.equal("match");
      expect(result.data).to.be.equal(p1);
      expect(result.operation).to.be.equal("update");
      expect(result.target).to.be.equal(query);
      expect(result.date.getTime()).be.ok;
      expect(result.initial).be.false;
    });
  });

  it("should maintain offset", function() {
    this.timeout(10000);
    var results = [];
    stream = db[bucket].find().equal("age", 49).limit(2).offset(1).ascending("surname").stream({
      initial: true
    });
    subscription = stream.subscribe(function(e) {
      results.push(e);
    });

    var al = new db[bucket]({
      key: 'al',
      name: 'Al',
      surname: 'Smith',
      age: 49
    });

    return helper.sleep(t, al.save())// result: Al, [ ]
        .then(function() {
          expect(results.length).to.be.equal(0);  // nothing, yet

          var bob = new db[bucket]({
            key: 'bob',
            name: 'Bob',
            surname: 'Thomas',
            age: 49
          });
          return helper.sleep(t, bob.save());// result: Al, [ Bob ]
        }).then(function() {
          expect(results.length).to.be.equal(1);
          expect(results[0].operation).to.be.equal("insert");
          expect(results[0].matchType).to.be.equal("add");
          expect(results[0].data.name).to.be.equal("Bob");
          expect(results[0].index).to.be.equal(1);

          var dave = new db[bucket]({
            key: 'dave',
            name: 'Dave',
            surname: 'Vito',
            age: 49
          });
          return helper.sleep(t, dave.save());// result: Al, [ Bob, Dave ]
        }).then(function() {
          expect(results.length).to.be.equal(2);
          expect(results[1].operation).to.be.equal("insert");
          expect(results[1].matchType).to.be.equal("add");
          expect(results[1].data.name).to.be.equal("Dave");
          expect(results[1].index).to.be.equal(2);

          var carl = new db[bucket]({
            key: 'carl',
            name: 'Carl',
            surname: 'Underhill',
            age: 49
          });
          return helper.sleep(t, carl.save());// result: Al, [ Bob, Carl ], Dave
        }).then(function() {
          expect(results.length).to.be.equal(4);
          expect(results[2].operation).to.be.equal('none');
          expect(results[2].matchType).to.be.equal("remove");
          expect(results[2].data.name).to.be.equal("Dave");
          expect(results[2].index).to.be.equal(undefined);
          expect(results[3].operation).to.be.equal("insert");
          expect(results[3].matchType).to.be.equal("add");
          expect(results[3].data.name).to.be.equal("Carl");
          expect(results[3].index).to.be.equal(2);
        }).then(function() {
          al.name = "Alvin";
          return helper.sleep(t, al.save());// result: Al, [ Bob, Carl ], Dave   | Updated in offset--> No notification
        }).then(function() {
          expect(results.length).to.be.equal(4);
        });
  });

  it("should return ordered result", function() {
    this.timeout(10000);
    var results = [];
    stream = db[bucket].find().equal("age", 49).limit(3).ascending("name").stream({
      initial: false,
      matchTypes: 'all'
    });
    subscription = stream.subscribe(function(e) {
      results.push(e);
    });

    return helper.sleep(t).then(function() {
      var al = new db[bucket]({
        key: 'al',
        name: 'Al',
        age: 49
      });
      return al.save();
    }).then(function() {
      return helper.sleep(t).then(function() {
        expect(results.length).to.be.equal(1);
        expect(results[0].operation).to.be.equal("insert");
        expect(results[0].matchType).to.be.equal("add");
        expect(results[0].data.name).to.be.equal("Al");
        expect(results[0].index).to.be.equal(0);
      });
    }).then(function() {
      return helper.sleep(t).then(function() {
        var bob = new db[bucket]({
          key: 'bob',
          name: 'Bob',
          age: 50
        });
        return bob.save();
      });
    }).then(function() {
      return helper.sleep(t).then(function() {
        expect(results.length).to.be.equal(1);
        expect(results[0].operation).to.be.equal("insert");
        expect(results[0].matchType).to.be.equal("add");
        expect(results[0].data.name).to.be.equal("Al");
        expect(results[0].index).to.be.equal(0);
      });
    })
        .then(function() {
          return helper.sleep(t).then(function() {
            var dave = new db[bucket]({
              key: 'dave',
              name: 'Dave',
              age: 49
            });
            return dave.save();
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            expect(results.length).to.be.equal(2);
            expect(results[1].operation).to.be.equal("insert");
            expect(results[1].matchType).to.be.equal("add");
            expect(results[1].data.name).to.be.equal("Dave");
            expect(results[1].index).to.be.equal(1);
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            var carl = new db[bucket]({
              key: 'carl',
              name: 'Carl',
              age: 49
            });
            return carl.save();
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            expect(results.length).to.be.equal(3);
            expect(results[2].operation).to.be.equal("insert");
            expect(results[2].matchType).to.be.equal("add");
            expect(results[2].data.name).to.be.equal("Carl");
            expect(results[2].index).to.be.equal(1);
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            var dan = new db[bucket]({
              key: 'dan',
              name: 'Dan',
              age: 49
            });
            return dan.save();
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            expect(results.length).to.be.equal(5);
            expect(results[3].operation).to.be.equal('none'); //transitive remove --> the was no operation on this objects
            expect(results[3].matchType).to.be.equal("remove");
            expect(results[3].data.name).to.be.equal("Dave");
            expect(results[3].index).to.be.equal(undefined);
            expect(results[4].operation).to.be.equal("insert");
            expect(results[4].matchType).to.be.equal("add");
            expect(results[4].data.name).to.be.equal("Dan");
            expect(results[4].index).to.be.equal(2);
          });
        });
  });

  it("should return 'none'-operation matches", function() {
    this.timeout(10000);
    var results = [];

    return helper.sleep(t).then(function() {
      var al = new db[bucket]({
        key: 'al',
        name: 'Al',
        age: 49
      });
      return al.save();
    }).then(function() {
      return helper.sleep(t).then(function() {
        expect(results.length).to.be.equal(0);
      });
    }).then(function() {
      return helper.sleep(t).then(function() {
        stream = db[bucket].find().equal("age", 49).limit(3).ascending("name").stream({
          initial: true,
          operations: 'none'
        });
        subscription = stream.subscribe(function(e) {
          results.push(e);
        });
      });
    }).then(function() {
      return helper.sleep(t).then(function() {
        expect(results.length).to.be.equal(1);
        expect(results[0].operation).to.be.equal('none'); //transitive remove --> the was no operation on this objects
        expect(results[0].matchType).to.be.equal("match");
        expect(results[0].data.name).to.be.equal("Al");
        expect(results[0].index).to.be.equal(0);

        var bob = new db[bucket]({
          key: 'bob',
          name: 'Bob',
          age: 50
        });
        return bob.save();
      });
    }).then(function() {
      return helper.sleep(t).then(function() {
        expect(results.length).to.be.equal(1);
      });
    })
        .then(function() {
          return helper.sleep(t).then(function() {
            var dave = new db[bucket]({
              key: 'dave',
              name: 'Dave',
              age: 49
            });
            return dave.save();
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            expect(results.length).to.be.equal(1);
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            var carl = new db[bucket]({
              key: 'carl',
              name: 'Carl',
              age: 49
            });
            return carl.save();
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            expect(results.length).to.be.equal(1);
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            var dan = new db[bucket]({
              key: 'dan',
              name: 'Dan',
              age: 49
            });
            return dan.save();
          });
        }).then(function() {
          return helper.sleep(t).then(function() {
            expect(results.length).to.be.equal(2);
            expect(results[1].operation).to.be.equal('none'); //transitive remove --> the was no operation on this objects
            expect(results[1].matchType).to.be.equal("remove");
            expect(results[1].data.name).to.be.equal("Dave");
            expect(results[1].index).to.be.equal(undefined);
          });
        });
  });

  it("should return inserted object", function() {
    var result;
    var query = db[bucket].find().equal("name", "franz");
    stream = query.stream({initial: false, matchTypes: 'match'});
    subscription = stream.subscribe(function(e) {
      result = e;
    });

    return helper.sleep(t).then(function() {
      var object = db[bucket].fromJSON(p3.toJSON(true));
      object.name = "franz";
      return helper.sleep(t, object.insert());
    }).then(function() {
      expect(result.matchType).to.be.equal("match");
      expect(result.data.name).to.be.equal("franz");
      expect(result.operation).to.be.equal("insert");
      expect(result.target).to.be.equal(query);
      expect(result.date.getTime()).be.ok;
      expect(result.initial).be.false;
    });
  });

  it("should resolve references from real-time matches", function() {
    this.timeout(6000);
    var franz, otherfranz;

    stream = db[bucket].find().stream({initial: false, matchTypes: 'all'});
    subscription = stream.subscribe(function(e) {
      franz = e.data;
    });

    var otherdb = emf.createEntityManager();
    otherstream = otherdb[bucket].find().stream({initial: false, matchTypes: 'all'});
    othersubscription = otherstream.subscribe(function(e) {
      otherfranz = e.data;
    });

    return helper.sleep(t).then(function() {
      var object = db[bucket].fromJSON(p3.toJSON(true));
      object.name = "franz";
      return helper.sleep(t, object.insert());
    }).then(function() {
      expect(franz.name).to.be.equal("franz");
      expect(franz.name).to.be.equal(otherfranz.name);

      // update
      franz.name = "franzl";
      expect(franz.name).to.be.equal("franzl");
      expect(otherfranz.name).to.be.equal("franz");
      return helper.sleep(t, franz.update());
    }).then(function() {
      expect(franz.name).to.be.equal("franzl");
      expect(franz.name).to.be.equal(otherfranz.name);
      expect(franz.version).to.be.equal(2);
      expect(franz.version).to.be.equal(otherfranz.version);

      // update the other way around
      otherfranz.name = "franzler";
      expect(otherfranz.name).to.be.equal("franzler");
      expect(franz.name).to.be.equal("franzl");
      return helper.sleep(t, otherfranz.update());
    }).then(function() {
      expect(otherfranz.name).to.be.equal("franzler");
      expect(franz.name).to.be.equal(otherfranz.name);
      expect(otherfranz.version).to.be.equal(3);
      expect(otherfranz.version).to.be.equal(franz.version);

      // delete
      return helper.sleep(t, otherfranz.delete());
    }).then(function() {
      expect(otherfranz.version).to.be.equal(null);
      expect(otherfranz.version).to.be.equal(franz.version);
    });
  });

  it("should parse options correctly", function() {

    // check default values
    [//
      {initial: true, matchTypes: ['all'], operations: ['any']},//
      {initial: null, matchTypes: 'all', operations: ['any']},//
      {initial: undefined, matchTypes: ['all'], operations: 'any'},//
      {initial: true, matchTypes: ['all', 'add'], operations: ['any', 'insert']},//
      {initial: true, matchTypes: ['all', 'add', 'match'], operations: ['any', 'insert', 'update']},//
      {initial: true, matchTypes: undefined, operations: undefined},//
      {initial: true, matchTypes: null, operations: null},//
      {initial: true, matchTypes: ['all']},//
      {initial: true, operations: ['any']},//
      {matchTypes: ['all'], operations: ['any']},//
      {},//
      null,//
      undefined//
    ].forEach(function(options) {
      expect(Stream.parseOptions(options)).to.be.eql({initial: true, matchTypes: ['all'], operations: ['any']});
    });

    // Operations and match type should be provide-able as item AND list
    [//
      {matchTypes: ['match']},//
      {matchTypes: 'match'},//
    ].forEach(function(options) {
      expect(Stream.parseOptions(options)).to.be.eql({initial: true, matchTypes: ['match'], operations: ['any']});
    });
    [//
      {operations: 'insert'},//
      {operations: ['insert']}//
    ].forEach(function(options) {
      expect(Stream.parseOptions(options)).to.be.eql({initial: true, matchTypes: ['all'], operations: ['insert']});
    });

    // Operations and match type must not be provided both, UNLESS one of them listens to everything anyways
    [//
      {initial: true, matchTypes: ['match'], operations: ['any', 'insert']},//
      {initial: true, matchTypes: ['match'], operations: ['any']},//
      {initial: true, matchTypes: ['match'], operations: 'any'},//
      {initial: true, matchTypes: 'match', operations: null},//
      {initial: true, matchTypes: 'match', operations: undefined},//
      {matchTypes: 'match'}//
    ].forEach(function(options) {
      expect(Stream.parseOptions(options)).to.be.eql({initial: true, matchTypes: ['match'], operations: ['any']});
    });
    [//
      {initial: true, matchTypes: ['all'], operations: ['insert']},//
      {initial: true, matchTypes: 'all', operations: 'insert'},//
      {initial: true, matchTypes: null, operations: 'insert'},//
      {initial: true, matchTypes: undefined, operations: 'insert'},//
      {operations: ['insert']}//
    ].forEach(function(options) {
      expect(Stream.parseOptions(options)).to.be.eql({initial: true, matchTypes: ['all'], operations: ['insert']});
    });
    [ //should to raise an error
      {matchTypes: ['match'], operations: ['insert']},//
      {matchTypes: 'remove', operations: 'update'},//
      {matchTypes: 1, operations: 5},//
      {initial: true, matchTypes: 'match', operations: 'none'},//
      {initial: 2},//
      {initial: 'true'}//
    ].forEach(function(options) {
      var exceptions = 0;
      try {//Should raise an error
        Stream.parseOptions(options);
        console.log('should not have been parsed: ' + JSON.stringify(options));
      } catch (e) {
        exceptions++;
      }
      expect(exceptions).to.be.equal(1);
    });
  });

  it("should normalize match type list", function() {
    var randomIterations = 100;

    var full = ['add', 'change', 'changeIndex', 'match', 'remove', 'all'];

    for (var i = 0; i < randomIterations; i++) {
      //Everything with all Should result in ['all']
      expect(Stream.normalizeMatchTypes(shuffle(full))).to.be.eql(['all']);
      expect(Stream.normalizeMatchTypes(shuffle(['all', 'change', 'changeIndex', 'match', 'add', 'remove']))).to.be.eql(['all']);
      expect(Stream.normalizeMatchTypes(shuffle(['change', 'match', 'remove', 'changeIndex', 'all']))).to.be.eql(['all']);
      expect(Stream.normalizeMatchTypes(shuffle(['add', 'changeIndex', 'match', 'all', 'remove']))).to.be.eql(['all']);
      expect(Stream.normalizeMatchTypes(shuffle(['add', 'change', 'all', 'changeIndex']))).to.be.eql(['all']);

      // duplicates should be removed
      expect(Stream.normalizeMatchTypes(shuffle(['add', 'change', 'changeIndex', 'add', 'change', 'changeIndex', 'match', 'remove', 'all']))).to.be.eql(['all']);
      expect(Stream.normalizeMatchTypes(shuffle(['add', 'add']))).to.be.eql(['add']);
      expect(Stream.normalizeMatchTypes(shuffle(['add', 'change', 'add', 'change', 'changeIndex', 'changeIndex']))).to.be.eql(['add', 'change', 'changeIndex']);

      // undefined and empty lists should result in undefined
      expect(Stream.normalizeMatchTypes(undefined)).to.be.eql(undefined);
      expect(Stream.normalizeMatchTypes(null)).to.be.eql(undefined);
      expect(Stream.normalizeMatchTypes([])).to.be.eql(undefined);

      ['Banana', 'error', null, undefined].forEach(function(invalid) {
        [[invalid], [invalid, 'change', 'add'], [invalid, 'change', 'add', 'add'], ['add', 'change', null]].forEach(function(list) {
          var exceptions = 0;
          try {//Should raise an error
            Stream.normalizeMatchTypes(shuffle(list));
          } catch (e) {
            exceptions++;
          }
          expect(exceptions).to.be.equal(1);
        });
      });
    }
  });

  it("should normalize operation list", function() {
    var randomIterations = 100;

    var full = ['insert', 'update', 'delete', 'any'];

    for (var i = 0; i < randomIterations; i++) {
      //Everything with all Should result in ['any']
      expect(Stream.normalizeOperations(shuffle(full))).to.be.eql(['any']);
      expect(Stream.normalizeOperations(shuffle(['insert', 'update', 'any']))).to.be.eql(['any']);
      expect(Stream.normalizeOperations(shuffle(['update', 'delete', 'any']))).to.be.eql(['any']);
      expect(Stream.normalizeOperations(shuffle(['insert', 'any', 'delete']))).to.be.eql(['any']);
      expect(Stream.normalizeOperations(shuffle(['insert', 'update', 'any']))).to.be.eql(['any']);
      expect(Stream.normalizeOperations(shuffle(['insert', 'any']))).to.be.eql(['any']);

      // duplicates should be removed
      expect(Stream.normalizeOperations(shuffle(['insert', 'update', 'insert', 'update', 'delete', 'any']))).to.be.eql(['any']);
      expect(Stream.normalizeOperations(shuffle(['insert', 'insert']))).to.be.eql(['insert']);
      expect(Stream.normalizeOperations(shuffle(['insert', 'update', 'insert', 'update']))).to.be.eql(['insert', 'update']);
      expect(Stream.normalizeOperations(shuffle(['insert', 'none', 'update', 'insert', 'update']))).to.be.eql(['insert', 'none', 'update']);
      expect(Stream.normalizeOperations(shuffle(['insert', 'update', 'delete']))).to.be.eql(['delete', 'insert', 'update']);
      expect(Stream.normalizeOperations(shuffle(['insert', 'delete']))).to.be.eql(['delete', 'insert']);

      // undefined and empty lists should result in undefined
      expect(Stream.normalizeOperations(undefined)).to.be.eql(undefined);
      expect(Stream.normalizeOperations(null)).to.be.eql(undefined);
      expect(Stream.normalizeOperations([])).to.be.eql(undefined);

      ['Banana', 'error', null, undefined].forEach(function(invalid) {
        [[invalid], [invalid, 'update', 'insert'], [invalid, 'update', 'insert', 'insert']].forEach(function(list) {
          var exceptions = 0;
          try {//Should raise an error
            Stream.normalizeOperations(shuffle(list));
          } catch (e) {
            exceptions++;
          }
          expect(exceptions).to.be.equal(1);
        });
      });
    }
  });

  it("should generate correct topic strings", function() {

    var topic = Stream.getTopic("bucket", "{name:'Bob'}", 2, 5, "{name:1}", Stream.normalizeMatchTypes(['changeIndex', 'add']), Stream.normalizeOperations(['insert', 'delete']));
    var expected = "bucket/{name:'Bob'}&start=2&count=5&sort={name:1}/add_changeIndex/delete_insert";
    expect(topic).to.be.equal(expected);

    topic = Stream.getTopic("bucket", "{name:'Bob'}", 2, 5, "{name:1}", Stream.normalizeMatchTypes(['changeIndex', 'change']), Stream.normalizeOperations(['insert']));
    expected = "bucket/{name:'Bob'}&start=2&count=5&sort={name:1}/change_changeIndex/insert";
    expect(topic).to.be.equal(expected);

    topic = Stream.getTopic("bucket", "{name:'Bob'}", 2, 5, "{name:1}", Stream.normalizeMatchTypes(['add']), Stream.normalizeOperations(['insert']));
    expected = "bucket/{name:'Bob'}&start=2&count=5&sort={name:1}/add/insert";
    expect(topic).to.be.equal(expected);

    topic = Stream.getTopic("bucket", "{name:'Bob'}", 2, 5, "{name:1}", Stream.normalizeMatchTypes(['add']), Stream.normalizeOperations(['insert', 'none']));
    expected = "bucket/{name:'Bob'}&start=2&count=5&sort={name:1}/add/insert_none";
    expect(topic).to.be.equal(expected);

    var exceptions = 0;
    try {//Should raise an error
      Stream.getTopic("bucket", "{name:'Bob'}", 2, 5, "{name:1}", Stream.normalizeMatchTypes(['error', 'add']), Stream.normalizeOperations(['insert']));
    } catch (e) {
      exceptions++;
    }
    expect(exceptions).to.be.equal(1);
  });

  it("should generate correct cacheable query strings", function() {
    var empty = [null, undefined, "", " ", "   ", "{}", " {}", "{} ", "{ }", " { } "];
    empty.forEach(function(query) {
      empty.forEach(function(sort) {
        expect(Stream.getCachableQueryString(query, -1, -1, sort)).to.be.equal("{}");
        expect(Stream.getCachableQueryString(query, 0, 0, sort)).to.be.equal("{}");
        expect(Stream.getCachableQueryString(query, 1, 1, sort)).to.be.equal("{}&start=1&count=1");
        expect(Stream.getCachableQueryString(query, -1, 1, sort)).to.be.equal("{}&count=1");
        expect(Stream.getCachableQueryString(query, 0, -1, sort)).to.be.equal("{}");
        expect(Stream.getCachableQueryString(query, 1, 0, sort)).to.be.equal("{}&start=1");
        expect(Stream.getCachableQueryString(query, -1, 0, sort)).to.be.equal("{}");
        expect(Stream.getCachableQueryString(query, 0, 1, sort)).to.be.equal("{}&count=1");
        expect(Stream.getCachableQueryString(query, 1, -1, sort)).to.be.equal("{}&start=1");
      });
    });

    empty.forEach(function(sort) {
      var query = "{name:'Bob'}";
      expect(Stream.getCachableQueryString(query, -1, -1, sort)).to.be.equal("{name:'Bob'}");
      expect(Stream.getCachableQueryString(query, 0, 0, sort)).to.be.equal("{name:'Bob'}");
      expect(Stream.getCachableQueryString(query, 1, 1, sort)).to.be.equal("{name:'Bob'}&start=1&count=1");
      expect(Stream.getCachableQueryString(query, -1, 1, sort)).to.be.equal("{name:'Bob'}&count=1");
      expect(Stream.getCachableQueryString(query, 0, -1, sort)).to.be.equal("{name:'Bob'}");
      expect(Stream.getCachableQueryString(query, 1, 0, sort)).to.be.equal("{name:'Bob'}&start=1");
      expect(Stream.getCachableQueryString(query, -1, 0, sort)).to.be.equal("{name:'Bob'}");
      expect(Stream.getCachableQueryString(query, 0, 1, sort)).to.be.equal("{name:'Bob'}&count=1");
      expect(Stream.getCachableQueryString(query, 1, -1, sort)).to.be.equal("{name:'Bob'}&start=1");
    });

    empty.forEach(function(query) {
      var sort = "{name:1}";
      expect(Stream.getCachableQueryString(query, -1, -1, sort)).to.be.equal("{}&sort={name:1}");
      expect(Stream.getCachableQueryString(query, 0, 0, sort)).to.be.equal("{}&sort={name:1}");
      expect(Stream.getCachableQueryString(query, 1, 1, sort)).to.be.equal("{}&start=1&count=1&sort={name:1}");
      expect(Stream.getCachableQueryString(query, -1, 1, sort)).to.be.equal("{}&count=1&sort={name:1}");
      expect(Stream.getCachableQueryString(query, 0, -1, sort)).to.be.equal("{}&sort={name:1}");
      expect(Stream.getCachableQueryString(query, 1, 0, sort)).to.be.equal("{}&start=1&sort={name:1}");
      expect(Stream.getCachableQueryString(query, -1, 0, sort)).to.be.equal("{}&sort={name:1}");
      expect(Stream.getCachableQueryString(query, 0, 1, sort)).to.be.equal("{}&count=1&sort={name:1}");
      expect(Stream.getCachableQueryString(query, 1, -1, sort)).to.be.equal("{}&start=1&sort={name:1}");
    });

    var query = "{name:'Bob'}";
    var sort = "{name:1}";
    expect(Stream.getCachableQueryString(query, -1, -1, sort)).to.be.equal("{name:'Bob'}&sort={name:1}");
    expect(Stream.getCachableQueryString(query, 0, 0, sort)).to.be.equal("{name:'Bob'}&sort={name:1}");
    expect(Stream.getCachableQueryString(query, 1, 1, sort)).to.be.equal("{name:'Bob'}&start=1&count=1&sort={name:1}");
    expect(Stream.getCachableQueryString(query, -1, 1, sort)).to.be.equal("{name:'Bob'}&count=1&sort={name:1}");
    expect(Stream.getCachableQueryString(query, 0, -1, sort)).to.be.equal("{name:'Bob'}&sort={name:1}");
    expect(Stream.getCachableQueryString(query, 1, 0, sort)).to.be.equal("{name:'Bob'}&start=1&sort={name:1}");
    expect(Stream.getCachableQueryString(query, -1, 0, sort)).to.be.equal("{name:'Bob'}&sort={name:1}");
    expect(Stream.getCachableQueryString(query, 0, 1, sort)).to.be.equal("{name:'Bob'}&count=1&sort={name:1}");
    expect(Stream.getCachableQueryString(query, 1, -1, sort)).to.be.equal("{name:'Bob'}&start=1&sort={name:1}");
  });

  it("should return removed object", function() {
    var result;
    var query = db[bucket].find().equal("name", "franzi");
    stream = query.stream({initial: false, matchTypes: 'remove'});
    subscription = stream.subscribe(function(e) {
      result = e;
    });

    var object = db[bucket].fromJSON(p3.toJSON(true));
    object.name = "franzi";

    return helper.sleep(t).then(function() {
      return object.insert();
    }).then(function() {
      return helper.sleep(t, object.delete());
    }).then(function() {
      expect(result.data.id).to.be.equal(object.id);
      expect(result.matchType).to.be.equal("remove");
      expect(result.operation).to.be.equal("delete");
      expect(result.target).to.be.equal(query);
      expect(result.date.getTime()).be.ok;
      expect(result.initial).be.false;
    });
  });

  it("should return all changes", function() {
    var results = [];
    stream = db[bucket].find().equal("age", 23).stream({initial: false, matchTypes: 'all'});
    subscription = stream.subscribe(function(e) {
      results.push(e);
    });

    var object = db[bucket].fromJSON(p3.toJSON(true));

    return helper.sleep(t).then(function() {
      object.name = "flo";
      return object.insert();
    }).then(function() {
      return helper.sleep(t).then(function() {
        object.name = "karl-friedrich";
        return object.save();
      });
    }).then(function() {
      return helper.sleep(t).then(function() {
        return object.delete();
      });
    }).then(function() {
      return helper.sleep(t).then(function() {
        expect(results.length).to.be.equal(3);
        expect(results[0].operation).to.be.equal("insert");
        expect(results[1].operation).to.be.equal("update");
        expect(results[2].operation).to.be.equal("delete");
        expect(results[2].data.id).to.be.equal(object.id);
      });
    });
  });

  it("should allow multiple listeners", function() {
    var received = [];
    var insert = db[bucket].fromJSON(p3.toJSON(true));
    insert.name = "franz";

    stream = db[bucket].find().stream({initial: false, matchTypes: 'match'});

    var listener = function(e) {
      received.push(e);
      expect(e.data.id).to.be.equal(insert.id);
    };
    subscription = stream.subscribe(listener);
    othersubscription = stream.subscribe(listener);

    return helper.sleep(t).then(function() {
      return insert.insert()
    }).then(function(obj) {
      obj.name = "frrrrranz";
      return helper.sleep(t, obj.save());
    }).then(function() {
      expect(received.length).to.be.equal(4);
    });
  });

  it("RXjs: should cancel subscription", function() {
    this.timeout(6000);

    var next = 0;
    var errors = 0;
    var completions = 0;

    var onNext = function(match) { // onNext
      next++;
    };
    var onError = function(error) { // onError
      errors++;
    };
    var onCompleted = function() {// onCompleted
      completions++;
    };

    stream = db[bucket].find().stream({initial: false, matchTypes: 'all'});

    var subscription, insert;

    return helper.sleep(1000).then(function() {
      subscription = stream.subscribe(onNext, onError, onCompleted);
      return helper.sleep(t);
    }).then(function() {
      expect(next).to.be.equal(0);
      expect(errors).to.be.equal(0);
      expect(completions).to.be.equal(0);

      insert = db[bucket].fromJSON(p1.toJSON(true));
      return helper.sleep(t, insert.insert());
    }).then(function() {
      expect(next).to.be.equal(1);
      expect(errors).to.be.equal(0);
      expect(completions).to.be.equal(0);

      insert = db[bucket].fromJSON(p2.toJSON(true));
      return helper.sleep(t, insert.insert());
    }).then(function() {
      expect(next).to.be.equal(2);
      expect(errors).to.be.equal(0);
      expect(completions).to.be.equal(0);

      subscription.unsubscribe();

      expect(next).to.be.equal(2);
      expect(errors).to.be.equal(0);
      expect(completions).to.be.equal(0);

      insert = db[bucket].fromJSON(p3.toJSON(true));
      return helper.sleep(t, insert.insert());
    }).then(function() {
      expect(next).to.be.equal(2);
      expect(errors).to.be.equal(0);
      expect(completions).to.be.equal(0);
    });
  });

  it("should allow to unregister by unsubscribing RxJS subscription", function() {
    var calls = 0;
    var listener = function(e) {
      expect(++calls).to.be.at.most(1);
    };
    stream = db[bucket].find().stream({initial: false, matchTypes: 'match'});
    subscription = stream.subscribe(listener);

    var insert;
    return helper.sleep(t).then(function() {
      insert = db[bucket].fromJSON(p3.toJSON(true));
      insert.name = "franz";
      return helper.sleep(t, insert.insert());
    }).then(function() {
      subscription.unsubscribe();
      insert.name = "";
      return helper.sleep(t, insert.save())
    }).then(function() {
      expect(calls).to.be.equal(1);
    });
  });

  it("should only be called once", function() {
    var calls = 0;
    var listener = function(e) {
      expect(++calls).to.be.at.most(1);
    };
    stream = db[bucket].find().stream({initial: false, matchTypes: 'match'});
    subscription = stream.first().subscribe(listener);

    var insert;
    return helper.sleep(t).then(function() {
      insert = db[bucket].fromJSON(p3.toJSON(true));
      insert.name = "franz";
      return helper.sleep(t, insert.insert());
    }).then(function() {
      insert.name = "";
      ;
      return helper.sleep(t, insert.save());
    }).then(function() {
      expect(calls).to.be.equal(1);
    });
  });

  it("should compute aggregate: average", function() {
    this.timeout(6000);

    var stream = db[bucket].find().stream({initial: false});

    var initialAccumulator = {
      contributors: {}, // individual activity counts go here
      count: 0, // result set cardinality
      value: 0, // overall number of activities in the result
      aggregate: undefined // value divided by count
    };
    var maintain = (accumulator, event) => {
      var newValue = event.matchType === 'remove' ? undefined : event.data.age;
      var oldValue = accumulator.contributors[event.data.id];

      if (newValue) {
        accumulator.contributors[event.data.id] = newValue;
      } else {
        delete accumulator.contributors[event.data.id];
      }
      accumulator.value += (newValue ? newValue : 0) - (oldValue ? oldValue : 0);
      accumulator.count += event.matchType === 'remove' ? -1 : event.initial || event.matchType === 'add' ? 1 : 0;
      accumulator.aggregate = accumulator.count > 0 ? accumulator.value / accumulator.count : undefined;
      return accumulator;
    };

    var average;
    subscription = stream.scan(maintain, initialAccumulator).map(accumulator=>accumulator.aggregate).subscribe(e=>average = e);

    var person;
    return helper.sleep(t).then(function() {
      console.log("no matching person --> average age: " + average);
      expect(average).to.be.equal(undefined);
      person = new db[bucket]({
        key: 'albert',
        name: 'Albert',
        age: 49
      });
      return helper.sleep(t, person.save());
    }).then(function() {
      console.log("new match: Albert (49) --> average age: " + average);
      expect(average).to.be.equal(49);
      person = new db[bucket]({
        key: 'bob',
        name: 'Bob',
        age: 51
      });
      return helper.sleep(t, person.save());
    }).then(function() {
      console.log("new match: Bob (51) --> average age: " + average);
      expect(average).to.be.equal(50);
      person = new db[bucket]({
        key: 'carl',
        name: 'Carl',
        age: 59
      });
      return helper.sleep(t, person.save());
    }).then(function() {
      console.log("new match: Carl (59) --> average age: " + average);
      expect(average).to.be.equal(53);
      return helper.sleep(t, person.delete());
    }).then(helper.sleep(t)).then(function() {
      console.log("new MISmatch: Carl (59) --> average age: " + average);
      expect(average).to.be.equal(50);
    });
  });

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }
});

