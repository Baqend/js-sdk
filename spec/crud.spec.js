if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  expect = chai.expect;
  DB = require('../lib');
}

describe('Test dao', function() {
  var db, personType, addressType, childType, emf, metamodel, streetType;

  before(function() {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    metamodel = emf.metamodel;

    metamodel.init({});
    metamodel.addType(personType = new DB.metamodel.EntityType("Person", metamodel.entity(Object)));
    metamodel.addType(childType = new DB.metamodel.EntityType("Child", personType));
    metamodel.addType(addressType = new DB.metamodel.EmbeddableType("Address"));
    metamodel.addType(streetType = new DB.metamodel.EntityType("Street", metamodel.entity(Object)));

    personType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("address", addressType));
    personType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("date", metamodel.baseType(Date)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("sister", personType));
    personType.addAttribute(new DB.metamodel.SingularAttribute("child", personType));

    childType.addAttribute(new DB.metamodel.SingularAttribute('mother', personType));
    childType.addAttribute(new DB.metamodel.SingularAttribute('aunt', personType));
    childType.addAttribute(new DB.metamodel.SingularAttribute('father', personType));
    childType.addAttribute(new DB.metamodel.ListAttribute("listSiblings", personType));
    childType.addAttribute(new DB.metamodel.SetAttribute("setSiblings", personType));
    childType.addAttribute(new DB.metamodel.MapAttribute("mapSiblings", personType, personType));

    addressType.addAttribute(new DB.metamodel.SingularAttribute("street", streetType));
    addressType.addAttribute(new DB.metamodel.SingularAttribute("zip", metamodel.baseType(Number)));

    streetType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
    streetType.addAttribute(new DB.metamodel.SingularAttribute("number", metamodel.baseType(Number)));
    streetType.addAttribute(new DB.metamodel.SingularAttribute("neighbor", personType));

    return saveMetamodel(metamodel);
  });

  beforeEach(function() {
    db = emf.createEntityManager();
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

    it('return false for implicit attached objects', function() {
      var obj = db.Person();
      expect(db.contains(obj)).be.false;
    });
  });

  describe('attach', function() {
    before(function() {
      if (!DB.isReady) {
        return DB.connect(env.TEST_SERVER);
      }
    });

    it('should unattached object to db', function() {
      var obj = db.Person();

      expect(obj.id).be.null;
      expect(db.contains(obj)).be.false;

      obj.attach(db);

      expect(obj.id).be.ok;
      expect(db.contains(obj)).be.true;
      expect(obj._metadata.db).equals(db);
    });

    it('should not reattach objects to another db', function() {
      var obj = db.Person();
      obj.attach(db);

      var db2 =  emf.createEntityManager();
      expect(function() { obj.attach(db2); }).throw(DB.error.EntityExistsError);
      expect(obj._metadata.db).equals(db);
      expect(db2.contains(obj)).be.false;
    });

    it('should ignore attach object to same db', function() {
      var obj = new personType.typeConstructor();
      expect(obj.id).be.null;

      obj.attach(db);
      expect(obj.id).be.ok;

      var id = obj.id;
      obj.attach(db);
      expect(obj.id).equals(id);

      expect(obj._metadata.db).equals(db);
      expect(db.contains(obj)).be.true;
    });

    it('should attach implicit attached objects to same db', function() {
      var obj = new personType.typeConstructor();
      expect(obj._metadata.db).equals(DB);
      expect(DB.contains(obj)).be.false;

      obj.attach(DB);

      expect(obj._metadata.db).equals(DB);
      expect(DB.contains(obj)).be.true;
    });

    it('should not reattach implicit attached objects to another db', function() {
      var obj = new personType.typeConstructor();
      expect(obj._metadata.db).equals(DB);

      expect(function() { obj.attach(db); }).throw(DB.error.EntityExistsError);
      expect(obj._metadata.db).equals(DB);
      expect(db.contains(obj)).be.false;
    });
  });

  describe('save', function() {
    it('should save new object', function() {
      var person = db.Person();

      return person.save(function(result) {
        expect(person.id).be.ok;
        expect(person.version).be.ok;
        expect(person._metadata.isPersistent).be.true;
        expect(person._metadata.isDirty).be.false;
        expect(person).equals(result);
      });
    });

    it('should save new object from JSON', function() {
      var person = {
        "name": "TestName",
        "address": {
          "zip": 22527
        }
      };
      return db.Person.fromJSON(person).save(function(saved) {
        expect(saved.name).eqls(person.name);
        expect(saved.address.zip).eqls(person.address.zip);
      });
    });

    it('should save and refresh object', function() {
      var person = db.Person();
      person.name = "Old Name";
      var promise = expect(person.save({refresh:true})).eventually.have.property('name', 'Old Name');
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
      var db2 = emf.createEntityManager();
      var person = db2.Person();

      return expect(person.save().then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          person2.name = 'Peter Parker';
          return person2.save();
        });
      }).then(function() {
        person.name = 'Alice Ford';
        return person.save();
      })).be.rejected.then(function(e) {
        expect(e).instanceOf(DB.error.PersistentError);
        return expect(db.Person.get(person._metadata.id)).eventually.have.property('name', 'Peter Parker');
      });
    });

    it('should forcibly save a stale object', function() {
      var db2 = emf.createEntityManager();
      var person = db2.Person();

      return person.save().then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          person2.name = 'Peter Parker';
          return person2.save();
        });
      }).then(function() {
        person.name = 'Alice Ford';
        return person.save({force:true});
      }).then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          expect(person2.name).equals('Alice Ford');
        });
      });
    });

    it('should not override an object that exists', function() {
      var db2 = emf.createEntityManager();
      var person = db2.Person();

      return person.save().then(function() {
        var newPerson = db.Person();
        newPerson._metadata.id = person._metadata.id;
        return expect(newPerson.save()).rejected;
      });
    });

    it('should forcibly override an object that exists', function() {
      var db2 = emf.createEntityManager();
      var person = db2.Person();

      return person.save().then(function() {
        var newPerson = db.Person();
        newPerson.name = 'Peter Parker';
        newPerson._metadata.id = person._metadata.id;
        return newPerson.save({force:true});
      }).then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          expect(person2.name).equals('Peter Parker');
        });
      });
    });

    it('should not save an removed object', function() {
      var person = db.Person();
      return person.save().then(function() {
        var db2 = emf.createEntityManager();

        return db2.Person.get(person._metadata.id).then(function(person2) {
          return person2.remove();
        });
      }).then(function() {
        person.name = "New Name";
        return expect(person.save()).rejected;
      });
    });

    it('should forcibly save an removed object', function() {
      var person = db.Person();
      return person.save().then(function() {
        var db2 = emf.createEntityManager();

        return db2.Person.get(person._metadata.id).then(function(person2) {
          return person2.remove();
        });
      }).then(function() {
        person.name = 'Peter Parker';
        return person.save({force:true});
      }).then(function() {
        return db.Person.get(person._metadata.id).then(function(person2) {
          expect(person2.name).equals('Peter Parker');
        });
      });
    });

    it('should not be allowed to call save twice', function() {
      var person = db.Person();
      person.save();
      expect(person.save.bind(person)).to.throw(Error);
    });

    it('should not save and overwrite afterward changed values', function() {
      var person = db.Person();
      person.name = 'Old Name';
      var promise = person.save();
      person.name = 'New Name';
      return promise.then(function() {
        expect(person._metadata.isDirty).be.true;
        expect(person.name).equals('New Name');
      })
    });

    it('should not save afterward changed values but refrehs it', function() {
      var person = db.Person();
      person.name = 'Old Name';
      var promise = person.save({refresh:true});
      person.name = 'New Name';
      return promise.then(function() {
        expect(person._metadata.isDirty).be.false;
        expect(person.name).equals('Old Name');
      })
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
        expect(saved.id).be.ok;
        expect(saved.version).be.ok;
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
      var p1 = db.Person.get(person.id);
      var p2 = db.Person.get(person.id);

      return Promise.all([p1, p2]).then(function(loaded) {
        expect(loaded[0]).be.ok;
        expect(loaded[0]).equals(loaded[1]);
      });
    });

    it('should refresh if the object is stale', function() {
      var db2 = emf.createEntityManager();
      person.name = 'Tom Miller';

      return db2.Person.get(person.id).then(function(person2) {
        expect(person2.name).equals('Peter Mueller');
        person2.name = 'Alice Ford';
        return person2.save();
      }).then(function(person2) {
        return db.Person.get(person.id).then(function(person3) {
          expect(person3).equals(person);
          expect(person3.name).equals('Alice Ford');
          expect(person3._metadata.version).equals(person2._metadata.version);
        });
      });
    });

    it('should not refresh if a loaded object is still up to date', function() {
      person.name = 'Tom Miller';

      return db.Person.get(person.id).then(function(obj) {
        expect(obj.name).equals('Tom Miller');
      });
    });

    it('should retrieved different version in different db context', function() {
      var db2 = emf.createEntityManager();

      var p1 = db.Person.get(person.id);
      var p2 = db2.Person.get(person.id);

      return Promise.all([p1, p2]).then(function(loaded) {
        expect(loaded[0]).not.equals(loaded[1]);
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
        return expect(db.Person.get(person.id)).become(null);
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
      return person.remove().then(function(per) { return per.save(); }).then(function(saved) {
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
      return expect(person.remove().then(function(per) { return per.remove() })).be.rejectedWith(DB.error.IllegalEntityError);
    });

    it('should be allowed to forcly remove an object without id', function() {
      return expect(person.remove().then(function(per) { return per.remove({force:true}) } )).be.fulfilled;
    });

    it('should not be allowed to add removed objects with same id', function() {
      return expect(person.remove().then(function() {
        db.attach(person);
        var newPerson = db.Person();
        newPerson._metadata.id = person._metadata.id;
        return db.attach(newPerson);
      })).be.rejectedWith(DB.error.EntityExistsError);
    });

    it('should not be allowed to remove outdated object', function() {
      var db2 = emf.createEntityManager();
      var person = db2.Person();

      return expect(person.save().then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        return person.remove();
      })).be.rejected;
    });

    it('should be allowed to forcibly remove outdated object', function() {
      var db2 = emf.createEntityManager();
      var person = db2.Person();

      return person.save().then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        return person.remove({force:true});
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
      var promise = expect(person.update({refresh:true})).eventually.have.property('name', 'New Name');
      person.name = 'Newer Name';

      return promise;
    });

    it('should not allowed to update outdated object', function() {
      var db2 = emf.createEntityManager();
      var person = db2.Person();

      return expect(person.save().then(function() {
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
      var db2 = emf.createEntityManager();
      var person = db2.Person();

      return person.save().then(function() {
        return db.Person.get(person._metadata.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        person.name = "New Name";
        return person.update({force:true});
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
      var promise = expect(person.insert({refresh:true})).eventually.have.property('name', 'Peter Insert');
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
      var db2 = emf.createEntityManager();
      var person = db2.Person();

      return person.save().then(function(saved) {
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

    it('should refresh object when removed', function() {
      var person = db.Person();
      person.name = "Old Name";

      return person.save().then(function(obj) {
        return emf.createEntityManager();
      }).then(function(db2) {
        return db2.Person.get(person.id);
      }).then(function(loaded) {
        return loaded.remove();
      }).then(function() {
        return person.refresh();
      }).then(function(obj) {
        return expect(obj).be.null;
      });
    });
  });

  describe('depth', function() {

    var child, father, mother, sister, street, address, sibs;

    beforeEach(function() {
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
      child.listSiblings = new DB.List();
      child.setSiblings = new DB.Set();
      child.mapSiblings = new DB.Map();
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

    it('should save and convert result to JSON', function() {
      return child.save({depth:true}).then(function(saved) {
        var json = saved.toJSON();
        expect(json.aunt).eqls(mother._metadata.ref);
        expect(json.name).eqls(child.name);
      });
    });

    it('should save and remove referenced objects by depth', function() {
      return child.save({depth:2}).then(function() {
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
        return Promise.all(promises);
      }).then(function() {
        return child.remove({depth: 2});
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
        return Promise.all(promises);
      });
    });

    it('should save and remove referenced objects by reachability', function() {
      return child.save({depth:true}).then(function() {
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
        return Promise.all(promises);
      }).then(function() {
        return child.remove({depth:true});
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
        return Promise.all(promises);
      });
    });

    it('should get referenced objects by depth', function() {
      var db2;
      return child.save({depth:true}).then(function(saved) {
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
      return child.save({depth:true}).then(function(saved) {
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
      return child.save({depth:true}).then(function(saved) {
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
      return child.save({depth:true}).then(function(saved) {
        var promise = saved.refresh({depth:true});
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("Schwester Meier");
        expect(loaded.father.name).equals("Franz Meier");
      });
    });

    it('should refresh all referenced objects by depth', function() {
      return child.save({depth:2}).then(function(saved) {
        var promise = saved.refresh({depth:true});
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("Schwester Meier");
        expect(loaded.father.name).equals("Franz Meier");
      });
    });

    it('should not refresh all referenced objects', function() {
      return child.save({depth:true}).then(function(saved) {
        var promise = saved.refresh({depth:1});
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("Franz Meier");
      });
    });

    it('should insert referenced objects by depth', function() {
      return child.insert({depth:2}).then(function() {
        return Promise.all([
          expect(db.Child.get(child._metadata.id)).not.become(null),
          expect(db.Person.get(mother._metadata.id)).not.become(null),
          expect(db.Person.get(father._metadata.id)).not.become(null),
          expect(db.Street.get(street._metadata.id)).not.become(null),
          expect(db.Person.get(sister._metadata.id)).not.become(null)
        ]);
      });
    });

    it('should insert referenced objects by reachability', function() {
      return child.insert({depth:true}).then(function() {
        return Promise.all([
          expect(db.Child.get(child._metadata.id)).not.become(null),
          expect(db.Person.get(mother._metadata.id)).not.become(null),
          expect(db.Person.get(father._metadata.id)).not.become(null),
          expect(db.Street.get(street._metadata.id)).not.become(null),
          expect(db.Person.get(sister._metadata.id)).not.become(null)
        ]);
      });
    });

    it('should update all referenced objects by depth', function() {
      return child.save({depth:true}).then(function(saved) {
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return saved.update({force:true, depth:2});
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("New Name");
      });
    });

    it('should update all referenced objects by reachability', function() {
      return child.save({depth:true}).then(function(saved) {
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return saved.update({force:true, depth:true});
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("New Name");
      });
    });

    it('should update and refresh all referenced objects by reachability', function() {
      return child.save({depth:true}).then(function(saved) {
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        var promise = saved.update({refresh:true, force:true, depth: true});
        saved.father.sister.name = "Newer Name";
        saved.father.name = "Newer Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("New Name");
      });
    });
  });

  describe('custom ids', function() {
    var myId;

    beforeEach(function() {
      myId = randomize('a/db/bucket/?param=3\\ed&g=1');
    });

    afterEach(function() {
      return db.Person.get(myId).then(function(obj) {
        return obj.remove();
      });
    });

    it('should create and load new object', function() {
      var person = db.Person();
      person.id = myId;
      person.name = "Custom Person";

      return person.save(function(result) {
        expect(person.id).equals(myId);
        expect(person.name).equals("Custom Person");
        expect(person).equals(result);
        return db.Person.get(myId);
      }).then(function(person) {
        expect(person.id).equals(myId);
        expect(person.name).equals("Custom Person");
        return emf.createEntityManager();
      }).then(function(db2) {
        return db2.Person.get(myId);
      }).then(function(person) {
        expect(person.id).equals(myId);
        expect(person.name).equals("Custom Person");
      });
    });

    it('should useable as references', function() {
      var person = db.Person();
      person.id = myId;
      person.name = "Custom Person";

      var childId = randomize('my/craßy*%unescap\\ed&id?=');
      person.child = db.Person();
      person.child.name = "Custom Child Person";
      person.child.id = childId;

      return person.save({refresh:true, depth: true}, function(result) {
        expect(person.id).equals(myId);
        expect(person.name).equals("Custom Person");
        expect(person.child.id).equals(childId);
        expect(person.child.name).equals("Custom Child Person");
        return emf.createEntityManager();
      }).then(function(db2) {
        return db2.Person.get(childId).then(function(child) {
          expect(child.id).equals(childId);
          expect(child.name).equals("Custom Child Person");
          return db2.Person.get(myId);
        }).then(function(person) {
          expect(person.id).equals(myId);
          expect(person.name).equals("Custom Person");
          expect(person.child.id).equals(childId);
          expect(person.child.name).equals("Custom Child Person");
          return db2.Person.get(childId);
        }).then(function(child) {
          return child.remove();
        });
      }).then(function() {
        return person.child.refresh();
      }).then(function(obj) {
        expect(obj).be.null;
      });
    })
  });
});