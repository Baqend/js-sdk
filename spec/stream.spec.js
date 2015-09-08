if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  expect = chai.expect;
  DB = require('../lib');
}
describe("Streaming Queries", function() {
  var t = 400;
  var bucket = randomize("StreamingQueryPerson");
  var emf, metamodel, db, stream;
  var p0, p1, p2, p3, objects;

  before(function() {
    // skips test for ie9
    if (typeof window != 'undefined' && !window.WebSocket) {
      this.skip();
    }

    var personType, addressType;
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    metamodel = emf.metamodel;

    metamodel.init({});
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

    return saveMetamodel(metamodel).then(function() {
      db = emf.createEntityManager();

      p0 = new db[bucket]({
        id: 'query_p0'
      });

      p1 = new db[bucket]({
        id: 'query_p1',
        name: 'QueryPerson 1',
        age: 45,
        date: new Date('1978-02-03T00:00Z'),
        address: new db.QueryAddress({city: 'Hamburg', zip: 22865}),
        colors: new DB.List(['red', 'green']),
        birthplace: new DB.GeoPoint(35, 110)
      });

      p2 = new db[bucket]({
        id: 'query_p2',
        name: 'QueryPerson 2',
        age: 33,
        date: new Date('1966-05-01T00:00Z'),
        address: new db.QueryAddress({city: 'Hamburg', zip: 23432}),
        colors: new DB.List(['blue', 'green', 'red']),
        birthplace: new DB.GeoPoint(32, 112)
      });

      p3 = new db[bucket]({
        id: 'query_p3',
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
       return sleep(t);*/
    });
  });

  afterEach(function() {
    //Unregister Stream
    stream.off();
    //Remove excess objects
    return sleep(t).then(function() {
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
        expect(result.type).to.be.equal("match");
        expect(objects).to.include(result.data);
        expect(result.operation).to.be.equal("insert");
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

    return sleep(t).then(function() {
      p1.name = "Felix";
      return sleep(t, p1.save());
    }).then(function() {
      expect(result.type).to.be.equal("match");
      expect(result.data).to.be.equal(p1);
      expect(result.operation).to.be.equal("update");
      expect(result.target).to.be.equal(stream);
      expect(result.date.getTime()).be.ok;
      expect(result.initial).be.false;
      expect(result.query).be.equal(stream.query);
    });
  });

  it("should return inserted object", function() {
    stream = db[bucket].find().equal("name", "franz").stream(false);
    var result;
    stream.on('match', function(e) {
      result = e;
    });

    return sleep(t).then(function() {
      var object = db[bucket].fromJSON(p3.toJSON(true));
      object.name = "franz";
      return sleep(t, object.insert());
    }).then(function() {
      expect(result.type).to.be.equal("match");
      expect(result.data.name).to.be.equal("franz");
      expect(result.operation).to.be.equal("insert");
      expect(result.target).to.be.equal(stream);
      expect(result.date.getTime()).be.ok;
      expect(result.query).be.equal(stream.query);
      expect(result.initial).be.false;
    });
  });

  it("should return removed object", function() {
    stream = db[bucket].find().equal("name", "franzi").stream(false);

    var result;
    stream.on('remove', function(e) {
      result = e;
    });

    var object = db[bucket].fromJSON(p3.toJSON(true));
    object.name = "franzi";

    return sleep(t).then(function() {
      return object.insert();
    }).then(function() {
      return sleep(t, object.delete());
    }).then(function() {
      expect(result.data.id).to.be.equal(object.id);
      expect(result.type).to.be.equal("remove");
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

    return sleep(t).then(function() {
      object.name = "flo";
      return object.insert();
    }).then(function() {
      return sleep(t).then(function() {
        object.name = "karl-friedrich";
        return object.save();
      });
    }).then(function() {
      return sleep(t).then(function() {
        return object.delete();
      });
    }).then(function() {
      return sleep(t).then(function() {
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

    stream = db[bucket].find().stream(false);
    var listener = function(e) {
      received.push(e);
      expect(e.data.id).to.be.equal(insert.id);
    };
    stream.on('match', listener);
    stream.on('match', listener);

    return sleep(t).then(function() {
      return insert.insert()
    }).then(function(obj) {
      obj.name = "frrrrranz";
      return sleep(t, obj.save());
    }).then(function() {
      expect(received.length).to.be.equal(4);
    });
  });

  it("should allow to unregister", function() {
    var calls = 0;
    stream = db[bucket].find().stream(false);
    var listener = function(e) {
      expect(++calls).to.be.at.most(1);
    };
    stream.on('match', listener);

    return sleep(t).then(function() {
      var insert = db[bucket].fromJSON(p3.toJSON(true));
      insert.name = "franz";
      return sleep(t, insert.insert());
    }).then(function(obj) {
      stream.off('match', listener);
      obj.name = "";
      return sleep(t, obj.save())
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

    return sleep(t).then(function() {
      var insert = db[bucket].fromJSON(p3.toJSON(true));
      insert.name = "franz";
      return insert.insert();
    }).then(function(obj) {
      obj.name = "";
      return sleep(t, obj.save())
    }).then(function() {
      expect(calls).to.be.equal(1);
    });
  });

})
;

