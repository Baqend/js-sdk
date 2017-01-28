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
  var t = 500;
  var bucket = helper.randomize("StreamingQueryPerson");
  var emf, metamodel, db, otherDb, stream, subscription, otherSubscription;

  /**
   *
   * @param attributeName
   * @returns {$or: *[]} query that matches everything
   */
  function tautology(attributeName) {
    var present = {};
    var missing = {};

    present[attributeName] = {$exists: true};
    missing[attributeName] = {$exists: false};

    return {$or: [present, missing]};
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
    if (subscription) {
      subscription.unsubscribe();
    }
    if (otherSubscription) {
      otherSubscription.unsubscribe();
    }
    return helper.sleep(t, clearBucket());//wait to make sure that errors are thrown before the function returns
  }


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

    metamodel.save();

    db = emf.createEntityManager();
    otherDb = emf.createEntityManager();
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
              stream = db[bucket].find()
                  .equal("age", 64)
                  .ascending("surname")
                  .limit(5)
                  .streamResult();
              subscription = stream.subscribe(function(e) {
                resolve(e);
              }, function(e) {
                reject(e);
              });
            });
          }).then(function(event) {
            expect(event).to.be.ok;
            result = event.data;
          }).then(function() {
            // unsubscribe and wait a little bit
            return helper.sleep(t, subscription.unsubscribe());
          }).then(function() {
            // delete all 50 elements: if the query has not been unsubscribe, we will receive an error, because the query results cannot be maintained in InvaliDB as soon as less than 10 elements are available server-side
            return helper.sleep(t, clearBucket());
          }).catch(function() {
            subscription.unsubscribe();
          });
    });
  });


  describe('stream', function() {

    afterEach(clearAll);

    it("should raise error on subscription", function() {
      var next = 0;
      var errors = 0;

      var onNext = function(match) {
        next++;
      };
      var onError = function(error) {
        errors++;
      };

      stream = db[bucket].find()
          .matches('name', /^My Todo/)
          .ascending('name')
          .stream();

      return helper.sleep(t).then(function() {
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
        stream = db[bucket].find().where(tautology('should only be called once')).stream({initial: false, matchTypes: 'match'});
        subscription = stream.first().subscribe(listener);

        var insert;
        return helper.sleep(t).then(function() {
          insert = db[bucket].fromJSON({
            name: 'John',
            age: 45,
            date: new Date('1978-02-03T00:00Z'),
            address: new db.QueryAddress({city: 'Hamburg', zip: 22865}),
            colors: new DB.List(['red', 'green']),
            birthplace: new DB.GeoPoint(35, 110)
          });
          return insert.insert();
        }).then(function() {
          insert.name = "";
          return helper.sleep(t, insert.save())
        }).then(function() {
          expect(calls).to.be.equal(1);
        });
      });

      it("should compute aggregate: average", function() {//TODO broken!
        this.timeout(3000);
        stream = db[bucket].find().where({$or: [{average: {$exists: true}}, {average: {$exists: false}}]}).stream({initial: false});
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
    var maintainedResult, expectedResult = [], offset = 5, limit = 10;

    before(function() {
      var inserts = 'abcdefghijklmnopqrst'.split('').map(function(char) {
        return insert(new db[bucket]({
          age: 49,
          surname: char + 'test'
        }));
      });

      stream = db[bucket].find()
          .equal("age", 49)
          .ascending("surname")
          .limit(limit)
          .offset(offset)
          .streamResult();

      return helper.sleep(t, Promise.all(inserts)).then(function() {
        subscription = stream.subscribe(function(e) {
          maintainedResult = e.data;
        });

        return waitOn('all').then(function(result) {
          expectResult(result);
        });
      });
    });

    after(clearAll);

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

  /* Some generic describe block


   describe('describe block', function() {
   var sub, result, expectedResult = [], offset = 5, limit = 10, otherDb;

   before(function() {
   return null;
   });

   after(function() {
   if (sub){
   sub.unsubscribe();
   }
   });

   beforeEach(function() {
   });

   afterEach(function() {
   });

   it('should test something', function() {
   doStuffWith(something);

   return helper.sleep(t).then(function() {
   return helper.sleep(t, al.save());
   }).then(function() {
   return helper.sleep(t, bob.save());// result: Al, [ Bob ]
   }).then(function() {
   return helper.sleep(t).then(function() {
   var bob = new db[bucket]({
   key: 'bob',
   name: 'Bob',
   age: 50
   });
   return bob.save();
   });
   });
   });
   });

   */
});

