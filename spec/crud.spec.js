if (typeof jspa == 'undefined') {
  env = require('./env');
  expect = require('chai').expect;
  jspa = require('../lib');
}

xdescribe('Test db', function() {
  var db, emf, metamodel;

  before(function() {
    var type, address;
    emf = new jspa.EntityManagerFactory(env.TEST_SERVER);
    metamodel = emf.metamodel;
    metamodel.init();

    metamodel.init();
    metamodel.addType(type = new jspa.metamodel.EntityType("Person", metamodel.entity(Object)));
    metamodel.addType(address = new jspa.metamodel.EntityType("Address", metamodel.entity(Object)));

    type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(type, "name", metamodel.baseType(String)));
    type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(type, "address", type));
    type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(type, "age", metamodel.baseType(Number)));
    type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(type, "date", metamodel.baseType(Date)));

    type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(address, "street", metamodel.baseType(String)));
    type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(address, "number", metamodel.baseType(Number)));
    type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(address, "zip", metamodel.baseType(Number)));

    return metamodel.save();
  });

  beforeEach(function() {
    return emf.createEntityManager(function(em) {
      db = em;
    });
  });

  describe('save', function() {
    it('should save new object', function() {
      var person = db.Person();

      return person.save(function() {
        expect(person._id).be.ok;
        expect(person._metadata.isPersistent).be.true;
        expect(person._metadata.isDirty).be.false;
      });
    });
  });

  describe('find', function() {
    var person;

    before(function() {
      var person = db.Person();
      person.name = "Peter Mueller";
      person.age = 42;
      person.date = new Date("13-11-1976");

      return person.save(function() {
        expect(person._metadata.getIdentifier()).be.ok;
        expect(person._metadata.getVersion()).be.ok;
        expect(person._metadata.isPersistent).be.true;
        expect(person._metadata.isDirty).be.false;
      });
    });

    it('should retrieved object', function() {
      var loaded = db.Person.find(person._metadata.getIdentifier());

      expect(loaded).be.ok;
      expect(loaded._metadata.getIdentifier()).equals(loaded._metadata.getIdentifier());
      expect(loaded.name).equals("Peter Mueller");
      expect(loaded.age).equals(42);
      expect(loaded.date).equals(new Date("13-11-1976"));
    });

    it('should retrieved same version in same db context', function() {
      var loaded1 = db.Person.find(person._metadata.getIdentifier());
      var loaded2 = db.Person.find(person._metadata.getIdentifier());

      expect(loaded1).equals(loaded2);
    });

    it('should retrieved different version in same db context', function() {
      var loaded1 = db.Person.find(person._metadata.getIdentifier());
      var loaded2 = db.Person.find(person._metadata.getIdentifier());

      expect(loaded1).equals(loaded2);
    });
  });
});