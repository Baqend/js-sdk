if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  expect = chai.expect;
  DB = require('../lib');
}
describe("Streaming Queries", function() {
  var emf, metamodel, db, stream;
  var p0, p1, p2, p3, objects;

  before(function() {
    var personType, addressType;

    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    metamodel = emf.metamodel;
    db = emf.createEntityManager();

    metamodel.init({});
    metamodel.addType(personType = new DB.metamodel.EntityType("QueryPerson", metamodel.entity(Object)));
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

      p0 = db.QueryPerson({
        id: 'query_p0'
      });

      p1 = db.QueryPerson({
        id: 'query_p1',
        name: 'QueryPerson 1',
        age: 45,
        date: new Date('1978-02-03T00:00Z'),
        address: db.QueryAddress({city: 'Hamburg', zip: 22865}),
        colors: new DB.List(['red', 'green']),
        birthplace: new DB.GeoPoint(35, 110)
      });

      p2 = db.QueryPerson({
        id: 'query_p2',
        name: 'QueryPerson 2',
        age: 33,
        date: new Date('1966-05-01T00:00Z'),
        address: db.QueryAddress({city: 'Hamburg', zip: 23432}),
        colors: new DB.List(['blue', 'green', 'red']),
        birthplace: new DB.GeoPoint(32, 112)
      });

      p3 = db.QueryPerson({
        id: 'query_p3',
        name: 'QueryPerson 3',
        age: 23,
        date: new Date('1989-05-01T00:00Z'),
        address: db.QueryAddress({city: 'Munich', zip: 92438}),
        colors: new DB.List(['yellow', 'blue', 'white']),
        birthplace: new DB.GeoPoint(29, 109)
      });
      objects = [p0, p1, p2, p3];
      return Promise.all([p0.save({force: true}), p1.save({force: true}), p2.save({force: true}), p3.save({force: true})]);
    });
  });

  afterEach(function() {
    //Unregister Stream
    ["match", "nonmatch", "both"].forEach(stream.off.bind(stream));
    //Remove excess objects
    return db.QueryPerson.find().notIn("id", [p0.id, p1.id, p2.id, p3.id]).resultList(function(result) {
      return Promise.all(result.map(function(person) {
        return person.delete();
      }));
    });
  });


  it("should return the initial result", function() {
    var received = [];
    var promise = new Promise(function(success, error) {
      stream = db.QueryPerson.find().stream();
      stream.on('match', function(object, operation, match) {
        received.push(object);
        if (received.length == 4)
          success();
      });
    });

    return promise.then(function() {
      expect(objects).to.include.members(received);
      expect(received).to.include.members(objects);
    });
  });

  it("should return updated object", function() {
    stream = db.QueryPerson.find().stream(false);
    var result = {};
    stream.on('match', function(object, operation, match) {
      result.object = object;
      result.operation = operation;
      result.match = match;
    });

    return sleep(100).then(function() {
      p1.name = "Felix";
      return sleep(100, p1.save());
    }).then(function() {
      expect(result.object).to.be.equal(p1);
      expect(result.operation).to.be.equal("update");
      expect(result.match).to.be.true;
    });
  });

  it("should return inserted object", function() {
    stream = db.QueryPerson.find().equal("name", "franz").stream(false);
    var result = {};
    stream.on('match', function(object, operation, match) {
      result.object = object;
      result.operation = operation;
      result.match = match;
    });

    return sleep(100).then(function() {
      var object = db.QueryPerson.fromJSON(p3.toJSON(true));
      object.name = "franz";
      return sleep(100, object.insert());
    }).then(function() {
      expect(result.object.name).to.be.equal("franz");
      expect(result.operation).to.be.equal("insert");
      expect(result.match).to.be.true;
    });
  });

  it("should allow multiple listeners", function() {
    var received = [];
    var insert = db.QueryPerson.fromJSON(p3.toJSON(true));
    insert.name = "franz";

    stream = db.QueryPerson.find().stream(false);
    var listener = function(object, operation, match) {
      received.push(object);
      expect(object.id).to.be.equal(insert.id);
    };
    stream.on('match', listener);
    stream.on('match', listener);

    return sleep(100).then(function() {
      return insert.insert()
    }).then(function(obj) {
      obj.name = "frrrrranz";
      return sleep(100, obj.save());
    }).then(function() {
      expect(received.length).to.be.equal(4);
    });
  });

  it("should allow to unregister", function() {
    var calls = 0;
    stream = db.QueryPerson.find().stream(false);
    var listener = function(object, operation, match) {
      expect(++calls).to.be.at.most(1);
    };
    stream.on('match', listener);

    return sleep(100).then(function() {
      var insert = db.QueryPerson.fromJSON(p3.toJSON(true));
      insert.name = "franz";
      return sleep(100, insert.insert());
    }).then(function(obj) {
      stream.off('match', listener);
      obj.name = "";
      return sleep(100, obj.save())
    }).then(function() {
      expect(calls).to.be.equal(1);
    });
  });


  it("should only be called once", function() {
    var calls = 0;
    stream = db.QueryPerson.find().stream(false);
    var listener = function(object, operation, match) {
      expect(++calls).to.be.at.most(1);
    };
    stream.once('match', listener);

    return sleep(100).then(function() {
      var insert = db.QueryPerson.fromJSON(p3.toJSON(true));
      insert.name = "franz";
      return insert.insert();
    }).then(function(obj) {
      stream.off('match', listener);
      obj.name = "";
      return sleep(100, obj.save())
    }).then(function() {
      expect(calls).to.be.equal(1);
    });
  });

});

