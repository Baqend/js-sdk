if (typeof DB == 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe("Streaming Queries", function() {
  // skips test for ie9 and ie10
  if (typeof window != 'undefined' && !window.WebSocket) {
    return;
  }

  var t = 400;
  var bucket = helper.randomize("StreamingQueryPerson");
  var emf, metamodel, db, stream;
  var p0, p1, p2, p3, objects;

  before(function() {

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
    }).then(function() {
      //Prewarm Storm
      /*var testStream = db[bucket].find().equal("name", "muh").stream(false);
       testStream.on("match", function(){});
       testStream.off();
       return helper.sleep(t);*/
    });
  });

  afterEach(function() {
    //Unregister Stream
    stream.off();
    //Remove excess objects
    return helper.sleep(t).then(function() {
      //TODO: fix this when ids are handled correctly in queries
      return db[bucket].find().notIn("id", [p0.id, p1.id, p2.id, p3.id]).resultList(function(result) {
        return Promise.all(result.map(function(person) {
          return person.delete();
        }));
      })
    });
  });


  it("should return the initial result", function() {
    var received = [];
    var promise = new Promise(function(success, error) {
      stream = db[bucket].find().limit(3).stream();
      stream.on('match', function(e) {
        received.push(e);
        if (received.length == 3)
          success();
      });
    });

    return promise.then(function() {
      received.forEach(function(result) {
        expect(result.matchType).to.be.equal("match");
        expect(objects).to.include(result.object);
        expect(result.operation).to.be.equal(null);
        expect(result.target).to.be.equal(stream);
        expect(result.date.getTime()).be.ok;
        expect(result.initial).be.true;
        expect(result.query).be.equal(stream.query);
      });
    });
  });

  it("should return updated object", function() {
    stream = db[bucket].find().stream(false);
    var result;
    stream.on('match', function(e) {
      result = e;
    });

    return helper.sleep(t).then(function() {
      p1.name = "Felix";
      return helper.sleep(t, p1.save());
    }).then(function() {
      expect(result.matchType).to.be.equal("match");
      expect(result.object).to.be.equal(p1);
      expect(result.operation).to.be.equal("update");
      expect(result.target).to.be.equal(stream);
      expect(result.date.getTime()).be.ok;
      expect(result.initial).be.false;
      expect(result.query).be.equal(stream.query);
    });
  });

  it("should return ordered result", function() {
    this.timeout(30000);
    stream = db[bucket].find().equal("age", 49).limit(3).ascending("name").stream(false);

    var results = [];
    stream.on('all', function(e) {
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
        expect(results[0].object.name).to.be.equal("Al");
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
        expect(results[0].object.name).to.be.equal("Al");
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
            expect(results[1].object.name).to.be.equal("Dave");
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
            expect(results[2].object.name).to.be.equal("Carl");
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
            expect(results[3].operation).to.be.equal(null); //transitive remove --> the was no operation on this objects
            expect(results[3].matchType).to.be.equal("remove");
            expect(results[3].object.name).to.be.equal("Dave");
            expect(results[3].index).to.be.equal(3);
            expect(results[3].update).to.be.equal(results[4].update);
            expect(results[4].operation).to.be.equal("insert");
            expect(results[4].matchType).to.be.equal("add");
            expect(results[4].object.name).to.be.equal("Dan");
            expect(results[4].index).to.be.equal(2);
          });
        });
  });

  it("should return inserted object", function() {
    stream = db[bucket].find().equal("name", "franz").stream(false);
    var result;
    stream.on('match', function(e) {
      result = e;
    });

    return helper.sleep(t).then(function() {
      var object = db[bucket].fromJSON(p3.toJSON(true));
      object.name = "franz";
      return helper.sleep(t, object.insert());
    }).then(function() {
      expect(result.matchType).to.be.equal("match");
      expect(result.object.name).to.be.equal("franz");
      expect(result.operation).to.be.equal("insert");
      expect(result.target).to.be.equal(stream);
      expect(result.date.getTime()).be.ok;
      expect(result.query).be.equal(stream.query);
      expect(result.initial).be.false;
    });
  });

  it("should resolve references from real-time matches", function() {
    this.timeout(30000);
    var franz, otherfranz;

    stream = db[bucket].find().stream(false);
    stream.on('all', function(e) {
      franz = e.object;
    });

    var otherdb = emf.createEntityManager();
    var otherstream = otherdb[bucket].find().stream(false);
    otherstream.on('all', function(e) {
      otherfranz = e.object;
    });

    return helper.sleep(t).then(function() {
      var object = db[bucket].fromJSON(p3.toJSON(true));
      object.name = "franz";
      return helper.sleep(t, object.insert());
    }).then(function() {
      expect(franz.name).to.be.equal("franz");
      expect(franz.name).to.be.equal(otherfranz.name);
    }).then(function() {// update
      franz.name = "franzl";
      return helper.sleep(t, franz.update());
    }).then(function() {
      expect(franz.name).to.be.equal("franzl");
      expect(otherfranz.name).to.be.equal("franzl");
      expect(franz.version).to.be.equal(2);
      expect(otherfranz.version).to.be.equal(2);
    }).then(function() {// update the other way around
      otherfranz.name = "franzler";
      return helper.sleep(t, otherfranz.update());
    }).then(function() {
      expect(otherfranz.name).to.be.equal("franzler");
      expect(otherfranz.version).to.be.equal(3);
      expect(franz.name).to.be.equal("franzler");
      expect(franz.version).to.be.equal(3);
    }).then(function() {// delete
      return helper.sleep(t, otherfranz.delete());
    }).then(function() {
      expect(otherfranz.version).to.be.equal(-1);
      expect(franz.version).to.be.equal(-1);
    });
  });

  it("should generate correct cacheable query strings", function() {
    var s = db[bucket].find().stream(false);
    var empty = [null, undefined, "", " ", "   ", "{}", " {}", "{} ", "{ }", " { } "];
    empty.forEach(function(query) {
      empty.forEach(function(sort) {
        expect(s.getCachableQueryString(query, -1, -1, sort)).to.be.equal("{}");
        expect(s.getCachableQueryString(query, 0, 0, sort)).to.be.equal("{}");
        expect(s.getCachableQueryString(query, 1, 1, sort)).to.be.equal("{}&start=1&count=1");
        expect(s.getCachableQueryString(query, -1, 1, sort)).to.be.equal("{}&count=1");
        expect(s.getCachableQueryString(query, 0, -1, sort)).to.be.equal("{}");
        expect(s.getCachableQueryString(query, 1, 0, sort)).to.be.equal("{}&start=1");
        expect(s.getCachableQueryString(query, -1, 0, sort)).to.be.equal("{}");
        expect(s.getCachableQueryString(query, 0, 1, sort)).to.be.equal("{}&count=1");
        expect(s.getCachableQueryString(query, 1, -1, sort)).to.be.equal("{}&start=1");
      });
    });

    empty.forEach(function(sort) {
      var query = "{name:'Bob'}";
      expect(s.getCachableQueryString(query, -1, -1, sort)).to.be.equal("{name:'Bob'}");
      expect(s.getCachableQueryString(query, 0, 0, sort)).to.be.equal("{name:'Bob'}");
      expect(s.getCachableQueryString(query, 1, 1, sort)).to.be.equal("{name:'Bob'}&start=1&count=1");
      expect(s.getCachableQueryString(query, -1, 1, sort)).to.be.equal("{name:'Bob'}&count=1");
      expect(s.getCachableQueryString(query, 0, -1, sort)).to.be.equal("{name:'Bob'}");
      expect(s.getCachableQueryString(query, 1, 0, sort)).to.be.equal("{name:'Bob'}&start=1");
      expect(s.getCachableQueryString(query, -1, 0, sort)).to.be.equal("{name:'Bob'}");
      expect(s.getCachableQueryString(query, 0, 1, sort)).to.be.equal("{name:'Bob'}&count=1");
      expect(s.getCachableQueryString(query, 1, -1, sort)).to.be.equal("{name:'Bob'}&start=1");
    });

    empty.forEach(function(query) {
      var sort = "{name:1}";
      expect(s.getCachableQueryString(query, -1, -1, sort)).to.be.equal("{}&sort={name:1}");
      expect(s.getCachableQueryString(query, 0, 0, sort)).to.be.equal("{}&sort={name:1}");
      expect(s.getCachableQueryString(query, 1, 1, sort)).to.be.equal("{}&start=1&count=1&sort={name:1}");
      expect(s.getCachableQueryString(query, -1, 1, sort)).to.be.equal("{}&count=1&sort={name:1}");
      expect(s.getCachableQueryString(query, 0, -1, sort)).to.be.equal("{}&sort={name:1}");
      expect(s.getCachableQueryString(query, 1, 0, sort)).to.be.equal("{}&start=1&sort={name:1}");
      expect(s.getCachableQueryString(query, -1, 0, sort)).to.be.equal("{}&sort={name:1}");
      expect(s.getCachableQueryString(query, 0, 1, sort)).to.be.equal("{}&count=1&sort={name:1}");
      expect(s.getCachableQueryString(query, 1, -1, sort)).to.be.equal("{}&start=1&sort={name:1}");
    });

    var query = "{name:'Bob'}";
    var sort = "{name:1}";
    expect(s.getCachableQueryString(query, -1, -1, sort)).to.be.equal("{name:'Bob'}&sort={name:1}");
    expect(s.getCachableQueryString(query, 0, 0, sort)).to.be.equal("{name:'Bob'}&sort={name:1}");
    expect(s.getCachableQueryString(query, 1, 1, sort)).to.be.equal("{name:'Bob'}&start=1&count=1&sort={name:1}");
    expect(s.getCachableQueryString(query, -1, 1, sort)).to.be.equal("{name:'Bob'}&count=1&sort={name:1}");
    expect(s.getCachableQueryString(query, 0, -1, sort)).to.be.equal("{name:'Bob'}&sort={name:1}");
    expect(s.getCachableQueryString(query, 1, 0, sort)).to.be.equal("{name:'Bob'}&start=1&sort={name:1}");
    expect(s.getCachableQueryString(query, -1, 0, sort)).to.be.equal("{name:'Bob'}&sort={name:1}");
    expect(s.getCachableQueryString(query, 0, 1, sort)).to.be.equal("{name:'Bob'}&count=1&sort={name:1}");
    expect(s.getCachableQueryString(query, 1, -1, sort)).to.be.equal("{name:'Bob'}&start=1&sort={name:1}");
  });


  it("should return removed object", function() {
    stream = db[bucket].find().equal("name", "franzi").stream(false);

    var result;
    stream.on('remove', function(e) {
      result = e;
    });

    var object = db[bucket].fromJSON(p3.toJSON(true));
    object.name = "franzi";

    return helper.sleep(t).then(function() {
      return object.insert();
    }).then(function() {
      return helper.sleep(t, object.delete());
    }).then(function() {
      expect(result.object.id).to.be.equal(object.id);
      expect(result.matchType).to.be.equal("remove");
      expect(result.operation).to.be.equal("delete");
      expect(result.target).to.be.equal(stream);
      expect(result.date.getTime()).be.ok;
      expect(result.query).be.equal(stream.query);
      expect(result.initial).be.false;
    });
  });

  it("should return all changes", function() {
    stream = db[bucket].find().equal("age", 23).stream(false);

    var results = [];
    stream.on('all', function(e) {
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
        expect(results[2].object.id).to.be.equal(object.id);
      });
    });
  });

  it("should allow multiple listeners", function() {
    var received = [];
    var insert = db[bucket].fromJSON(p3.toJSON(true));
    insert.name = "franz";

    stream = db[bucket].find().stream(false);
    var listener = function(e) {
      received.push(e);
      expect(e.object.id).to.be.equal(insert.id);
    };
    stream.on('match', listener);
    stream.on('match', listener);

    return helper.sleep(t).then(function() {
      return insert.insert()
    }).then(function(obj) {
      obj.name = "frrrrranz";
      return helper.sleep(t, obj.save());
    }).then(function() {
      expect(received.length).to.be.equal(4);
    });
  });

  /*
  it("should do RXjs-ey stuff", function() {
    this.timeout(30000);
    stream = db[bucket].find().stream(false);

    var next = 0;
    var errors = 0;
    var completions = 0;

    var onNext=function(match) { // onNext
      next++;
    };
    var onError= function(error) { // onError
      errors++;
    };
    var onCompleted=  function() {// onCompleted
      completions++;
    };

    var subscription = stream.observable('all');

    subscription.subscribe(onNext, onError, onCompleted);

    var insert;
    return helper.sleep(t).then(function() {
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
      expect(next).to.be.equal(1);
      expect(errors).to.be.equal(0);
      expect(completions).to.be.equal(0);

      subscription.dispose();

      expect(next).to.be.equal(1);
      expect(errors).to.be.equal(0);
      expect(completions).to.be.equal(1);

      insert = db[bucket].fromJSON(p3.toJSON(true));
      return helper.sleep(t, insert.insert());
    }).then(function() {
      expect(next).to.be.equal(1);
      expect(errors).to.be.equal(0);
      expect(completions).to.be.equal(1);
    });
  });
  */

  it("should allow to unregister", function() {
    var calls = 0;
    stream = db[bucket].find().stream(false);
    var listener = function(e) {
      expect(++calls).to.be.at.most(1);
    };
    stream.on('match', listener);

    return helper.sleep(t).then(function() {
      var insert = db[bucket].fromJSON(p3.toJSON(true));
      insert.name = "franz";
      return helper.sleep(t, insert.insert());
    }).then(function(obj) {
      stream.off('match', listener);
      obj.name = "";
      return helper.sleep(t, obj.save())
    }).then(function() {
      expect(calls).to.be.equal(1);
    });
  });


  it("should only be called once", function() {
    var calls = 0;
    stream = db[bucket].find().stream(false);
    var listener = function(e) {
      expect(++calls).to.be.at.most(1);
    };
    stream.once('match', listener);

    return helper.sleep(t).then(function() {
      var insert = db[bucket].fromJSON(p3.toJSON(true));
      insert.name = "franz";
      return insert.insert();
    }).then(function(obj) {
      obj.name = "";
      return helper.sleep(t, obj.save())
    }).then(function() {
      expect(calls).to.be.equal(1);
    });
  });

});

