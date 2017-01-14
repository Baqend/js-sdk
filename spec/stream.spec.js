var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../streaming');
  require('rxjs/add/operator/first');
  require('rxjs/add/operator/scan');
  require('rxjs/add/operator/map');
}

describe("Streaming Queries", function() {
  // skips test for ie9 and ie10
  if (typeof window != 'undefined' && !window.WebSocket) {
    return;
  }

  var tautology= { $or: [ { value: { $exists: true } }, { value: { $exists: false } } ] };
  var Stream = DB.query.Stream;
  var t = 400;
  var bucket = helper.randomize("StreamingQueryPerson");
  var emf, metamodel, db, stream, otherstream, subscription, othersubscription;
  var p0, p1, p2, p3, objects;

  before(function() {

    var personType, addressType;
    emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage});
    metamodel = emf.metamodel;

    metamodel.addType(personType = new DB.metamodel.EntityType(bucket, metamodel.entity(Object)));
    metamodel.addType(addressType = new DB.metamodel.EmbeddableType("QueryAddress"));

    personType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("surname", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("address", addressType));
    personType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("date", metamodel.baseType(Date)));
    personType.addAttribute(new DB.metamodel.ListAttribute("colors", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("birthplace", metamodel.baseType(DB.GeoPoint)));

    addressType.addAttribute(new DB.metamodel.SingularAttribute("zip", metamodel.baseType(Number)));
    addressType.addAttribute(new DB.metamodel.SingularAttribute("city", metamodel.baseType(String)));

    return metamodel.save();
  });

  it("should parse options correctly", function() {

    // check default values
    [//
      {initial: true, matchTypes: ['all'], operations: ['any']},//
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

    [//
      {initial: null, matchTypes: 'all', operations: ['any']},//
    ].forEach(function(options) {
      expect(Stream.parseOptions(options)).to.be.eql({initial: false, matchTypes: ['all'], operations: ['any']});
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
      expect(Stream.normalizeMatchTypes(undefined)).to.be.eql(['all']);
      expect(Stream.normalizeMatchTypes(null)).to.be.eql(['all']);
      expect(Stream.normalizeMatchTypes([])).to.be.eql(['all']);

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
      expect(Stream.normalizeOperations(undefined)).to.be.eql(['any']);
      expect(Stream.normalizeOperations(null)).to.be.eql(['any']);
      expect(Stream.normalizeOperations([])).to.be.eql(['any']);

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

  it("should use websocket configuration of the connect script", function() {
    return new DB.EntityManagerFactory({host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage, websocket: '//events.localhost'}).createEntityManager().ready().then(function(db) {
      var websocket = db.entityManagerFactory.websocket;
      expect(websocket.url).equal('wss://events.localhost');
    });
  });

  describe('stream', function() {
    var db, objects;

    beforeEach(function() {
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
      return helper.sleep(t, Promise.all([p0.save({force: true}), p1.save({force: true}), p2.save({force: true}), p3.save({force: true})]));
    });

    afterEach(function() {
      this.timeout(5000);
      //Remove excess objects
      //Unregister subscriptions and streams
      if (subscription) {
        subscription.unsubscribe();
        subscription = undefined;
      }

      if (othersubscription) {
        othersubscription.unsubscribe();
        othersubscription = undefined;
      }

      return db[bucket].find().resultList(function(result) {
        return Promise.all(result.map(function(person) {
          return person.delete();
        }));
      });
    });

    it("should return the initial result", function() {//TODO broken!
      var received = [];
      var query = db[bucket].find().where(tautology).limit(3);
      stream = query.stream();
      subscription = stream.subscribe(function(e) {
        received.push(e);
      });

      return helper.sleep(t).then(function() {
        expect(received.length).to.be.equal(3);
        received.forEach(function(result) {
          expect(result.matchType).to.be.equal("add");
          expect(objects).to.include(result.data);
          expect(result.operation).to.be.equal('none');
          expect(result.target).to.be.equal(query);
          expect(result.date.getTime()).be.ok;
          expect(result.initial).be.true;
        });
      });
    });

    it("should return updated object", function() {//TODO broken!
      var result;
      var query = db[bucket].find().where(tautology);
      stream = query.stream({initial: false, matchTypes: 'match'});
      subscription = stream.subscribe(function(e) {
        result = e;
      });

    return helper.sleep(t).then(function() {
      p1.name = "Felix";
      return p1.save();
    }).then(helper.sleep(t),function() {
      expect(result.matchType).to.be.equal("match");
      expect(result.data).to.be.equal(p1);
      expect(result.operation).to.be.equal("update");
      expect(result.target).to.be.equal(query);
      expect(result.date.getTime()).be.ok;
      expect(result.initial).be.not.true;
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
            expect(results[0].index).to.be.equal(0);

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
            expect(results[1].index).to.be.equal(1);

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
            expect(results[3].index).to.be.equal(1);
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
          expect(results[0].matchType).to.be.equal("add");
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
        expect(result.initial).not.be.true;
      });
    });

    it("should resolve references from real-time matches", function() {
      this.timeout(6000);
      var franz, otherfranz;

      stream = db[bucket].find().where(tautology).stream({initial: false, matchTypes: 'all'});
      subscription = stream.subscribe(function(e) {
        franz = e.data;
      });

      var otherdb = emf.createEntityManager();
      otherstream = otherdb[bucket].find().where(tautology).stream({initial: false, matchTypes: 'all'});
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
        expect(result.initial).not.be.true;
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

      stream = db[bucket].find().where(tautology).stream({initial: false, matchTypes: 'match'});

      var listener = function(e) {
        received.push(e);
        expect(e.data.id).to.be.equal(insert.id);
      };
      subscription = stream.subscribe(listener);
      othersubscription = stream.subscribe(listener);

      return helper.sleep(t).then(function() {
        return insert.insert()
      }).then(function(obj) {
        return helper.sleep(t, obj);
      }).then(function(obj) {
        obj.name = "frrrrranz";
        othersubscription.unsubscribe();
        return helper.sleep(t, obj.save());
      }).then(function() {
        expect(received.length).to.be.equal(3);
      });
    });

    it("should cancel subscription", function() {
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

      stream = db[bucket].find().where(tautology).stream({initial: false, matchTypes: 'all'});

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

    it("should cancel serverside subscription", function() {
      this.timeout(6000);

      var next = 0;
      var msg = 0;

      var onNext = function(match) { // onNext
        next++;
      };

      var stream1 = db[bucket].find().where(tautology).stream({initial: false, matchTypes: 'all'});
      var stream2 = db[bucket].find().where(tautology).stream({initial: false, matchTypes: 'all'});
      var subscription1, subscription2, socket, insert;

      return db.entityManagerFactory.websocket.open().then(function(s) {
        socket = s;
        socket.addEventListener('message', function listener() {
          msg++;
          if (msg > 5) {
            socket.removeEventListener('message', listener);
          }
        })
      }).then(function() {
        subscription1 = stream1.subscribe(onNext);
        subscription2 = stream2.subscribe(onNext);
        return helper.sleep(t);
      }).then(function() {
        expect(next).to.be.equal(0);
        expect(msg).to.be.equal(2); //subscription messages

        insert = db[bucket].fromJSON(p1.toJSON(true));
        return helper.sleep(t, insert.insert());
      }).then(function() {
        expect(next).to.be.equal(2);
        expect(msg).to.be.equal(4); //insert messages
        subscription1.unsubscribe();
        subscription2.unsubscribe();
        return helper.sleep(t);
      }).then(function() {
        insert = db[bucket].fromJSON(p2.toJSON(true));
        return helper.sleep(t, insert.insert());
      }).then(function() {
        expect(next).to.be.equal(2);
        expect(msg).to.be.equal(4); //no insert message

      });
    });

    it("should allow to unregister by unsubscribing subscription", function() {
      var calls = 0;
      var listener = function(e) {
        expect(++calls).to.be.at.most(1);
      };
      stream = db[bucket].find().where(tautology).stream({initial: false, matchTypes: 'match'});
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

    it("should raise error on subscription", function() {
      var next = 0;
      var errors = 0;
      var completions = 0;

      var onNext = function(match) { // onNext
        next++;
      };
      var onError = function(error) { // onError
        errors++;
        console.log('name');
      };
      onError = function(error) { // onError
        errors++;
      };

      stream = db[bucket].find()
          .matches('name', /^My Todo/)
          .ascending('name')
          .stream();

      return helper.sleep(1000).then(function() {
        subscription = stream.subscribe(onNext, onError);
        return helper.sleep(t);
      }).then(function() {
        expect(next).to.be.equal(0);
        expect(errors).to.be.equal(1);
      });
    });

    describe('RxJS', function() {
      var _Observable = DB.Observable;

      before(function() {
        if (!helper.isNode) {
          return helper.load('Rx').then(function(Rx) {
            DB.Observable = Rx.Observable;
          });
        }
      });

      after(function() {
        if (!helper.isNode) {
          DB.Observable = _Observable;
        }
      });

      it("should only be called once", function() {
        var calls = 0;
        var listener = function(e) {
          expect(++calls).to.be.at.most(1);
        };
        stream = db[bucket].find().where(tautology).stream({initial: false, matchTypes: 'match'});
        subscription = stream.first().subscribe(listener);

        var insert;
        return helper.sleep(t).then(function() {
          insert = db[bucket].fromJSON(p3.toJSON(true));
          insert.name = "franz";
          return insert.insert();
        }).then(function() {
          insert.name = "";
          return helper.sleep(t, insert.save())
        }).then(function() {
          expect(calls).to.be.equal(1);
        });
      });

      it("should compute aggregate: average", function() {//TODO broken!
        this.timeout(6000);

        stream = db[bucket].find().where(tautology).stream({initial: false});
        var initialAccumulator = {
          contributors: {}, // individual activity counts go here
          count: 0, // result set cardinality
          value: 0, // overall number of activities in the result
          aggregate: undefined // value divided by count
        };
        var maintain = function(accumulator, event) {
          var newValue = event.matchType === 'remove' ? undefined : event.data.age;
          var oldValue = accumulator.contributors[event.data.id];

          if (newValue) {
            accumulator.contributors[event.data.id] = newValue;
          } else {
            delete accumulator.contributors[event.data.id];
          }
          accumulator.value += (newValue ? newValue : 0) - (oldValue ? oldValue : 0);
          accumulator.count += event.matchType === 'remove' ? -1 : event.matchType === 'add' ? 1 : 0;
          accumulator.aggregate = accumulator.count > 0 ? accumulator.value / accumulator.count : undefined;
          return accumulator;
        };

        var average;
        subscription = stream.scan(maintain, initialAccumulator).map(function(accumulator) {
          return accumulator.aggregate;
        }).subscribe(function(e) {
          return average = e;
        });

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
    });
  });

  describe('streamResult', function() {
    var sub, result, expectedResult = [], offset = 5, limit = 10, db2;

    before(function() {
      db = emf.createEntityManager();
      db2 = emf.createEntityManager();

      var inserts = 'abcdefghijklmnopqrst'.split('').map(function(char) {
        return insert(new db[bucket]({
          age: 49,
          surname: char + 'test'
        }));
      });

      return Promise.all(inserts).then(function() {
        stream = db[bucket].find()
            .equal("age", 49)
            .ascending("surname")
            .limit(limit)
            .offset(offset)
            .streamResult();

        sub = stream.subscribe(function(e) {
          result = e.data;
        });

        return waitOn('all').then(function(result) {
          expectResult(result);
        });
      });
    });

    after(function() {
      sub.unsubscribe();
    });

    it('should stream matching insert', function() {
      var obj = new db[bucket]({
        age: 49,
        surname: expectedResult[2].surname + 'a'
      });

      insert(obj);

      return waitOn('add').then(function(result) {
        expectResult(result);
      });
    });

    it('should not stream none matching insert', function() {
      var obj = new db[bucket]({
        age: 48,
        surname: 'btest'
      });

      insert(obj);

      return expect(waitOn('all')).rejectedWith('timed out');
    });

    it('should stream matching offset insert', function() {
      var obj = new db[bucket]({
        age: 49,
        surname: 'aaa'
      });

      insert(obj);

      return waitOn('add').then(function(result) {
        expect(result).not.include(obj);
        expectResult(result);
      });
    });

    it('should not stream matching behind limit insert', function() {
      var obj = new db[bucket]({
        age: 49,
        surname: 'zzz'
      });

      insert(obj);

      return expect(waitOn('all')).rejectedWith('timed out');
    });

    it('should stream updated object within limit', function() {
      var obj = result[2];
      obj.surname = result[3].surname + 'b';

      update(obj);

      return waitOn('changeIndex').then(function(result) {
        expect(result[3]).equal(obj);
        expectResult(result);
      })
    });

    it('should not stream updated object within offset', function() {
      var obj = expectedResult[1];
      obj.surname = expectedResult[1].surname + 'c';

      update(obj);

      return expect(waitOn('all')).rejectedWith('timed out');
    });

    it('should not stream updated object behind limit', function() {
      var obj = expectedResult[expectedResult.length - 2];
      obj.surname = expectedResult[expectedResult.length - 1].surname + 'd';

      update(obj);

      return expect(waitOn('all')).rejectedWith('timed out');
    });

    it('should stream updated object moved from result to offset', function() {
      var obj = result[2];
      var newObj = expectedResult[offset - 1];
      obj.surname = expectedResult[1].surname + 'e';

      update(obj);

      return waitOn('add').then(function(result) {
        expect(result[0]).equal(newObj);
        expect(result).not.include(obj);
        expectResult(result);
        expect(obj.version).to.not.be.null;
      })
    });

    it('should stream updated object moved from offset to result', function() {
      var obj = expectedResult[2];
      var droppedObj = result[0];
      obj.surname = droppedObj.surname + 'f';

      update(obj);

      return waitOn('add').then(function(result) {
        expect(result[0]).equal(obj);
        expect(result).not.include(droppedObj);
        expectResult(result);
      })
    });

    it('should stream updated object moved from result to behind limit', function() {
      var obj = result[8];
      var addObj = expectedResult[offset + limit];
      obj.surname = expectedResult[expectedResult.length - 3].surname + 'g';

      update(obj);

      return waitOn('add').then(function(result) {
        expect(result[limit - 1]).equal(addObj);
        expect(result).not.include(obj);
        expectResult(result);
      })
    });

    it('should stream updated object moved from behind limit to result', function() {
      var obj = expectedResult[expectedResult.length - 2];
      var droppedObj = result[limit - 1];
      obj.surname = result[2].surname + 'h';

      update(obj);

      return waitOn('add').then(function(result) {
        expect(result[3]).equal(obj);
        expect(result).not.include(droppedObj);
        expectResult(result);
      })
    });

    it('should stream updated object none matching -> result', function() {
      var obj = new db[bucket]({
        age: 48,
        surname: result[3].surname + 'h'
      });

      var droppedObj = result[limit - 1];
      return obj.insert().then(function() {
        obj.age = 49;

        update(obj);

        return waitOn('add');
      }).then(function(result) {
        expect(result[4]).equal(obj);
        expect(result).not.include(droppedObj);
        expectResult(result);
      });
    });

    it('should stream updated object none matching -> offset', function() {
      var obj = new db[bucket]({
        age: 48,
        surname: expectedResult[1].surname + 'i'
      });

      var droppedObj = result[limit - 1];
      var addObj = expectedResult[offset - 1];
      return obj.insert().then(function() {
        obj.age = 49;

        update(obj);

        return waitOn('add');
      }).then(function(result) {
        expect(result[0]).equal(addObj);
        expect(result).not.include(droppedObj);
        expect(result).not.include(obj);
        expectResult(result);
      });
    });

    it('should stream updated object none matching -> behind limit', function() {
      var obj = new db[bucket]({
        age: 48,
        surname: expectedResult[expectedResult.length - 1].surname + 'j'
      });

      return obj.insert().then(function() {
        obj.age = 49;

        update(obj);

        return expect(waitOn('all')).rejectedWith('timed out');
      });
    });

    it('should stream updated object result -> none matching', function() {
      var obj = result[3];
      var addObj = expectedResult[offset + limit];

      obj.age = 10;

      update(obj);

      return waitOn('add').then(function(result) {
        expect(result[limit - 1]).equal(addObj);
        expect(result).not.include(obj);
        expectResult(result);
      })
    });

    it('should stream updated object offset -> none matching', function() {
      var obj = expectedResult[3];
      var droppedObj = result[0];
      var addObj = expectedResult[offset + limit];

      obj.age = 10;

      update(obj);

      return waitOn('add').then(function(result) {
        expect(result[limit - 1]).equal(addObj);
        expect(result).not.include(obj);
        expect(result).not.include(droppedObj);
        expectResult(result);
      })
    });

    it('should not stream updated object behind limit -> none matching', function() {
      var obj = expectedResult[expectedResult.length - 2];

      obj.age = 10;

      update(obj);

      return expect(waitOn('all')).rejectedWith('timed out');
    });

    it('should stream deleted object in result', function() {
      var obj = result[3];
      var addObj = expectedResult[offset + limit];

      remove(obj);

      return waitOn('add').then(function(result) {
        expect(result[limit - 1]).equal(addObj);
        expect(result).not.include(obj);
        expectResult(result);
      })
    });

    it('should stream deleted object in offset', function() {
      var obj = expectedResult[3];
      var droppedObj = result[0];
      var addObj = expectedResult[offset + limit];

      remove(obj);

      return waitOn('add').then(function(result) {
        expect(result[limit - 1]).equal(addObj);
        expect(result).not.include(obj);
        expect(result).not.include(droppedObj);
        expectResult(result);
      })
    });

    it('should not stream deleted object behind limit', function() {
      var obj = expectedResult[expectedResult.length - 2];

      remove(obj);

      return expect(waitOn('all')).rejectedWith('timed out');
    });

    it('should stream external inserted object', function() {
      var obj = new db2[bucket]({
        age: 49,
        name: 'Inserted',
        surname: result[4].surname + 'k'
      });

      obj.save();

      return waitOn('add').then(function(result) {
        expect(result[5].name).eql('Inserted');

        expectedResult.push(db.getReference(obj.id));
        sort();

        expectResult(result);
      });
    });

    it('should stream external updated object', function() {
      db2[bucket].load(result[2].id).then(function(obj) {
        obj.name = 'TestName';
        return obj.save();
      });

      return waitOn('change').then(function(result) {
        expect(result[2].name).eql('TestName');
        expectResult(result);
      });
    });

    it('should stream external deleted object', function() {
      var droppedObj = result[2];

      db2[bucket].load(droppedObj.id).then(function(obj) {
        return obj.delete();
      });

      return waitOn('add').then(function(result) {
        expect(result).not.include(droppedObj);
        expect(db.contains(droppedObj)).be.false;

        expectedResult.splice(expectedResult.indexOf(droppedObj), 1);
        expectResult(result);
      });
    });

    function insert(obj) {
      return obj.insert().then(function() {
        if (obj.age == 49) {
          expectedResult.push(obj);
          sort();
        }
      });
    }

    function update(obj) {
      var index = expectedResult.indexOf(obj);
      if (obj.age == 49) {
        if (index == -1)
          expectedResult.push(obj);
      } else {
        if (index != -1)
          expectedResult.splice(index, 1);
      }
      sort();
      return obj.update();
    }

    function remove(obj) {
      return obj.delete().then(function() {
        expectedResult.splice(expectedResult.indexOf(obj), 1);
      });
    }

    function expectResult(result) {
      var expected = expectedResult.slice(offset, offset + limit);
      expected.forEach(function(obj, index) {
        expect(result[index], "Object at " + index + " is not equal").equal(obj);
      });
    }

    function sort() {
      expectedResult.sort(function(a, b) {
        if (a.age == b.age) {
          return a.surname < b.surname? -1: 1;
        } else {
          return a.age - b.age;
        }
      });
    }

    function waitOn(matchType) {
      return new Promise(function(success, error) {
        var subscription = stream.subscribe(function(e) {
          if (matchType == 'all' || e.matchType == matchType) {
            subscription.unsubscribe();
            success(e.data);
          }
        });

        setTimeout(function() {
          subscription.unsubscribe();
          error(new Error('Wait on ' + matchType + ' timed out.'));
        }, 500);
      });
    }
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

