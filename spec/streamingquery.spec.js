var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../streaming');
  require('rxjs/add/operator/first');
  require('rxjs/add/operator/scan');
  require('rxjs/add/operator/map');
}
describe("New Streaming Queries", function() {
  // skips test for ie9 and ie10
  if (typeof window != 'undefined' && !window.WebSocket) {
    return;
  }

  var Stream = DB.query.Stream;
  var t = 1000;
  var bucket = helper.randomize("StreamingQueryPerson");
  var emf, metamodel, db, otherDb, query, otherQuery, stream, otherStream, subscription, otherSubscription;
  var sameForAll = helper.randomize("same for all persons in the current test");

  function expectEvent(matchType, todoAfterSubscription) {
    return new Promise(function(resolve, reject) {
      var sub = stream.subscribe(function(e) {
        if (!matchType || matchType === 'all' || matchType === e.matchType) {
          sub.unsubscribe();
          resolve(e);
        }
      });
      if (todoAfterSubscription) {
        todoAfterSubscription();
      }

      setTimeout(function() {
        sub.unsubscribe();
        reject(new Error('Wait on event timed out.'));
      }, t);
    });
  }

  function expectNoEvent(todoAfterSubscription) {
    return new Promise(function(resolve, reject) {
      var sub = stream.subscribe(function(e) {
        sub.unsubscribe();
        reject(e);
      });
      if (todoAfterSubscription) {
        todoAfterSubscription();
      }

      setTimeout(function() {
        sub.unsubscribe();
        resolve();
      }, t);
    });
  }


  function clearSubs() {
    if (subscription) {
      subscription.unsubscribe();
      subscription = undefined;
    }
    if (otherSubscription) {
      otherSubscription.unsubscribe();
      otherSubscription = undefined;
    }
  }

  /**
   *
   * @param age the age of the person
   * @param name the name of the person
   * @returns {*|Promise.<binding.Entity>|{value}}
   */
  function newPerson(age, name) {
    name = name || 'defaultname';
    age = age || 20;
    return new db[bucket]({
      key: helper.randomize(name.toLowerCase()),
      name: name,
      age: age,
      testID: sameForAll
    });
  }


  function insertPerson(age, name) {
    return newPerson(age, name).insert();
  }

  /**
   *
   * @param array a list
   * @returns {*} the same list, but with shuffled items
   */
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

  function clearBucket() {
    var database = db || otherDb;
    if (database) {
      if (database[bucket]) {
        return database[bucket].find().resultList(function(result) {
          return Promise.all(result.map(function(entity) {
            return entity.delete();
          }));
        });
      }
    }
  }

  function clearAll() {
    clearSubs();
    return helper.sleep(t).then(function() {// wait to avoid abort through conflict
      return helper.sleep(t, clearBucket());//wait to make sure that errors are thrown before the function returns
    });
  }

  before(function() {
    this.timeout(10000);
    var personType, addressType;
    emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage});
    metamodel = emf.metamodel;

    metamodel.addType(personType = new DB.metamodel.EntityType(bucket, metamodel.entity(Object)));
    metamodel.addType(addressType = new DB.metamodel.EmbeddableType("QueryAddress"));

    personType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("surname", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("testID", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("address", addressType));
    personType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("date", metamodel.baseType(Date)));
    personType.addAttribute(new DB.metamodel.ListAttribute("colors", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("birthplace", metamodel.baseType(DB.GeoPoint)));

    addressType.addAttribute(new DB.metamodel.SingularAttribute("zip", metamodel.baseType(Number)));
    addressType.addAttribute(new DB.metamodel.SingularAttribute("city", metamodel.baseType(String)));

    return metamodel.save().then(function() {
      db = emf.createEntityManager();
      otherDb = emf.createEntityManager();
    }).then(function() {
      return clearAll();
    });
  });

  after(function() {
    this.timeout(10000);
    return clearAll();
  });

  describe('general', function() {

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
      this.timeout(10000);
      return new DB.EntityManagerFactory({
        host: env.TEST_SERVER,
        schema: {},
        tokenStorage: helper.rootTokenStorage,
        websocket: '//events.localhost'
      }).createEntityManager().ready().then(function(db) {
        var websocket = db.entityManagerFactory.websocket;
        expect(websocket.url).equal('wss://events.localhost');
      });
    });

    it("should unsubscribe streamResult immediately", function() {
      this.timeout(10000);
      var result, inserts;

      // Insert a bunch of elements
      inserts = 'abcdefghijklmnopqrstuvwxyz'.split('').map(function(char) {
        return new db[bucket]({
          age: 64,
          surname: char + ' subscription test'
        }).insert();
      });


      return helper.sleep(t, Promise.all(inserts))// make sure we only get the initial result and no events
      // subscribe to a top-5 query (including Slack, this query should not maintain all 50 elements in InvaliDB)
          .then(function() {
            return new Promise(function(resolve, reject) {
              query = db[bucket].find()
                  .equal("age", 64)
                  .ascending("surname")
                  .limit(5);
              stream = query.streamResult();
              subscription = stream.subscribe(function(e) {
                resolve(e);
              }, function(e) {
                reject(e);
              });
            });
          }).then(function(event) {
            expect(event).to.be.ok;
            result = event.data;
            return expect(result.length).to.equal(5);
          }).then(function() {
            // unsubscribe and wait a little bit
            return helper.sleep(t, subscription.unsubscribe());
          }).then(function() {
            // delete all 50 elements: if the query has not been unsubscribe, we will receive an error, because the query results cannot be maintained in InvaliDB as soon as less than 10 elements are available server-side
            return helper.sleep(t, clearBucket());
          });
    });
  });

  describe('stream', function() {
    beforeEach(clearSubs)

    it("should return updated object", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var result;
      query = db[bucket].find().equal('testID', sameForAll);
      stream = query.stream({initial: false, operations: 'update'});
      subscription = stream.subscribe(function(e) {
        result = e;
      });
      var person = newPerson(29, "Feelliiix");

      return helper.sleep(t).then(function() {
        return expectNoEvent(function() {
          return person.insert();
        });
      }).then(function() {
        expect(result).to.be.not.ok;

        return expectEvent('change', function() {
          person.name = "Felix";
          return person.save();
        });
      }).then(function() {
        expect(result).to.be.ok;
        expect(result.matchType).to.be.equal("change");
        expect(result.data).to.be.equal(person);
        expect(result.operation).to.be.equal("update");
        expect(result.target).to.be.equal(query);
        expect(result.date.getTime()).be.ok;
        expect(result.initial).be.not.true;
      });
    });

    it("should maintain offset", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var results = [];
      query = db[bucket].find().equal('testID', sameForAll).limit(2).offset(1).ascending("name");
      stream = query.stream({
        initial: true
      });
      subscription = stream.subscribe(function(e) {
        results.push(e);
      });

      var al = newPerson(49, 'Al');
      var bob = newPerson(49, 'Bob');
      var carl = newPerson(49, 'Carl');
      var dave = newPerson(49, 'Dave');

      return expectNoEvent(function() {
        return al.insert();// result: Al, [ ]
      }).then(function() {
        expect(results.length).to.be.equal(0);  // nothing, yet

        return expectEvent('all', function() {
          return bob.insert();// result: Al, [ Bob ]
        });
      }).then(function() {
        expect(results.length).to.be.equal(1);
        expect(results[0].operation).to.be.equal("insert");
        expect(results[0].matchType).to.be.equal("add");
        expect(results[0].data.name).to.be.equal("Bob");
        expect(results[0].index).to.be.equal(0);

        return expectEvent('all', function() {
          return dave.insert();// result: Al, [ Bob, Dave ]
        });
      }).then(function() {
        expect(results.length).to.be.equal(2);
        expect(results[1].operation).to.be.equal("insert");
        expect(results[1].matchType).to.be.equal("add");
        expect(results[1].data.name).to.be.equal("Dave");
        expect(results[1].index).to.be.equal(1);

        return expectEvent('add', function() {
          return carl.insert();// result: Al, [ Bob, Carl ], Dave
        });
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

        al.name = "Alvin";
        return expectNoEvent(function() {
          return al.save();// result: Al, [ Bob, Carl ], Dave   | Updated in offset--> No notification
        });
      }).then(function() {
        expect(results.length).to.be.equal(4);
      });
    });

    it("should return ordered result", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);

      var results = [];
      var al = newPerson(49, 'Al');
      var bob = newPerson(49, 'Bob');
      var carl = newPerson(49, 'Carl');
      var dave = newPerson(49, 'Dave');
      var dan = newPerson(49, 'Dan');


      query = db[bucket].find();
      var condition1 = query.equal("age", 49);
      var condition2 = query.equal('testID', sameForAll);
      query = query.and(condition1, condition2).limit(3).ascending("name");
      stream = query.stream();
      subscription = stream.subscribe(function(e) {
        results.push(e);
      });

      return helper.sleep(t).then(function() {
        return expectEvent('add', function() {
          return al.insert();
        });
      }).then(function() {
        expect(results.length).to.be.equal(1);
        //operation could be either 'insert' or 'none'
        expect(results[0].matchType).to.be.equal("add");
        expect(results[0].data.name).to.be.equal("Al");
        expect(results[0].index).to.be.equal(0);

        bob.age = 50;
        return expectNoEvent(function() {
          return bob.insert();
        });
      }).then(function() {
        return expectEvent('add', function() {
          return dave.insert();
        });
      }).then(function() {
        expect(results.length).to.be.equal(2);
        expect(results[1].operation).to.be.equal("insert");
        expect(results[1].matchType).to.be.equal("add");
        expect(results[1].data.name).to.be.equal("Dave");
        expect(results[1].index).to.be.equal(1);

        return expectEvent('add', function() {
          return carl.insert();
        });
      }).then(function() {
        expect(results.length).to.be.equal(3);
        expect(results[2].operation).to.be.equal("insert");
        expect(results[2].matchType).to.be.equal("add");
        expect(results[2].data.name).to.be.equal("Carl");
        expect(results[2].index).to.be.equal(1);

        return expectEvent('add', function() {
          return dan.insert();
        });
      }).then(function() {
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

    it("should return 'none'-operation matches", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var results = [];
      var al = newPerson(49, 'Al');
      var bob = newPerson(49, 'Bob');
      var carl = newPerson(49, 'Carl');
      var dave = newPerson(49, 'Dave');
      var dan = newPerson(49, 'Dan');

      return helper.sleep(t, al.insert()).then(function() {
        query = db[bucket].find();
        var condition1 = query.equal("age", 49);
        var condition2 = query.equal('testID', sameForAll);
        query = query.and(condition1, condition2).limit(3).ascending("name");
        stream = query.stream({
          initial: true,
          operations: 'none'
        });

        subscription = stream.subscribe(function(e) {
          results.push(e);
        });

        return helper.sleep(t);
      }).then(function() {
        expect(results.length).to.be.equal(1);
        expect(results[0].operation).to.be.equal('none'); // initial match --> there was no operation on this objects
        expect(results[0].matchType).to.be.equal("add");
        expect(results[0].data.name).to.be.equal("Al");
        expect(results[0].index).to.be.equal(0);

        bob.age = 50;
        return expectNoEvent(function() {
          return bob.insert();
        });
      }).then(function() {
        expect(results.length).to.be.equal(1);

        return expectNoEvent(function() {
          return dave.insert();
        });
      }).then(function() {
        expect(results.length).to.be.equal(1);

        return expectNoEvent(function() {
          return carl.insert();
        });
      }).then(function() {
        expect(results.length).to.be.equal(1);

        return expectEvent('all', function() {
          return dan.insert();
        });
      }).then(function() {
        expect(results.length).to.be.equal(2);
        expect(results[1].operation).to.be.equal('none'); //transitive remove --> the was no operation on this objects
        expect(results[1].matchType).to.be.equal("remove");
        expect(results[1].data.name).to.be.equal("Dave");
        expect(results[1].index).to.be.equal(undefined);
      });
    });

    it("should return inserted object", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var result;
      query = db[bucket].find().equal('testID', sameForAll);
      stream = query.stream({initial: false, matchTypes: 'match'});
      subscription = stream.subscribe(function(e) {
        result = e;
      });

      return helper.sleep(t).then(function() {
        return expectEvent('all', function() {
          return insertPerson(29, "franz");
        });
      }).then(function() {
        expect(result).to.be.ok;
        expect(result.matchType).to.be.equal("match");
        expect(result.data.age).to.be.equal(29);
        expect(result.data.name).to.be.equal("franz");
        expect(result.operation).to.be.equal("insert");
        expect(result.target).to.be.equal(query);
        expect(result.date.getTime()).be.ok;
        expect(result.initial).not.be.true;
      });
    });

    it("should resolve references from real-time matches", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var franz, otherFranz;

      query = db[bucket].find().equal('testID', sameForAll);
      stream = query.stream();
      subscription = stream.subscribe(function(e) {
        franz = e.data;
      });

      otherQuery = otherDb[bucket].find().equal('testID', sameForAll);
      otherStream = otherQuery.stream();
      otherSubscription = otherStream.subscribe(function(e) {
        otherFranz = e.data;
      });

      var person = newPerson(20, "franz");
      // we don't wait for events, because we have to streams here and not only a single one
      return helper.sleep(t, person.insert()).then(function() {
        expect(franz).to.be.ok;
        expect(otherFranz).to.be.ok;
        expect(franz.name).to.be.equal("franz");
        expect(franz.name).to.be.equal(otherFranz.name);

        // update
        franz.name = "franzl";
        expect(franz.name).to.be.equal("franzl");
        expect(otherFranz.name).to.be.equal("franz");
        return helper.sleep(t, franz.update());
      }).then(function() {
        expect(franz.name).to.be.equal("franzl");
        expect(franz.name).to.be.equal(otherFranz.name);
        expect(franz.version).to.be.equal(2);
        expect(franz.version).to.be.equal(otherFranz.version);

        // update the other way around
        otherFranz.name = "franzler";
        expect(otherFranz.name).to.be.equal("franzler");
        expect(franz.name).to.be.equal("franzl");
        return helper.sleep(t, otherFranz.update());
      }).then(function() {
        expect(otherFranz.name).to.be.equal("franzler");
        expect(franz.name).to.be.equal(otherFranz.name);
        expect(otherFranz.version).to.be.equal(3);
        expect(otherFranz.version).to.be.equal(franz.version);

        // delete
        return helper.sleep(t, otherFranz.delete());
      }).then(function() {
        expect(otherFranz.version).to.be.equal(null);
        return expect(otherFranz.version).to.be.equal(franz.version);
      });
    });

    it("should return removed object", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var result;
      query = db[bucket].find().equal('testID', sameForAll);
      stream = query.stream({initial: false, matchTypes: 'remove'});
      subscription = stream.subscribe(function(e) {
        result = e;
      });

      var person = newPerson();
      return helper.sleep(t).then(function() {
        return expectNoEvent(function() {
          return person.insert();
        });
      }).then(function() {
        return expectEvent('all', function() {
          return person.delete();
        });
      }).then(function() {
        expect(result.data.id).to.be.equal(person.id);
        expect(result.matchType).to.be.equal("remove");
        expect(result.operation).to.be.equal("delete");
        expect(result.target).to.be.equal(query);
        expect(result.date.getTime()).be.ok;
        expect(result.initial).not.be.true;
      });
    });

    it("should return all changes", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var results = [];
      query = db[bucket].find().equal('testID', sameForAll);
      stream = query.stream({initial: false, matchTypes: 'all'});
      subscription = stream.subscribe(function(e) {
        results.push(e);
      });

      var person = newPerson(29, 'Felix');

      return helper.sleep(t).then(function() {
        return expectEvent('all', function() {
          return person.insert();
        });
      }).then(function() {
        person.name = "Flo";
        return expectEvent('all', function() {
          return person.save();
        });
      }).then(function() {
        return expectEvent('all', function() {
          return person.delete();
        });
      }).then(function() {
        expect(results.length).to.be.equal(3);
        expect(results[0].operation).to.be.equal("insert");
        expect(results[1].operation).to.be.equal("update");
        expect(results[2].operation).to.be.equal("delete");
        expect(results[2].data.id).to.be.equal(person.id);
      });
    });

    it("should allow multiple listeners", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var received = [];
      var person = newPerson(33);

      query = db[bucket].find().equal('testID', sameForAll);
      stream = query.stream({initial: false, matchTypes: 'match'});

      var listener = function(e) {
        received.push(e);
        expect(e.data.id).to.be.equal(person.id);
      };
      subscription = stream.subscribe(listener);
      otherSubscription = stream.subscribe(listener);

      return helper.sleep(t).then(function() {
        return expectEvent('all', function() {
          return person.insert();
        });
      }).then(function() {
        person.age = 32;
        otherSubscription.unsubscribe();
        return expectEvent('all', function() {
          return person.save();
        });
      }).then(function() {
        expect(received.length).to.be.equal(3);
      });
    });

    it("should return the initial result", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var people = [newPerson(), newPerson(), newPerson(), newPerson()];
      return helper.sleep(t, Promise.all(people.map(function(p) {
        p.insert();
      }))).then(function() {
        var received = [];
        query = db[bucket].find().equal('testID', sameForAll).limit(3);
        stream = query.stream();
        subscription = stream.subscribe(function(e) {
          received.push(e);
        });

        return helper.sleep(t).then(function() {
          expect(received.length).to.be.equal(3);
          return received.forEach(function(result) {
            expect(result.matchType).to.be.equal("add");
            expect(people).to.include(result.data);
            expect(result.operation).to.be.equal('none');
            expect(result.target).to.be.equal(query);
            expect(result.date.getTime()).be.ok;
            expect(result.initial).be.true;
          });
        });
      });
    });

    it("should cancel serverside subscription", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);

      var socket;
      var next = 0;
      var msg = 0;

      var onNext = function(match) { // onNext
        next++;
      };

      var options = {
        initial: false,
        matchTypes: 'all'
      };
      query = db[bucket].find().equal('testID', sameForAll);
      stream = query.stream(options);
      otherQuery = db[bucket].find().equal('testID', sameForAll);
      otherStream = otherQuery.stream(options);

      return db.entityManagerFactory.websocket.open().then(function(s) {
        socket = s;
        socket.addEventListener('message', function listener() {
          msg++;
          if (msg > 5) {
            socket.removeEventListener('message', listener);
          }
        })
      }).then(function() {
        subscription = stream.subscribe(onNext);
        otherSubscription = otherStream.subscribe(onNext);
        return helper.sleep(t);
      }).then(function() {
        expect(next).to.be.equal(0);
        expect(msg).to.be.equal(2); //subscription messages
        return helper.sleep(t, insertPerson());
      }).then(function() {
        expect(next).to.be.equal(2);
        expect(msg).to.be.equal(4); //insert messages
        subscription.unsubscribe();
        otherSubscription.unsubscribe();
        return helper.sleep(t);
      }).then(function() {
        return helper.sleep(t, insertPerson());
      }).then(function() {
        expect(next).to.be.equal(2);
        expect(msg).to.be.equal(4); //no insert message
      });
    });

    it("should allow to unregister by unsubscribing subscription", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var calls = 0;
      var listener = function(e) {
        calls++;
      };
      query = db[bucket].find().equal('testID', sameForAll);
      stream = query.stream({
        initial: false,
        matchTypes: 'match'
      });
      subscription = stream.subscribe(listener);

      var john = newPerson(20);
      return helper.sleep(t).then(function() {
        return expectEvent('all', function() {
          return john.insert();
        });
      }).then(function() {
        expect(calls).to.be.equal(1);
        subscription.unsubscribe();
        john.age = 25;
        return helper.sleep(t, john.save());
      }).then(function() {
        expect(calls).to.be.equal(1);
      });
    });

    it("should raise error on subscription: missing limit on order-by", function() {
      this.timeout(10000);
      sameForAll = helper.randomize(this.test.title);
      var next = 0;
      var errors = 0;

      var onNext = function(match) {
        next++;
      };
      var onError = function(error) {
        errors++;
      };

      query = db[bucket].find()
          .matches('name', /^My Todo/)
          .ascending('name');
      stream = query.stream();

      subscription = stream.subscribe(onNext, onError);
      return helper.sleep(t).then(function() {
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
        this.timeout(10000);
        sameForAll = helper.randomize(this.test.title);
        query = db[bucket].find().equal('testID', sameForAll);
        stream = query.stream();
        var calls = 0;
        var listener = function(e) {
          calls++;
        };
        subscription = stream.first().subscribe(listener);

        // waiting for events does not work, because of interference between subscribing and unsubscribing
        var john = newPerson(49);
        return helper.sleep(t, john.insert()).then(function() {
          expect(calls).to.be.equal(1);
          john.age = 50;
          return helper.sleep(t, john.save());
        }).then(function() {
          expect(calls).to.be.equal(1);
        });
      });

      it("should compute aggregate: average", function() {
        this.timeout(10000);
        sameForAll = helper.randomize(this.test.title);
        query = db[bucket].find().equal('testID', sameForAll);
        stream = query.stream();
        var initialAccumulator = {
          contributors: {},// individual activity counts go here
          count: 0,// result set cardinality
          sum: 0,// overall number of activities in the result
          average: 0// computed as: sum/count
        };
        var maintain = function(accumulator, event) {
          var newValue = event.matchType === 'remove' ? 0 : event.data.age;
          var oldValue = accumulator.contributors[event.data.id] || 0;//default: 0

          if (newValue !== 0) {// remember new value
            accumulator.contributors[event.data.id] = newValue;
          } else {// forget old value
            delete accumulator.contributors[event.data.id];
          }
          accumulator.sum += newValue - oldValue;
          accumulator.count += event.matchType === 'remove' ? -1 : event.matchType === 'add' ? 1 : 0;
          accumulator.average = accumulator.count > 0 ? accumulator.sum / accumulator.count : 0;
          return accumulator;
        };

        var average;
        subscription = stream.scan(maintain, initialAccumulator).map(function(accumulator) {
          return accumulator.average;
        }).subscribe(function(e) {
          return average = e;
        });

        var person;
        return expectEvent('all', function() {
          return insertPerson(49);
        }).then(function() {
          expect(average).to.be.equal(49);
          return expectEvent('all', function() {
            return insertPerson(51);
          });
        }).then(function() {
          expect(average).to.be.equal(50);
          return expectEvent('all', function() {
            person = newPerson(59);
            return person.insert();
          });
        }).then(function() {
          expect(average).to.be.equal(53);
          return expectEvent('all', function() {
            return person.delete();
          });
        }).then(helper.sleep(t)).then(function() {
          return expect(average).to.be.equal(50);
        });
      });
    });
  });

  describe('streamResult', function() {
    var maintainedResult, expectedResult = [], offset = 5, limit = 10;

    before(function() {
      this.timeout(10000);
      return clearAll().then(function() {
        var inserts = 'abcdefghijklmnopqrst'.split('').map(function(char) {
          return insert(new db[bucket]({
            age: 49,
            surname: char + 'test'
          }));
        });

        query = db[bucket].find()
            .equal("age", 49)
            .ascending("surname")
            .limit(limit)
            .offset(offset);
        stream = query.streamResult();

        return helper.sleep(t, Promise.all(inserts)).then(function() {
          subscription = stream.subscribe(function(e) {
            maintainedResult = e.data;
          });

          return waitOn('all').then(function(result) {
            expectResult(result);
          });
        });
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
          return a.surname < b.surname ? -1 : 1;
        } else {
          return a.age - b.age;
        }
      });
    }

    function waitOn(matchType) {
      return new Promise(function(success, error) {
        var sub = stream.subscribe(function(e) {
          if (matchType == 'all' || e.matchType == matchType) {
            sub.unsubscribe();
            success(e.data);
          }
        });

        setTimeout(function() {
          sub.unsubscribe();
          error(new Error('Wait on ' + matchType + ' timed out.'));
        }, t);
      });
    }

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
      var obj = maintainedResult[2];
      obj.surname = maintainedResult[3].surname + 'b';

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
      var obj = maintainedResult[2];
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
      var droppedObj = maintainedResult[0];
      obj.surname = droppedObj.surname + 'f';

      update(obj);

      return waitOn('add').then(function(result) {
        expect(result[0]).equal(obj);
        expect(result).not.include(droppedObj);
        expectResult(result);
      })
    });

    it('should stream updated object moved from result to behind limit', function() {
      var obj = maintainedResult[8];
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
      var droppedObj = maintainedResult[limit - 1];
      obj.surname = maintainedResult[2].surname + 'h';

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
        surname: maintainedResult[3].surname + 'h'
      });

      var droppedObj = maintainedResult[limit - 1];
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

      var droppedObj = maintainedResult[limit - 1];
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
      var obj = maintainedResult[3];
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
      var droppedObj = maintainedResult[0];
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
      var obj = maintainedResult[3];
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
      var droppedObj = maintainedResult[0];
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
      var obj = new otherDb[bucket]({
        age: 49,
        name: 'Inserted',
        surname: maintainedResult[4].surname + 'k'
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
      otherDb[bucket].load(maintainedResult[2].id).then(function(obj) {
        obj.name = 'TestName';
        return obj.save();
      });

      return waitOn('change').then(function(result) {
        expect(result[2].name).eql('TestName');
        expectResult(result);
      });
    });

    it('should stream external deleted object', function() {
      var droppedObj = maintainedResult[2];

      otherDb[bucket].load(droppedObj.id).then(function(obj) {
        return obj.delete();
      });

      return waitOn('add').then(function(result) {
        expect(result).not.include(droppedObj);
        expect(db.contains(droppedObj)).be.false;

        expectedResult.splice(expectedResult.indexOf(droppedObj), 1);
        expectResult(result);
      });
    });
  });

})
;

