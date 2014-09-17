if (typeof jspa == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  expect = chai.expect;
  jspa = require('../lib');
}

describe('Test dao', function() {
  var db, personType, addressType, childType, emf, metamodel, streetType;

  before(function() {
    emf = new jspa.EntityManagerFactory(env.TEST_SERVER);
    metamodel = emf.metamodel;

    metamodel.init();
    metamodel.addType(personType = new jspa.metamodel.EntityType("Person", metamodel.entity(Object)));
    metamodel.addType(childType = new jspa.metamodel.EntityType("Child", personType));
    metamodel.addType(addressType = new jspa.metamodel.EmbeddableType("Address"));
    metamodel.addType(streetType = new jspa.metamodel.EntityType("Street", metamodel.entity(Object)));

    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "name", metamodel.baseType(String)));
    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "address", addressType));
    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "age", metamodel.baseType(Number)));
    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "date", metamodel.baseType(Date)));
    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "sister", personType));
    personType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(personType, "child", personType));

    childType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(childType, 'mother', personType));
    childType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(childType, 'aunt', personType));
    childType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(childType, 'father', personType));
    childType.declaredAttributes.push(new jspa.metamodel.ListAttribute(childType, "listSiblings", personType));
    childType.declaredAttributes.push(new jspa.metamodel.SetAttribute(childType, "setSiblings", personType));
    childType.declaredAttributes.push(new jspa.metamodel.MapAttribute(childType, "mapSiblings", personType, personType));


    addressType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(addressType, "street", streetType));
    addressType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(addressType, "zip", metamodel.baseType(Number)));

    streetType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(addressType, "name", metamodel.baseType(String)));
    streetType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(addressType, "number", metamodel.baseType(Number)));
    streetType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(addressType, "neighbor", personType));

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
      person.name = "New Name";
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
          return db2.Person.get(person._metadata.id).then(function(person2) {
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
          return db2.Person.get(person._metadata.id).then(function(person2) {
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
      return person.save();
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
      person.name = 'Newer Name';

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
      expect(function() {
        db.Person().update()
      }).throw(Error);
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
      person.name = "New Peter Insert";
      return promise;
    });

    it('should not be allowed to insert loaded object', function() {
      var person = db.Person();
      person.name = "Peter Insert";
      return person.insert().then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(loaded) {
        loaded.name = "Peter Inserted";
        expect(function() {
          loaded.insert()
        }).throw(Error);
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

  describe('depth', function() {

    var child, father, mother, sister, street, address, sibs;

    before(function() {
      child = db.Child();
      father = db.Person();
      mother = db.Person();
      sister = db.Person();
      street = db.Street();
      address = db.Address();
      sister.name = "Schwester Meier";
      sister.age = 44;
      mother.name = "Hildegard Meier";
      mother.age = 56;
      father.name = "Franz Meier";
      father.age = 60;
      child.name = "Peter Meier";
      child.age = 13;
      street.name = "Vogt-Kölln-Straße";
      street.number = 30;
      address.street = street;
      address.zip = 22527;
      address.number = 30;
      father.sister = sister;
      father.child = child;
      child.address = address;
      child.mother = mother;
      child.aunt = mother;
      child.father = father;
      child.listSiblings = new jspa.List();
      child.setSiblings = new jspa.Set();
      child.mapSiblings = new jspa.Map();
      sibs = [];
      for(var i = 0; i < 6; i++) {
        var sib = db.Person();
        sib.name = "sib" + i;
        sibs.child = child;
        sibs.sister = mother;
        sibs.address = address;
        sibs.push(sib);
      }
      child.listSiblings.add(sibs[0]);
      child.listSiblings.add(sibs[1]);
      child.setSiblings.add(sibs[2]);
      child.setSiblings.add(sibs[3]);
      child.mapSiblings.set(sibs[4], sibs[5]);
    });

    after(function() {
      child.remove(true, true);
    });

    it('should save and remove referenced objects by depth', function() {
      return child.save(false, 2).then(function() {
        var promises = [
          expect(db.Child.get(child._metadata.id)).not.become(null),
          expect(db.Person.get(mother._metadata.id)).not.become(null),
          expect(db.Person.get(father._metadata.id)).not.become(null),
          expect(db.Street.get(street._metadata.id)).not.become(null),
          expect(db.Person.get(sister._metadata.id)).not.become(null)
        ];
        sibs.forEach(function(sib) {
          promises.push(expect(db.Person.get(sib._metadata.id)).not.become(null))
        });
        return jspa.Q.all(promises);
      }).then(function() {
        return child.remove(false, 2);
      }).then(function(removed) {
        expect(removed).equals(child);
        var promises = [
          expect(db.Child.get(child._metadata.id)).become(null),
          expect(db.Person.get(mother._metadata.id)).become(null),
          expect(db.Person.get(father._metadata.id)).become(null),
          expect(db.Street.get(street._metadata.id)).become(null),
          expect(db.Person.get(sister._metadata.id)).become(null)
        ];
        sibs.forEach(function(sib) {
          promises.push(expect(db.Person.get(sib._metadata.id)).become(null))
        });
        return jspa.Q.all(promises);
      });
    });

    it('should save and remove referenced objects by reachability', function() {
      return child.save(false, true).then(function() {
        var promises = [
          expect(db.Child.get(child._metadata.id)).not.become(null),
          expect(db.Person.get(mother._metadata.id)).not.become(null),
          expect(db.Person.get(father._metadata.id)).not.become(null),
          expect(db.Street.get(street._metadata.id)).not.become(null),
          expect(db.Person.get(sister._metadata.id)).not.become(null)
        ];
        sibs.forEach(function(sib) {
          promises.push(expect(db.Person.get(sib._metadata.id)).not.become(null))
        });
        return jspa.Q.all(promises);
      }).then(function() {
        return child.remove(false, true);
      }).then(function(removed) {
        expect(removed).equals(child);
        var promises = [
          expect(db.Child.get(child._metadata.id)).become(null),
          expect(db.Person.get(mother._metadata.id)).become(null),
          expect(db.Person.get(father._metadata.id)).become(null),
          expect(db.Street.get(street._metadata.id)).become(null),
          expect(db.Person.get(sister._metadata.id)).become(null)
        ];
        sibs.forEach(function(sib) {
          promises.push(expect(db.Person.get(sib._metadata.id)).become(null))
        });
        return jspa.Q.all(promises);
      });
    });

    it('should get referenced objects by depth', function() {
      var db2;
      return child.save(false, true).then(function(saved) {
        child = saved;
        return emf.createEntityManager();
      }).then(function(em) {
        db2 = em;
        sibs.forEach(function(sib) {
          expect(db2.containsById(sib)).be.false;
        });
        expect(db2.containsById(father)).be.false;
        expect(db2.containsById(sister)).be.false;
        expect(db2.containsById(mother)).be.false;
        expect(db2.containsById(street)).be.false;
        return em.Child.get(child._metadata.id, 2);
      }).then(function(loaded) {
        expect(loaded.father.sister._metadata.isAvailable).be.true;
        expect(loaded.father._metadata.isAvailable).be.true;
        expect(loaded.mother._metadata.isAvailable).be.true;
        expect(loaded.address.street._metadata.isAvailable).be.true;
        expect(loaded.father.name).eqls(father.name);
        expect(loaded.father.sister.name).eqls(sister.name);
        expect(loaded.mother.name).eqls(mother.name);
        expect(loaded.address.street.name).eqls(street.name);
      });
    });

    it('should get referenced objects by reachability', function() {
      var db2;
      return child.save(false, true).then(function(saved) {
        child = saved;
        return emf.createEntityManager();
      }).then(function(em) {
        db2 = em;
        expect(db2.containsById(father)).be.false;
        expect(db2.containsById(sister)).be.false;
        expect(db2.containsById(mother)).be.false;
        expect(db2.containsById(street)).be.false;
        return em.Child.get(child._metadata.id, true);
      }).then(function(loaded) {
        expect(loaded.father.sister._metadata.isAvailable).be.true;
        expect(loaded.father._metadata.isAvailable).be.true;
        expect(loaded.mother._metadata.isAvailable).be.true;
        expect(loaded.address.street._metadata.isAvailable).be.true;
        expect(loaded.father.name).eqls(father.name);
        expect(loaded.father.sister.name).eqls(sister.name);
        expect(loaded.mother.name).eqls(mother.name);
        expect(loaded.address.street.name).eqls(street.name);
      });
    });

    it('should not get all referenced objects', function() {
      return child.save(false, true).then(function(saved) {
        child = saved;
        return emf.createEntityManager();
      }).then(function(em) {
        return em.Child.get(child._metadata.id, 1);
      }).then(function(loaded) {
        expect(loaded.father.sister._metadata.isAvailable).be.false;
        expect(loaded.father._metadata.isAvailable).be.true;
        expect(loaded.mother._metadata.isAvailable).be.true;
        expect(loaded.address.street._metadata.isAvailable).be.true;
      });
    });

    it('should refresh all referenced objects by reachability', function() {
      return child.save(false, true).then(function(saved) {
        var promise = saved.refresh(true);
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("Schwester Meier");
        expect(loaded.father.name).equals("Franz Meier");
      });
    });

    it('should refresh all referenced objects by depth', function() {
      return child.save(false, 2).then(function(saved) {
        var promise = saved.refresh(true);
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("Schwester Meier");
        expect(loaded.father.name).equals("Franz Meier");
      });
    });

    it('should not refresh all referenced objects', function() {
      return child.save(false, true).then(function(saved) {
        var promise = saved.refresh(1);
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("Franz Meier");
      });
    });

    it('should insert referenced objects by depth', function() {
      return child.insert(false, 2).then(function() {
        return jspa.Q.all([
          expect(db.Child.get(child._metadata.id)).not.become(null),
          expect(db.Person.get(mother._metadata.id)).not.become(null),
          expect(db.Person.get(father._metadata.id)).not.become(null),
          expect(db.Street.get(street._metadata.id)).not.become(null),
          expect(db.Person.get(sister._metadata.id)).not.become(null)
        ]);
      });
    });

    it('should insert referenced objects by reachability', function() {
      return child.insert(false, true).then(function() {
        return jspa.Q.all([
          expect(db.Child.get(child._metadata.id)).not.become(null),
          expect(db.Person.get(mother._metadata.id)).not.become(null),
          expect(db.Person.get(father._metadata.id)).not.become(null),
          expect(db.Street.get(street._metadata.id)).not.become(null),
          expect(db.Person.get(sister._metadata.id)).not.become(null)
        ]);
      });
    });

    it('should update all referenced objects by depth', function() {
      return child.save(false, true).then(function(saved) {
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return saved.update(true, 2);
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("New Name");
      });
    });

    it('should update all referenced objects by reachability', function() {
      return child.save(false, true).then(function(saved) {
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return saved.update(true, true);
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("New Name");
      });
    });

    it('should update and refresh all referenced objects by reachability', function() {
      return child.save(false, true).then(function(saved) {
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        var promise = saved.updateAndRefresh(true, true);
        saved.father.sister.name = "Newer Name";
        saved.father.name = "Newer Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("New Name");
      });
    });
  });
});