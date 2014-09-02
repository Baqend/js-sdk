if (typeof jspa == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  expect = chai.expect;
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
        expect(person._metadata.id).be.ok;
        expect(person._metadata.version).be.ok;
        expect(person._metadata.isPersistent).be.true;
        expect(person._metadata.isDirty).be.false;
        expect(person).equals(result);
      });
    });

    it('should save and refresh object', function() {
      var person = db.Person();
      person.name = "Old Name";
      var promise = expect(person.saveAndRefresh()).eventually.have.property('name', 'Old Name');
      setTimeout(function() {
        person.name = "New Name";
      }, 0);
      return promise;
    });

    it('should save a second time', function() {
      var person = db.Person();
      var version;

      return person.save(function() {
        version = person._metadata.version;

        person.name = 'Paul Panther';
        expect(person._metadata.isDirty).be.true;

        return person.save();
      }).then(function() {
        expect(person._metadata.version).not.equals(version);
        expect(person.name).equals('Paul Panther');
      });
    });

    it('should not save a stale object', function() {
      var person;

      return expect(emf.createEntityManager(function(db2) {
        person = db2.Person();
        return person.save();
      }).then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          person2.name = 'Peter Parker';
          return person2.save();
        });
      }).then(function() {
        person.name = 'Alice Ford';
        return person.save();
      })).be.rejected.then(function(e) {
        expect(e).instanceOf(jspa.error.PersistentError);
        return expect(db.Person.get(person._metadata.id)).eventually.have.property('name', 'Peter Parker');
      });
    });

    it('should forcibly save a stale object', function() {
      var person;

      return emf.createEntityManager(function(db2) {
        person = db2.Person();
        return person.save();
      }).then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          person2.name = 'Peter Parker';
          return person2.save();
        });
      }).then(function() {
        person.name = 'Alice Ford';
        return person.save(true);
      }).then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          expect(person2.name).equals('Alice Ford');
        });
      });
    });

    it('should not override an object that exists', function() {
      var person;

      return emf.createEntityManager(function(db2) {
        person = db2.Person();
        return person.save();
      }).then(function() {
        var newPerson = db.Person();
        newPerson._metadata.id = person._metadata.id;
        return expect(newPerson.save()).rejected;
      });
    });

    it('should forcibly override an object that exists', function() {
      var person;

      return emf.createEntityManager(function(db2) {
        person = db2.Person();
        return person.save();
      }).then(function() {
        var newPerson = db.Person();
        newPerson.name = 'Peter Parker';
        newPerson._metadata.id = person._metadata.id;
        return newPerson.save(true);
      }).then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          expect(person2.name).equals('Peter Parker');
        });
      });
    });

    it('should not save an removed object', function() {
      var person = db.Person();
      return person.save().then(function() {
        return emf.createEntityManager(function(db2) {
          db2.Person.get(person._metadata.id).then(function(person2) {
            return person2.remove();
          });
        });
      }).then(function() {
        expect(person.save()).rejected;
      });
    });

    it('should forcibly save an removed object', function() {
      var person = db.Person();
      return person.save().then(function() {
        return emf.createEntityManager(function(db2) {
          db2.Person.get(person._metadata.id).then(function(person2) {
            return person2.remove();
          });
        });
      }).then(function() {
        person.name = 'Peter Parker';
        return person.save(true);
      }).then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          expect(person2.name).equals('Peter Parker');
        });
      });
    });

    it('should not be allowed to call save twice', function() {
      var person = db.Person();
      person.save();
      expect(person.save).to.throw(Error);
    });
  });

  describe('get', function() {
    var person;

    beforeEach(function() {
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
      return db.Person.get(person._metadata.id).then(function(loaded) {
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

    it('should refresh id the object is stale', function() {
      person.name = 'Tom Miller';

      return emf.createEntityManager(function(db2) {
        return db2.Person.get(person._metadata.id).then(function(person2) {
          expect(person2.name).equals('Peter Mueller');
          person2.name = 'Alice Ford';
          return person2.save();
        });
      }).then(function(person2) {
        return db.Person.get(person._metadata.id).then(function(person3) {
          expect(person3).equals(person);
          expect(person3.name).equals('Alice Ford');
          expect(person3._metadata.version).equals(person2._metadata.version);
        });
      });
    });

    it('should not refresh if a loaded object is still up to date', function() {
      person.name = 'Tom Miller';

      return db.Person.get(person._metadata.id).then(function(obj) {
        expect(obj.name).equals('Tom Miller');
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


  describe('remove', function() {
    var person;

    beforeEach(function() {
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

    it('should remove object from database', function() {
      return person.remove().then(function(removed) {
        expect(person).eqls(removed);
        return expect(db.Person.get(person._metadata.id)).become(null);
      });
    });

    it('should remove object from EntityManager', function() {
      expect(db.contains(person)).be.true;
      return person.remove().then(function() {
        expect(db.contains(person)).be.false;
      });
    });

    it('should mark as dirty', function() {
      return person.remove().then(function(deleted) {
        expect(deleted._metadata.isDirty).be.true;
      });
    });

    it('should remove version', function() {
      return person.remove().then(function(deleted) {
        expect(deleted._metadata.version).be.null;
      });
    });

    it('should be allowed to save after remove', function() {
      return person.remove().invoke('save').then(function(saved) {
        expect(saved._metadata.id).be.ok;
        expect(saved._metadata.version).be.ok;
        expect(saved._metadata.isPersistent).be.true;
        expect(saved._metadata.isDirty).be.false;
        return db.Person.get(saved._metadata.id);
      }).then(function(loaded) {
        expect(loaded).be.ok;
        expect(loaded._metadata.ref).equals(person._metadata.ref);
        expect(loaded.name).equals("Peter Mueller");
        expect(loaded.age).equals(42);
        expect(loaded.date).eql(new Date("1976-11-13"));
      });
    });

    it('should be allowed to remove an object without id', function() {
      return expect(person.remove().invoke('remove')).be.rejectedWith(jspa.error.IllegalEntityError);
    });

    it('should be allowed to forcly remove an object without id', function() {
      return expect(person.remove().invoke('remove', true)).be.fulfilled;
    });

    it('should not be allowed to add removed objects with same id', function() {
      return expect(person.remove().then(function() {
        db.addReference(person);
        var newPerson = db.Person();
        newPerson._metadata.id = person._metadata.id;
        return db.addReference(newPerson);
      })).be.rejectedWith(jspa.error.EntityExistsError);
    });

    it('should not be allowed to remove outdated object', function() {
      var person;

      return expect(emf.createEntityManager().then(function(db2) {
        person = db2.Person();
        return person.save();
      }).then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        return person.remove();
      })).be.rejected;
    });

    it('should be allowed to forcibly remove outdated object', function() {
      var person;

      return emf.createEntityManager().then(function(db2) {
        person = db2.Person();
        return person.save();
      }).then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        return person.remove(true);
      }).then(function() {
        return expect(db.Person.get(person._metadata.id)).become(null);
      });
    });
  });

  describe('update', function() {
    var person;

    beforeEach(function() {
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

    it('should update object', function() {
      person.name = 'New Name';
      expect(person._metadata.version).equals('1');
      return person.update().then(function() {
        expect(person.name).equals('New Name');
        expect(person._metadata.version).equals('2');
        return expect(db.Person.get(person._metadata.id)).eventually.have.property('name', 'New Name');
      });
    });

    it('should update and refresh object', function() {
      person.name = 'New Name';
      var promise = expect(person.updateAndRefresh()).eventually.have.property('name', 'New Name');
      setTimeout(function() {
        person.name = 'Newer Name';
      }, 0);
      return promise;
    });

    it('should not allowed to update outdated object', function() {
      var person;

      return expect(emf.createEntityManager().then(function(db2) {
        person = db2.Person();
        return person.save();
      }).then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        person.name = "New Name";
        return person.update();
      })).be.rejected;
    });

    it('should allowed to forcibly update outdated object', function() {
      var person;

      return emf.createEntityManager().then(function(db2) {
        person = db2.Person();
        return person.save();
      }).then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        person.name = "New Name";
        return person.update(true);
      }).then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(loaded) {
        expect(loaded.name).equals("New Name");
        expect(loaded._metadata.version).equals("3");
      });
    });

    it('should not be allowed to insert document by update', function() {
      return expect(db.Person().update()).be.rejected;
    });
  });

  describe("insert", function() {

    it('should insert object', function() {
      var person = db.Person();
      person.name = "Peter Insert";
      return person.insert().then(function() {
        return expect(db.Person.get(person._metadata.id)).become(person);
      });
    });

    it('should insert and refresh object', function() {
      var person = db.Person();
      person.name = "Peter Insert";
      var promise = expect(person.insertAndRefresh()).eventually.have.property('name', 'Peter Insert');
      setTimeout(function() {
        person.name = "New Peter Insert";
      }, 0);
      return promise;
    });

    it('should not be allowed to insert loaded object', function() {
      var person = db.Person();
      person.name = "Peter Insert";
      return person.insert().then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(loaded) {
        loaded.name = "Peter Inserted";
        return expect(loaded.insert()).be.rejected;
      });
    });

    it('should not be allowed to insert existing object', function() {
      return emf.createEntityManager().then(function(db2) {
        var person = db2.Person();
        return person.save();
      }).then(function(saved) {
        var newPerson = db.Person();
        newPerson.name = "Blub";
        newPerson._metadata.id = saved._metadata.id;
        return expect(newPerson.insert()).rejected;
      });
    });

  });

  describe('refresh', function() {

    it('should refresh object', function() {
      var person = db.Person();
      person.name = "Old Name";
      return person.save(function() {
        return emf.createEntityManager();
      }).then(function(db2) {
        return db2.Person.get(person._metadata.id);
      }).then(function(loaded) {
        loaded.name = "New Name";
        return loaded.save();
      }).then(function() {
        expect(person).have.property('name', 'Old Name');
        return expect(person.refresh()).eventually.have.property('name', 'New Name');
      });
    });

    it('should refresh object with same version', function() {
      var person = db.Person();
      person.name = "Old Name";
      return person.save(function() {
        return emf.createEntityManager();
      }).then(function(db2) {
        return db2.Person.get(person._metadata.id);
      }).then(function(loaded) {
        loaded.name = "New Name";
        return loaded.save();
      }).then(function() {
        person._metadata.version = 2;
        expect(person).have.property('name', 'Old Name');
        return expect(db.Person.get(person._metadata.id)).eventually.have.property('name', 'Old Name');
      }).then(function() {
        return expect(person.refresh()).eventually.have.property('name', 'New Name');
      });
    });


  });

});