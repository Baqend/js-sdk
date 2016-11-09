var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test crud', function() {
  var db, db2, personType, addressType, childType, emf, metamodel, streetType;

  before(function() {
    emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage});
    metamodel = emf.metamodel;

    return emf.ready().then(function() {
      if (!metamodel.entity("Person")) {
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
      } else {
        personType = metamodel.entity("Person");
        addressType = metamodel.embeddable("Address");
        childType = metamodel.entity("Child");
        streetType = metamodel.entity("Street");
      }

      return metamodel.save();
    });
  });

  beforeEach(function() {
    db = emf.createEntityManager();
    db2 = emf.createEntityManager();
    return Promise.all([db.ready(), db2.ready()]);
  });

  describe('contains', function() {
    it('return false for none entity objects', function() {
      expect(db.contains({})).be.false;
      expect(db.contains([])).be.false;
      expect(db.contains(null)).be.false;
      expect(db.contains(new addressType.typeConstructor())).be.false;
    });

    it('return false for unattached objects', function() {
      var obj = personType.create();
      expect(db.contains(obj)).be.false;

      obj._metadata.db = db;

      expect(db.contains(obj)).be.false;
    });

    it('return false for implicit attached objects', function() {
      var obj = new db.Person();
      expect(db.contains(obj)).be.false;
    });
  });

  describe('attach', function() {
    before(function() {
      if (!DB.isReady) {
        DB.staleness = 0; //ensure a fresh schema
        return DB.connect(env.TEST_SERVER);
      }
    });

    it('should implicit attach object to db', function() {
      var obj = new db.Person();

      expect(obj.id).be.null;
      expect(db.contains(obj)).be.false;
      expect(obj._metadata.isAttached).be.true;
      expect(obj._metadata.db).equals(db);
    });

    it('should not reattach objects to another db', function() {
      var obj = new db.Person();

      expect(function() {
        obj.attach(db2);
      }).throw(DB.error.EntityExistsError);
      expect(obj._metadata.db).equals(db);
      expect(db2.contains(obj)).be.false;
    });

    it('should ignore attach object to same db', function() {
      var obj = personType.create();
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
      var obj = personType.create();
      expect(obj._metadata.db).equals(DB);
      expect(DB.contains(obj)).be.false;

      obj.attach(DB);

      expect(obj._metadata.db).equals(DB);
      expect(DB.contains(obj)).be.true;
    });

    it('should not reattach implicit attached objects to another db', function() {
      var obj = personType.create();
      expect(obj._metadata.db).equals(DB);

      expect(function() {
        obj.attach(db);
      }).throw(DB.error.EntityExistsError);
      expect(obj._metadata.db).equals(DB);
      expect(db.contains(obj)).be.false;
    });
  });

  describe('save', function() {
    it('should save new object', function() {
      var person = new db.Person();

      return person.save(function(result) {
        expect(person.id).be.ok;
        expect(person.version).be.ok;
        expect(person._metadata.isPersistent).be.true;
        expect(person._metadata.isDirty).be.false;
        expect(person).equals(result);
      });
    });

    it('should save new object from JSON', function() {
      var json = {
        "name": "TestName",
        "address": {
          "zip": 22527
        }
      };

      var person = db.Person.fromJSON(json);
      expect(db.util.Metadata.get(person).db).eql(db);

      return person.save(function(saved) {
        expect(saved.name).eql(json.name);
        expect(saved.address.zip).eql(json.address.zip);
      });
    });

    it('should save existing object from JSON', function() {
      var json = {
        "id": "/db/Person/" + db.util.uuid(),
        "name": "TestName",
        "address": {
          "zip": 22527
        }
      };

      var person = db.Person.fromJSON(json);
      expect(db.util.Metadata.get(person).db).eql(db);

      return person.save(function(saved) {
        expect(saved.id).eqls(json.id);
        expect(saved.name).eqls(json.name);
        expect(saved.address.zip).eqls(json.address.zip);
      });
    });

    it('should save and refresh object', function() {
      var person = new db.Person();
      person.name = "Old Name";
      var promise = expect(person.save({refresh: true})).eventually.have.property('name', 'Old Name');
      person.name = "New Name";
      return promise;
    });

    it('should save a second time', function() {
      var person = new db.Person();
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
      var person = new db2.Person();

      return expect(person.save().then(function() {
        return db.Person.load(person._metadata.id).then(function(person2) {
          person2.name = 'Peter Parker';
          return person2.save();
        });
      }).then(function() {
        person.name = 'Alice Ford';
        return person.save();
      })).be.rejected.then(function(e) {
        expect(e).instanceOf(DB.error.PersistentError);
        return expect(db.Person.load(person._metadata.id)).eventually.have.property('name', 'Peter Parker');
      });
    });

    it('should forcibly save a stale object', function() {
      var person = new db2.Person();

      return person.save().then(function() {
        return db.Person.load(person.id).then(function(person2) {
          person2.name = 'Peter Parker';
          return person2.save();
        });
      }).then(function() {
        person.name = 'Alice Ford';
        return person.save({force: true});
      }).then(function() {
        return db.Person.load(person.id).then(function(person2) {
          expect(person2.name).equals('Alice Ford');
        });
      });
    });

    it('should not override an object that exists', function() {
      var person = new db2.Person();

      return person.save().then(function() {
        var newPerson = new db.Person();
        newPerson.id = person.id;
        return expect(newPerson.save()).rejected;
      });
    });

    it('should forcibly override an object that exists', function() {
      var person = new db2.Person();

      return person.save().then(function() {
        var newPerson = new db.Person();
        newPerson.name = 'Peter Parker';
        newPerson.id = person.id;
        return newPerson.save({force: true});
      }).then(function() {
        return db.Person.load(person.id).then(function(person2) {
          expect(person2.name).equals('Peter Parker');
        });
      });
    });

    it('should not save an deleted object', function() {
      var person = new db.Person();
      return person.save().then(function() {
        return db2.Person.load(person.id).then(function(person2) {
          return person2.delete();
        });
      }).then(function() {
        person.name = "New Name";
        return expect(person.save()).rejected;
      });
    });

    it('should forcibly save an deleted object', function() {
      var person = new db.Person();
      return person.save().then(function() {
        return db2.Person.load(person.id).then(function(person2) {
          return person2.delete();
        });
      }).then(function() {
        person.name = 'Peter Parker';
        return person.save({force: true});
      }).then(function() {
        return db.Person.load(person.id).then(function(person2) {
          expect(person2.name).equals('Peter Parker');
        });
      });
    });

    it('should not be allowed to call save twice', function() {
      var person = new db.Person();
      person.save();
      expect(person.save.bind(person)).to.throw(Error);
    });

    it('should not save and overwrite afterward changed values', function() {
      var person = new db.Person();
      person.name = 'Old Name';
      var promise = person.save();
      person.name = 'New Name';
      return promise.then(function() {
        expect(person._metadata.isDirty).be.true;
        expect(person.name).equals('New Name');
      })
    });

    it('should not save afterward changed values but refrehs it', function() {
      var person = new db.Person();
      person.name = 'Old Name';
      var promise = person.save({refresh: true});
      person.name = 'New Name';
      return promise.then(function() {
        expect(person._metadata.isDirty).be.false;
        expect(person.name).equals('Old Name');
      })
    });


    describe('optimisticSave', function() {

      it('should retry if the object is out of date', function() {
        var person = new db2.Person();
        var newPerson;

        var i = 0;

        return person.save().then(function() {
          return db.Person.load(person.id);
        }).then(function(per) {
          newPerson = per;
          newPerson.name = 'Peter Parker';
          person.name = 'New Name';
          return person.save();
        }).then(function() {
          return newPerson.optimisticSave(function(optimisticPerson) {
            optimisticPerson.name = ++i;
          });
        }).then(function(result) {
          expect(result.name).equals(2);
          expect(result.version).equals(3);
        });
      });

      it('should be allowed to abort the process', function() {
        var person = new db2.Person();
        var newPerson;

        var i = 0;

        return person.save().then(function() {
          return db.Person.load(person.id);
        }).then(function(per) {
          newPerson = per;
          newPerson.name = 'Peter Parker';
          person.name = 'New Name';
          return person.save();
        }).then(function() {
          return newPerson.optimisticSave(function(optimisticPerson, abort) {
            i++;
            if (i == 2) {
              return abort();
            }
            optimisticPerson.name = i;
          });
        }).then(function(result) {
          expect(result.name).equals("New Name");
          expect(result.version).equals(2);
        });
      });

      it('should be allowed to return a promise', function() {
        var person = new db2.Person();
        var newPerson;

        var otherPerson = new db2.Person();
        otherPerson.name = "OtherName";

        return otherPerson.save().then(function() {
          return person.save();
        }).then(function() {
          return db.Person.load(person.id);
        }).then(function(per) {
          newPerson = per;
          newPerson.name = 'Peter Parker';
          person.name = 'New Name';
          return person.save();
        }).then(function() {
          return newPerson.optimisticSave(function(optimisticPerson) {
            return db.Person.load(otherPerson.id).then(function(loadedOtherPerson) {
              optimisticPerson.name = loadedOtherPerson.name
            });
          });
        }).then(function(result) {
          expect(result.name).equals("OtherName");
          expect(result.version).equals(3);
        });
      });

    });
  });


  describe('get', function() {
    var person;

    beforeEach(function() {
      person = new db.Person();
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
      return db.Person.load(person.id).then(function(loaded) {
        expect(loaded).be.ok;
        expect(loaded.id).equals(person.id);
        expect(loaded.name).equals("Peter Mueller");
        expect(loaded.age).equals(42);
        expect(loaded.date).eql(new Date("1976-11-13"));
      });
    });

    it('should retrieved same version in same db context', function() {
      var p1 = db.Person.load(person.id);
      var p2 = db.Person.load(person.id);

      return Promise.all([p1, p2]).then(function(loaded) {
        expect(loaded[0]).be.ok;
        expect(loaded[0]).equals(loaded[1]);
      });
    });

    it('should refresh if the object is stale', function() {
      person.name = 'Tom Miller';

      return db2.Person.load(person.id).then(function(person2) {
        expect(person2.name).equals('Peter Mueller');
        person2.name = 'Alice Ford';
        return person2.save();
      }).then(function(person2) {
        return db.refreshBloomFilter().then(function() {
          return db.Person.load(person.id);
        }).then(function(person3) {
          expect(person3).equals(person);
          expect(person3.name).equals('Alice Ford');
          expect(person3.version).equals(person2.version);
        });
      });
    });

    it('should not refresh local state (static load with option)', function() {
      person.name = 'Tom Miller';

      return db.Person.load(person.id, {local: true}).then(function(obj) {
        expect(obj.name).equals('Tom Miller');
      });
    });

    it('should not refresh local state', function() {
      person.name = 'Tom Miller';

      return person.load().then(function(obj) {
        expect(obj.name).equals('Tom Miller');
      });
    });

    it('should refresh local state', function() {
      person.name = 'Tom Miller';

      return person.load({refresh: true}).then(function(obj) {
        expect(obj.name).equals('Peter Mueller');
      });
    });

    it('should refresh with static load', function() {
      person.name = 'Tom Miller';

      return db.Person.load(person.id).then(function(obj) {
        expect(obj.name).equals('Peter Mueller');
      });
    });

    it('should retrieved different version in different db context', function() {
      var p1 = db.Person.load(person.id);
      var p2 = db2.Person.load(person.id);

      return Promise.all([p1, p2]).then(function(loaded) {
        expect(loaded[0]).not.equals(loaded[1]);
      });
    });
  });


  describe('delete', function() {
    var person;

    beforeEach(function() {
      person = new db.Person();
      person.name = "Peter Mueller";
      person.age = 42;
      person.date = new Date("1976-11-13");
      return person.save();
    });

    it('should delete object from database', function() {
      return person.delete().then(function(deleted) {
        expect(person).eqls(deleted);
        return expect(db.Person.load(person.id)).become(null);
      });
    });

    it('should delete object from EntityManager', function() {
      expect(db.contains(person)).be.true;
      return person.delete().then(function() {
        expect(db.contains(person)).be.false;
      });
    });

    it('should mark as dirty', function() {
      return person.delete().then(function(deleted) {
        expect(deleted._metadata.isDirty).be.true;
      });
    });

    it('should delete version', function() {
      return person.delete().then(function(deleted) {
        expect(deleted.version).be.null;
      });
    });

    it('should be allowed to save after delete', function() {
      return person.delete().then(function(per) {
        return per.save();
      }).then(function(saved) {
        expect(saved.id).be.ok;
        expect(saved.version).be.ok;
        expect(saved._metadata.isPersistent).be.true;
        expect(saved._metadata.isDirty).be.false;
        return db.Person.load(saved.id);
      }).then(function(loaded) {
        expect(loaded).be.ok;
        expect(loaded.id).equals(person.id);
        expect(loaded.name).equals("Peter Mueller");
        expect(loaded.age).equals(42);
        expect(loaded.date).eql(new Date("1976-11-13"));
      });
    });

    it('should be allowed to delete an object without id', function() {
      return expect(person.delete().then(function(per) {
        return per.delete()
      })).be.rejectedWith(DB.error.IllegalEntityError);
    });

    it('should be allowed to forcly delete an object without id', function() {
      return expect(person.delete().then(function(per) {
        return per.delete({force: true})
      })).be.fulfilled;
    });

    it('should not be allowed to add deleted objects with same id', function() {
      return expect(person.delete().then(function() {
        db.attach(person);
        var newPerson = new db.Person();
        newPerson.id = person.id;
        return db.attach(newPerson);
      })).be.rejectedWith(DB.error.EntityExistsError);
    });

    it('should not be allowed to delete outdated object', function() {
      var person = new db2.Person();

      return expect(person.save().then(function() {
        return db.Person.load(person.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        return person.delete();
      })).be.rejected;
    });

    it('should be allowed to forcibly delete outdated object', function() {
      var person = new db2.Person();

      return person.save().then(function() {
        return db.Person.load(person.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        return person.delete({force: true});
      }).then(function() {
        return expect(db.Person.load(person.id)).become(null);
      });
    });
  });

  describe('update', function() {
    var person;

    beforeEach(function() {
      person = new db.Person();
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

    it('should update object', function() {
      person.name = 'New Name';
      expect(person.version).equals(1);
      return person.update().then(function() {
        expect(person.name).equals('New Name');
        expect(person.version).equals(2);
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'New Name');
      });
    });

    it('should update and refresh object', function() {
      person.name = 'New Name';
      var promise = expect(person.update({refresh: true})).eventually.have.property('name', 'New Name');
      person.name = 'Newer Name';

      return promise;
    });

    it('should not allowed to update outdated object', function() {
      var person = new db2.Person();

      return expect(person.save().then(function() {
        return db.Person.load(person.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        person.name = "New Name";
        return person.update();
      })).be.rejected;
    });

    it('should allowed to forcibly update outdated object', function() {
      var person = new db2.Person();

      return person.save().then(function() {
        return db.Person.load(person.id);
      }).then(function(person2) {
        person2.name = "Foo Bar";
        return person2.save();
      }).then(function() {
        person.name = "New Name";
        return person.update({force: true});
      }).then(function() {
        return db.Person.load(person.id);
      }).then(function(loaded) {
        expect(loaded.name).equals("New Name");
        expect(loaded.version).equals(3);
      });
    });

    it('should not be allowed to insert document by update', function() {
      expect(function() {
        new db.Person().update()
      }).throw(Error);
    });
  });

  describe("insert", function() {

    it('should insert object', function() {
      var person = new db.Person();
      person.name = "Peter Insert";
      return person.insert().then(function() {
        return expect(db.Person.load(person.id)).become(person);
      });
    });

    it('should insert and refresh object', function() {
      var person = new db.Person();
      person.name = "Peter Insert";
      var promise = expect(person.insert({refresh: true})).eventually.have.property('name', 'Peter Insert');
      person.name = "New Peter Insert";
      return promise;
    });

    it('should not be allowed to insert loaded object', function() {
      var person = new db.Person();
      person.name = "Peter Insert";
      return person.insert().then(function() {
        return db.Person.load(person.id);
      }).then(function(loaded) {
        loaded.name = "Peter Inserted";
        expect(function() {
          loaded.insert()
        }).throw(Error);
      });
    });

    it('should not be allowed to insert existing object', function() {
      var person = new db2.Person();

      return person.save().then(function(saved) {
        var newPerson = new db.Person();
        newPerson.name = "Blub";
        newPerson.id = saved.id;
        return expect(newPerson.insert()).rejected;
      });
    });

  });

  describe('load', function() {

    it('should load modified object', function() {
      var person = new db.Person();
      person.name = "Old Name";
      return person.save().then(function() {
        return db2.Person.load(person.id);
      }).then(function(loaded) {
        loaded.name = "New Name";
        return loaded.save();
      }).then(function() {
        return db.refreshBloomFilter();
      }).then(function() {
        expect(person).have.property('name', 'Old Name');
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'New Name');
      });
    });

    it('should load and refresh object with same version', function() {
      var person = new db.Person();
      person.name = "Old Name";
      return person.save(function() {
        return db2.Person.load(person.id, {refresh: true});
      }).then(function(loaded) {
        loaded.name = "New Name";
        return loaded.save();
      }).then(function() {
        person._metadata.version = 2;
        expect(person).have.property('name', 'Old Name');
        return expect(db.Person.load(person.id, {refresh: true})).eventually.have.property('name', 'New Name');
      }).then(function() {
        return expect(person.load({refresh: true})).eventually.have.property('name', 'New Name');
      });
    });

    it('should not find deleted object', function() {
      var person = new db.Person();
      person.name = "Old Name";

      return person.save().then(function(obj) {
        return obj.delete();
      }).then(function() {
        return db.Person.load(person.id);
      }).then(function(obj) {
        return expect(obj).be.null;
      });
    });

    it('should should clear deleted object locally', function() {
      var person = new db.Person();
      person.name = "Old Name";

      return person.save().then(function(obj) {
        return obj.delete();
      }).then(function() {
        return person.load();
      }).then(function(obj) {
        return expect(obj).be.null;
      });
    });

    it('should load object when deleted', function() {
      var person = new db.Person();
      person.name = "Old Name";

      return person.save().then(function(obj) {
        return db2.Person.load(person.id);
      }).then(function(loaded) {
        return loaded.delete();
      }).then(function(obj) {
        return db.refreshBloomFilter();
      }).then(function() {
        return db.Person.load(person.id);
      }).then(function(obj) {
        return expect(obj).be.null;
      });
    });
  });

  describe('client caching', function() {

    // no client caching in node
    if (helper.isNode || !DB.util.atob) {
      it('should disable bloomfilter in node', function() {
        var em = emf.createEntityManager();
        expect(em.isCachingDisabled).be.true;
      });

      return;
    }

    //no client caching in phantom
    if (helper.isPhantomJS) {
      return;
    }

    before(function() {
      return emf.createEntityManager().code.saveCode('updatePerson', 'module', function(module, exports) {
        exports.call = function(db, data) {
          var objId = data.id;
          var newValue = data.value;
          return db.Person.load(objId).then(function(person) {
            person.name = newValue;
            return person.save();
          });
        }
      });
    });

    it('should refresh', function() {
      var person = new db.Person();
      person.name = "Old Name";
      return person.save(function() {
      }).then(function() {
        return db.Person.load(person.id);
      }).then(function() {
        return db.modules.post('updatePerson', {id: person.id, value: 'New Name'});
      }).then(function() {
        return db.refreshBloomFilter();
      }).then(function() {
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'New Name');
      });
    });

    it('should automatically refresh bloom filter', function() {
      var person = new db.Person();
      person.name = "Old Name";
      db.bloomFilterRefresh = 1;
      var oldBFDate = db.bloomFilter.creation;
      return person.save(function() {
      }).then(function() {
        expect(db.bloomFilter.contains(person.id)).not.be.true;
        return db.Person.load(person.id);
      }).then(function() {
        return db.modules.post('updatePerson', {id: person.id, value: 'New Name'});
      }).then(function() {
        return helper.sleep(1000);
      }).then(function() {
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'New Name');
      }).then(function() {
        db.bloomFilterRefresh = 60;
        return helper.sleep(200);
      }).then(function() {
        expect(db.bloomFilter.creation).not.equals(oldBFDate);
        expect(db.bloomFilter.contains(person.id)).be.true;
      });
    });

    it('should disable cache during bloom filter refresh', function() {
      var person = new db.Person();
      person.name = "Old Name";
      db.bloomFilterRefresh = 1;
      var oldBFDate = db.bloomFilter.creation;
      return person.save(function() {
      }).then(function() {
        return db.Person.load(person.id);
      }).then(function() {
        return db.modules.post('updatePerson', {id: person.id, value: 'New Name'});
      }).then(function() {
        return helper.sleep(1500);
      }).then(function() {
        expect(db.bloomFilter.creation).equals(oldBFDate);
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'New Name');
      }).then(function() {
        db.bloomFilterRefresh = 60;
      });
    });

    it('should use browser cache', function() {
      var person = new db.Person();
      person.name = "Old Name";
      return db.refreshBloomFilter().then(function() {
        return person.save();
      }).then(function() {
        return db.Person.load(person.id);
      }).then(function() {
        return db.modules.post('updatePerson', {id: person.id, value: 'New Name'});
      }).then(function() {
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'Old Name');
      });
    });

    it('should use cache white listing', function() {
      var person = new db.Person();
      person.name = "Old Name";
      return db.refreshBloomFilter().then(function() {
        return person.save();
      }).then(function() {
        return db.Person.load(person.id);
      }).then(function() {
        return db.modules.post('updatePerson', {id: person.id, value: 'New Name'});
      }).then(function() {
        return db.refreshBloomFilter();
      }).then(function() {
        // BloomFilter forces revalidation.
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'New Name');
      }).then(function() {
        return db.modules.post('updatePerson', {id: person.id, value: 'Very New Name'});
      }).then(function() {
        // Now the object must be on the cache white list
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'New Name');
      });
    });

    it('should use cache black listing', function() {
      var person = new db.Person();
      person.name = "Old Name";
      return db.refreshBloomFilter().then(function() {
        return person.save();
      }).then(function() {
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'Old Name');
      }).then(function() {
        return db.Person.load(person.id);
      }).then(function(loaded) {
        loaded.name = "New Name";
        // adds the obj to the blacklist.
        return loaded.save();
      }).then(function() {
        // updates the object again
        return db.modules.post('updatePerson', {id: person.id, value: 'Very New Name'});
      }).then(function() {
        // loads the obj from sever and removes it from the blacklist.
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'Very New Name');
      }).then(function() {
        return db.modules.post('updatePerson', {id: person.id, value: 'Extremely New Name'});
      }).then(function() {
        // Now the object must be loaded from cache again
        return expect(db.Person.load(person.id)).eventually.have.property('name', 'Very New Name');
      });
    });
  });

  describe('depth', function() {

    var child, father, mother, sister, street, address, sibs;

    beforeEach(function() {
      child = new db.Child();
      father = new db.Person();
      mother = new db.Person();
      sister = new db.Person();
      street = new db.Street();
      address = new db.Address();
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
      for (var i = 0; i < 6; i++) {
        var sib = new db.Person();
        sib.name = "sib" + i;
        sibs.child = child;
        sibs.sister = mother;
        sibs.address = address;
        sibs.push(sib);
      }
      child.listSiblings.push(sibs[0]);
      child.listSiblings.push(sibs[1]);
      child.setSiblings.add(sibs[2]);
      child.setSiblings.add(sibs[3]);
      child.mapSiblings.set(sibs[4], sibs[5]);
    });

    it('should save and convert result to JSON', function() {
      return child.save({depth: true}).then(function(saved) {
        var json = saved.toJSON();
        expect(json.aunt).eqls(mother.id);
        expect(json.name).eqls(child.name);
      });
    });

    it('should save and delete referenced objects by depth', function() {
      return child.save({depth: 2}).then(function() {
        var promises = [
          expect(db.Child.load(child.id)).not.become(null),
          expect(db.Person.load(mother.id)).not.become(null),
          expect(db.Person.load(father.id)).not.become(null),
          expect(db.Street.load(street.id)).not.become(null),
          expect(db.Person.load(sister.id)).not.become(null)
        ];
        sibs.forEach(function(sib) {
          promises.push(expect(db.Person.load(sib.id)).not.become(null))
        });
        return Promise.all(promises);
      }).then(function() {
        return child.delete({depth: 2});
      }).then(function(deleted) {
        expect(deleted).equals(child);
        var promises = [
          expect(db.Child.load(child.id)).become(null),
          expect(db.Person.load(mother.id)).become(null),
          expect(db.Person.load(father.id)).become(null),
          expect(db.Street.load(street.id)).become(null),
          expect(db.Person.load(sister.id)).become(null)
        ];
        sibs.forEach(function(sib) {
          promises.push(expect(db.Person.load(sib.id)).become(null))
        });
        return Promise.all(promises);
      });
    });

    it('should save and delete referenced objects by reachability', function() {
      return child.save({depth: true}).then(function() {
        var promises = [
          expect(db.Child.load(child.id)).not.become(null),
          expect(db.Person.load(mother.id)).not.become(null),
          expect(db.Person.load(father.id)).not.become(null),
          expect(db.Street.load(street.id)).not.become(null),
          expect(db.Person.load(sister.id)).not.become(null)
        ];
        sibs.forEach(function(sib) {
          promises.push(expect(db.Person.load(sib.id)).not.become(null))
        });
        return Promise.all(promises);
      }).then(function() {
        return child.delete({depth: true});
      }).then(function(deleted) {
        expect(deleted).equals(child);
        var promises = [
          expect(db.Child.load(child.id)).become(null),
          expect(db.Person.load(mother.id)).become(null),
          expect(db.Person.load(father.id)).become(null),
          expect(db.Street.load(street.id)).become(null),
          expect(db.Person.load(sister.id)).become(null)
        ];
        sibs.forEach(function(sib) {
          promises.push(expect(db.Person.load(sib.id)).become(null))
        });
        return Promise.all(promises);
      });
    });

    it('should get referenced objects by depth', function() {
      return child.save({depth: true}).then(function(saved) {
        child = saved;
        sibs.forEach(function(sib) {
          expect(db2.containsById(sib)).be.false;
        });
        expect(db2.containsById(father)).be.false;
        expect(db2.containsById(sister)).be.false;
        expect(db2.containsById(mother)).be.false;
        expect(db2.containsById(street)).be.false;
        return db2.Child.load(child.id, {depth: 2});
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
      return child.save({depth: true}).then(function(saved) {
        child = saved;
        expect(db2.containsById(father)).be.false;
        expect(db2.containsById(sister)).be.false;
        expect(db2.containsById(mother)).be.false;
        expect(db2.containsById(street)).be.false;
        return db2.Child.load(child.id, {depth: true});
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
      return child.save({depth: true}).then(function(saved) {
        child = saved;
        return db2.Child.load(child.id, {depth: 1});
      }).then(function(loaded) {
        expect(loaded.father.sister._metadata.isAvailable).be.false;
        expect(loaded.father._metadata.isAvailable).be.true;
        expect(loaded.mother._metadata.isAvailable).be.true;
        expect(loaded.address.street._metadata.isAvailable).be.true;
      });
    });

    it('should load all referenced objects by reachability', function() {
      return child.save({depth: true}).then(function(saved) {
        var promise = saved.load({depth: true, refresh: true});
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("Schwester Meier");
        expect(loaded.father.name).equals("Franz Meier");
      });
    });

    it('should load all referenced objects by depth', function() {
      return child.save({depth: 2}).then(function(saved) {
        var promise = saved.load({depth: true, refresh: true});
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("Schwester Meier");
        expect(loaded.father.name).equals("Franz Meier");
      });
    });

    it('should not load all referenced objects', function() {
      return child.save({depth: true}).then(function(saved) {
        var promise = saved.load({depth: 1, refresh: true});
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("Franz Meier");
      });
    });

    it('should insert referenced objects by depth', function() {
      return child.insert({depth: 2}).then(function() {
        return Promise.all([
          expect(db.Child.load(child.id)).not.become(null),
          expect(db.Person.load(mother.id)).not.become(null),
          expect(db.Person.load(father.id)).not.become(null),
          expect(db.Street.load(street.id)).not.become(null),
          expect(db.Person.load(sister.id)).not.become(null)
        ]);
      });
    });

    it('should insert referenced objects by reachability', function() {
      return child.insert({depth: true}).then(function() {
        return Promise.all([
          expect(db.Child.load(child.id)).not.become(null),
          expect(db.Person.load(mother.id)).not.become(null),
          expect(db.Person.load(father.id)).not.become(null),
          expect(db.Street.load(street.id)).not.become(null),
          expect(db.Person.load(sister.id)).not.become(null)
        ]);
      });
    });

    it('should update all referenced objects by depth', function() {
      return child.save({depth: true}).then(function(saved) {
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return saved.update({force: true, depth: 2});
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("New Name");
      });
    });

    it('should update all referenced objects by reachability', function() {
      return child.save({depth: true}).then(function(saved) {
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        return saved.update({force: true, depth: true});
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("New Name");
      });
    });

    it('should update and refresh all referenced objects by reachability', function() {
      return child.save({depth: true}).then(function(saved) {
        saved.father.sister.name = "New Name";
        saved.father.name = "New Name";
        var promise = saved.update({refresh: true, force: true, depth: true});
        saved.father.sister.name = "Newer Name";
        saved.father.name = "Newer Name";
        return promise;
      }).then(function(loaded) {
        expect(loaded.father.sister.name).equals("New Name");
        expect(loaded.father.name).equals("New Name");
      });
    });

    it('should load entity by query single result and resolve depth', function() {
      child.name = helper.randomize("queryDepth");
      return child.save({depth: true}).then(function(saved) {
        child = saved;
        expect(db2.containsById(father)).be.false;
        expect(db2.containsById(sister)).be.false;
        expect(db2.containsById(mother)).be.false;
        expect(db2.containsById(street)).be.false;
        return db2.Child.find().equal("name", child.name).singleResult({depth: true});
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

    it('should load entity by query result list and resolve depth', function() {
      child.name = helper.randomize("queryDepth");
      return child.save({depth: true}).then(function(saved) {
        child = saved;
        expect(db2.containsById(father)).be.false;
        expect(db2.containsById(sister)).be.false;
        expect(db2.containsById(mother)).be.false;
        expect(db2.containsById(street)).be.false;
        return db2.Child.find().equal("name", child.name).resultList({depth: true});
      }).then(function(loaded) {
        loaded = loaded[0];
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
  });

  describe('custom ids', function() {
    var myId, myKey;

    beforeEach(function() {
      myKey = helper.randomize('a/db/bucket/?param=3\\ed&g=1');
      var person = new db.Person();
      person.key = myKey;
      myId = person.id;
    });

    afterEach(function() {
      return db.Person.load(myId).then(function(obj) {
        if (obj)
          return obj.delete();
      });
    });

    it('should handle key as ids', function() {
      var person = new db.Person();
      person.id = myKey;
      expect(person.id).equal('/db/Person/' + encodeURIComponent(myKey));
      expect(person.key).equal(myKey);
    });

    it('should handle ids as ids', function() {
      var person = new db.Person();
      person.id = '/db/Person/' + encodeURIComponent(myKey);
      expect(person.id).equal('/db/Person/' + encodeURIComponent(myKey));
      expect(person.key).equal(myKey);
    });

    it('should create and load new object', function() {
      var person = new db.Person();
      person.id = myId;
      person.name = "Custom Person";

      return person.save(function(result) {
        expect(person.id).equals(myId);
        expect(person.key).equals(myKey);
        expect(person.name).equals("Custom Person");
        expect(person).equals(result);
        return db.Person.load(myKey);
      }).then(function(person) {
        expect(person.id).equals(myId);
        expect(person.key).equals(myKey);
        expect(person.name).equals("Custom Person");
        return db2.Person.load(myId);
      }).then(function(person) {
        expect(person.id).equals(myId);
        expect(person.name).equals("Custom Person");
      });
    });

    it('should be useable as references', function() {
      var person = new db.Person();
      person.id = myId;
      var id = person.id;
      person.name = "Custom Person";

      person.child = new db.Person();
      person.child.name = "Custom Child Person";
      person.child.key = helper.randomize('my/craßy*%unescap\\ed&id?=');
      var childId = person.child.id;

      return person.save({refresh: true, depth: true}, function(result) {
        expect(person.id).equals(myId);
        expect(person.name).equals("Custom Person");
        expect(person.child.id).equals(childId);
        expect(person.child.name).equals("Custom Child Person");
        return db2.Person.load(childId).then(function(child) {
          expect(child.id).equals(childId);
          expect(child.name).equals("Custom Child Person");
          return db2.Person.load(myId);
        }).then(function(person) {
          expect(person.id).equals(myId);
          expect(person.name).equals("Custom Person");
          expect(person.child.id).equals(childId);
          expect(person.child.name).equals("Custom Child Person");
          return db2.Person.load(childId);
        }).then(function(child) {
          return child.delete();
        });
      }).then(function() {
        return db.refreshBloomFilter();
      }).then(function() {
        return db.Person.load(person.child.id);
      }).then(function(obj) {
        expect(obj).be.null;
      });
    })
  });
});