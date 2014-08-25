if (typeof jspa == 'undefined') {
  env = require('./env');
  expect = require('chai').expect;
  jspa = require('../lib');
}

describe('Test db', function() {
  var db, personType, addressType, childType, emf, metamodel;

  before(function() {
    emf = new jspa.EntityManagerFactory(env.TEST_SERVER);
    metamodel = emf.metamodel;

    metamodel.init();
    metamodel.addType(personType = new jspa.metamodel.EntityType("Person", metamodel.entity(Object)));
    metamodel.addType(childType = new jspa.metamodel.EntityType("Child", personType));
    metamodel.addType(addressType = new jspa.metamodel.EmbeddableType("Address"));

    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "name", metamodel.baseType(String)));
    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "address", personType));
    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "age", metamodel.baseType(Number)));
    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "date", metamodel.baseType(Date)));

    childType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(childType, 'mother', personType));
    childType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(childType, 'father', personType));

    addressType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(addressType, "street", metamodel.baseType(String)));
    addressType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(addressType, "number", metamodel.baseType(Number)));
    addressType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(addressType, "zip", metamodel.baseType(Number)));

    return metamodel.save();
  });

  beforeEach(function() {
    return emf.createEntityManager(function(em) {
      db = em;
    });
  });

  describe('contains', function() {
    it('return false for none entity objects', function() {
      expect(db.contains({})).be.false;
      expect(db.contains([])).be.false;
      expect(db.contains(null)).be.false;
      expect(db.contains(addressType.typeConstructor())).be.false;
    });

    it('return false for unattached objects', function() {
      var obj = new personType.typeConstructor();
      expect(db.contains(obj)).be.false;

      obj._metadata.db = db;

      expect(db.contains(obj)).be.false;
    });

    it('return true for attached objects', function() {
      var obj = db.Person();
      expect(db.contains(obj)).be.true;
    });
  });

  describe('attach', function() {
    it('should unattached object to db', function() {
      var obj = new personType.typeConstructor();
      obj.attach(db);

      expect(obj._metadata.db).equals(db);
      expect(db.contains(obj)).be.true;
    });

    it('should not reattach objects to another db', function() {
      var obj = new personType.typeConstructor();
      obj.attach(db);

      return emf.createEntityManager().then(function(db2) {
        expect(function() { obj.attach(db2); }).throw(jspa.error.EntityExistsError);
        expect(obj._metadata.db).equals(db);
        expect(db2.contains(obj)).be.false;
      });
    });

    it('should ignore attach object to same db', function() {
      var obj = new personType.typeConstructor();
      obj.attach(db);
      obj.attach(db);

      expect(obj._metadata.db).equals(db);
      expect(db.contains(obj)).be.true;
    });

    it('should attach implicit attached objects to same db', function() {
      return emf.createEntityManager().then(function(globalDb) {
        (typeof window != 'undefined'? window: global).db = globalDb;

        var obj = new personType.typeConstructor();
        expect(obj._metadata.db).equals(globalDb);
        expect(globalDb.contains(obj)).be.false;

        obj.attach(globalDb);

        expect(obj._metadata.db).equals(globalDb);
        expect(globalDb.contains(obj)).be.true;

        (typeof window != 'undefined'? window: global).db = undefined;
      });
    });

    it('should not reattach implicit attached objects to another db', function() {
      return emf.createEntityManager().then(function(globalDb) {
        (typeof window != 'undefined'? window: global).db = globalDb;

        var obj = new personType.typeConstructor();
        expect(obj._metadata.db).equals(globalDb);

        expect(function() { obj.attach(db); }).throw(jspa.error.EntityExistsError);
        expect(obj._metadata.db).equals(globalDb);
        expect(db.contains(obj)).be.false;

        (typeof window != 'undefined'? window: global).db = undefined;
      });
    });
  });

  describe('save', function() {
    it('should save new object', function() {
      var person = db.Person();

      return person.save(function(result) {
        console.log(result)
        expect(person._metadata.id).be.ok;
        expect(person._metadata.version).be.ok;
        expect(person._metadata.isPersistent).be.true;
        expect(person._metadata.isDirty).be.false;
      });
    });
  });

  describe('get', function() {
    var person;

    before(function() {
      person = db.Person();
      person.name = "Peter Mueller";
      person.age = 42;
      person.date = new Date("1976-11-13");

      return person.save(function(saved) {
        expect(saved).equals(person);
        expect(saved._metadata.id).be.ok;
        expect(saved._metadata.version).be.ok;
        expect(saved._metadata.isPersistent).be.true;
        expect(saved._metadata.isDirty).be.false;
      });
    });

    it('should retrieved object', function() {
      var promise = db.Person.get(person._metadata.id).then(function(loaded) {
        expect(loaded).be.ok;
        expect(loaded._metadata.ref).equals(person._metadata.ref);
        expect(loaded.name).equals("Peter Mueller");
        expect(loaded.age).equals(42);
        expect(loaded.date).eql(new Date("1976-11-13"));
      });
    });

    it('should retrieved same version in same db context', function() {
      var p1 = db.Person.get(person._metadata.id);
      var p2 = db.Person.get(person._metadata.id);

      return jspa.Q.all([p1, p2]).spread(function(loaded1, loaded2) {
        expect(loaded1).be.ok;
        expect(loaded1).equals(loaded2);
      });
    });

    it('should retrieved different version in different db context', function() {
      return emf.createEntityManager().then(function(otherDb) {
        var p1 = db.Person.get(person._metadata.id);
        var p2 = otherDb.Person.get(person._metadata.id);

        return jspa.Q.all([p1, p2]).spread(function(loaded1, loaded2) {
          expect(loaded1).not.equals(loaded2);
        });
      });
    });
  });
});