'use strict';

var DB;
if (typeof module !== 'undefined') {
  require('./node');
  DB = require('../');
}

describe('Test Acl', function () {
  var db, emf;
  before(function () {
    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage });
    return emf.ready().then(function () {
      var metamodel = emf.metamodel;
      if (!metamodel.managedType('AclPerson')) {
        var AclPerson = new DB.metamodel.EntityType('AclPerson', metamodel.entity(Object));
        AclPerson.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
        AclPerson.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType(Number)));
        metamodel.addType(AclPerson);
        return metamodel.save();
      }
    }).then(function () {
      return createUserDb().then(function (em) {
        db = em;
      });
    });
  });

  after(function () {
    var user = db.User.me;
    if (user) { return user.delete(); }
  });

  function createUserDb() {
    var em = emf.createEntityManager();
    return em.User.register(helper.makeLogin(), 'secret').then(function () {
      return em;
    });
  }

  describe('Object', function () {
    it('should be created with an empty rule set', function () {
      var acl = (new db.AclPerson()).acl;

      expect(acl.isPublicReadAllowed()).be.true;
      expect(acl.isPublicWriteAllowed()).be.true;
      expect(acl.isReadAllowed(db.User.me)).be.false;
      expect(acl.isWriteAllowed(db.User.me)).be.false;
      expect(acl.isReadDenied(db.User.me)).be.false;
      expect(acl.isWriteDenied(db.User.me)).be.false;
    });

    it('should return all refs', function () {
      var acl = new db.AclPerson().acl
        .allowReadAccess(db.User.me)
        .denyWriteAccess(db.User.me);

      expect(acl.read.allRules()).eql([db.User.me.id]);
      expect(acl.write.allRules()).eql([db.User.me.id]);
    });

    it('should return the actual rule', function () {
      var acl = new db.AclPerson().acl
        .allowReadAccess(db.User.me)
        .denyWriteAccess(db.User.me);

      expect(acl.read.getRule(db.User.me)).eql('allow');
      expect(acl.write.getRule(db.User.me)).eql('deny');

      acl.denyReadAccess(db.User.me);
      acl.deleteWriteAccess(db.User.me);

      expect(acl.read.getRule(db.User.me)).eql('deny');
      expect(acl.write.getRule(db.User.me)).be.undefined;
    });

    it('deny rule should remove allow rule', function () {
      var acl = new db.AclPerson().acl;

      acl.allowReadAccess(db.User.me);
      acl.denyReadAccess(db.User.me);

      expect(acl.isReadAllowed(db.User.me)).be.false;
      expect(acl.isReadDenied(db.User.me)).be.true;
    });

    it('allow rule should remove deny rule', function () {
      var acl = new db.AclPerson().acl;

      acl.denyReadAccess(db.User.me);
      acl.allowReadAccess(db.User.me);

      expect(acl.isReadAllowed(db.User.me)).be.true;
      expect(acl.isReadDenied(db.User.me)).be.false;
    });

    it('deny rule should be removable', function () {
      var acl = new db.AclPerson().acl;

      acl.denyReadAccess(db.User.me);
      acl.deleteReadAccess(db.User.me);

      expect(acl.isReadDenied(db.User.me)).be.false;
      expect(acl.isReadAllowed(db.User.me)).be.false;
    });

    it('allow rule should be removable', function () {
      var acl = new db.AclPerson().acl;

      acl.allowReadAccess(db.User.me);
      acl.deleteReadAccess(db.User.me);

      expect(acl.isReadDenied(db.User.me)).be.false;
      expect(acl.isReadAllowed(db.User.me)).be.false;
    });

    it('clear should remove all rules', function () {
      var acl = new db.AclPerson().acl;

      acl.allowReadAccess(db.User.me);
      acl.denyWriteAccess(db.User.me);
      acl.clear();

      expect(acl.isPublicReadAllowed()).be.true;
      expect(acl.isPublicWriteAllowed()).be.true;
      expect(acl.isReadAllowed(db.User.me)).be.false;
      expect(acl.isWriteDenied(db.User.me)).be.false;
    });

    it('should be modifiable', function () {
      var role = new db.Role();
      role.name = 'AclRole';
      return role.save().then(function () {
        var acl = new db.AclPerson().acl
          .allowReadAccess(db.User.me)
          .denyReadAccess(role)
          .denyWriteAccess(db.User.me);

        expect(acl.isPublicReadAllowed()).be.false;
        expect(acl.isPublicWriteAllowed()).be.true;

        expect(acl.isReadAllowed(db.User.me)).be.true;
        expect(acl.isWriteAllowed(db.User.me)).be.false;
        expect(acl.isReadDenied(db.User.me)).be.false;
        expect(acl.isWriteDenied(db.User.me)).be.true;

        expect(acl.isReadAllowed(role)).be.false;
        expect(acl.isWriteAllowed(role)).be.false;
        expect(acl.isReadDenied(role)).be.true;
        expect(acl.isWriteDenied(role)).be.false;
      });
    });

    it('modification should mark the object as dirty', function () {
      var person = new db.AclPerson();
      var acl = person.acl;

      person._metadata.setPersistent();
      acl.allowReadAccess(db.User.me);
      expect(person._metadata.isDirty).be.true;

      person._metadata.setPersistent();
      acl.denyReadAccess(db.User.me);
      expect(person._metadata.isDirty).be.true;

      person._metadata.setPersistent();
      acl.deleteReadAccess(db.User.me);
      expect(person._metadata.isDirty).be.true;

      person._metadata.setPersistent();
      acl.allowWriteAccess(db.User.me);
      expect(person._metadata.isDirty).be.true;

      person._metadata.setPersistent();
      acl.denyWriteAccess(db.User.me);
      expect(person._metadata.isDirty).be.true;

      person._metadata.setPersistent();
      acl.deleteWriteAccess(db.User.me);
      expect(person._metadata.isDirty).be.true;

      person._metadata.setPersistent();
      acl.clear();
      expect(person._metadata.isDirty).be.true;
    });


    it('should be copyable', function () {
      var acl1 = (new db.AclPerson()).acl;
      var acl2 = (new db.AclPerson()).acl;

      acl1.read.denyAccess(db.User.me);
      acl2.read.allowAccess(db.User.me);
      acl1.write.denyAccess(db.User.me);
      acl2.write.allowAccess(db.User.me);

      acl1.read._metadata.setPersistent();
      acl1.write._metadata.setPersistent();
      acl2.read._metadata.setPersistent();
      acl2.write._metadata.setPersistent();

      expect(acl1.read._metadata.isDirty).be.false;
      expect(acl1.write._metadata.isDirty).be.false;
      expect(acl2.read._metadata.isDirty).be.false;
      expect(acl2.write._metadata.isDirty).be.false;
      expect(acl1.isReadAllowed(db.User.me)).to.be.false;
      expect(acl1.isWriteAllowed(db.User.me)).to.be.false;
      expect(acl2.isReadAllowed(db.User.me)).to.be.true;
      expect(acl2.isWriteAllowed(db.User.me)).to.be.true;

      expect(acl1.copy(acl2)).to.equal(acl1);

      expect(acl1.read._metadata.isDirty).be.true;
      expect(acl1.write._metadata.isDirty).be.true;
      expect(acl2.read._metadata.isDirty).be.false;
      expect(acl2.write._metadata.isDirty).be.false;
      expect(acl1.isReadAllowed(db.User.me)).to.be.true;
      expect(acl1.isWriteAllowed(db.User.me)).to.be.true;
      expect(acl2.isReadAllowed(db.User.me)).to.be.true;
      expect(acl2.isWriteAllowed(db.User.me)).to.be.true;
    });
  });

  describe('save and load', function () {
    it('an empty set', function () {
      var person = new db.AclPerson();
      var acl = person.acl;

      return person.save({ refresh: true }).then(function () {
        expect(person.acl.read.allRules().length).equals(0);
        expect(person.acl.write.allRules().length).equals(0);
      });
    });

    it('a read set', function () {
      var person = new db.AclPerson();
      var acl = person.acl;
      acl.allowReadAccess(db.User.me);

      return person.save({ refresh: true }).then(function () {
        expect(person.acl.isReadAllowed(db.User.me)).be.true;
        expect(person.acl.isWriteAllowed(db.User.me)).be.false;
      });
    });

    it('a write set', function () {
      var person = new db.AclPerson();
      var acl = person.acl;
      acl.allowWriteAccess(db.User.me);

      return person.save({ refresh: true }).then(function () {
        expect(person.acl.isReadAllowed(db.User.me)).be.false;
        expect(person.acl.isWriteAllowed(db.User.me)).be.true;
      });
    });

    it('a write set', function () {
      var person = new db.AclPerson();
      var acl = person.acl;
      acl.allowReadAccess(db.User.me);
      acl.allowWriteAccess(db.User.me);

      return person.save({ refresh: true }).then(function () {
        expect(person.acl.isReadAllowed(db.User.me)).be.true;
        expect(person.acl.isWriteAllowed(db.User.me)).be.true;
      });
    });
  });

  describe('protected Object operations', function () {
    var db2, db3, role23, role13;
    before(function () {
      return Promise.all([createUserDb(), createUserDb()]).then(function (arr) {
        db2 = arr[0];
        db3 = arr[1];

        role23 = new db.Role();
        role23.name = 'Role2_3';
        role23.addUser(db.getReference(db2.me.id));
        role23.addUser(db.getReference(db3.me.id));
        var promise1 = role23.save();

        role13 = new db.Role();
        role13.name = 'Role1_3';
        role13.addUser(db.User.me);
        role13.addUser(db.getReference(db3.me.id));
        var promise2 = role13.save();

        return Promise.all([promise1, promise2]);
      }).then(function () {
        return Promise.all([
          db.renew(),
          db2.renew(),
          db3.renew(),
        ]);
      });
    });

    after(function () {
      return Promise.all([
        db2.User.me.delete(),
        db3.User.me.delete(),
      ]);
    });

    it('should allow read access by user', function () {
      var obj = new db.AclPerson();
      obj.acl.allowReadAccess(db.User.me)
        .allowReadAccess(db2.User.me);

      var id;
      return obj.save().then(function (o) {
        id = obj.id;
        return db.AclPerson.load(id);
      }).then(function (obj) {
        // use refresh to bypass the cache for the same object
        return Promise.all([
          expect(db.AclPerson.load(id, { refresh: true })).eventually.property('id', id),
          expect(db2.AclPerson.load(id, { refresh: true })).eventually.property('id', id),
          expect(db3.AclPerson.load(id, { refresh: true })).eventually.be.null,
        ]);
      });
    });

    it('should deny read access by user', function () {
      var obj = new db.AclPerson();
      obj.acl.denyReadAccess(db2.User.me);

      var id;
      return obj.save().then(function () {
        id = obj.id;
        return Promise.all([
          expect(db.AclPerson.load(id, { refresh: true })).eventually.property('id', id),
          expect(db2.AclPerson.load(id, { refresh: true })).eventually.be.null,
          expect(db3.AclPerson.load(id, { refresh: true })).eventually.property('id', id),
        ]);
      });
    });

    it('should allow read access by group', function () {
      var obj = new db.AclPerson();
      obj.acl.allowReadAccess(role13);

      var id;
      return obj.save().then(function () {
        id = obj.id;
        return Promise.all([
          expect(db.AclPerson.load(id, { refresh: true })).eventually.property('id', id),
          expect(db2.AclPerson.load(id, { refresh: true })).eventually.be.null,
          expect(db3.AclPerson.load(id, { refresh: true })).eventually.property('id', id),
        ]);
      });
    });

    it('should deny read access by group', function () {
      var obj = new db.AclPerson();
      obj.acl.denyReadAccess(role23);

      var id;
      return obj.save().then(function () {
        id = obj.id;
        return Promise.all([
          expect(db.AclPerson.load(id, { refresh: true })).eventually.property('id', id),
          expect(db2.AclPerson.load(id, { refresh: true })).eventually.be.null,
          expect(db3.AclPerson.load(id, { refresh: true })).eventually.be.null,
        ]);
      });
    });
  });
});
