if (typeof jspa == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  expect = chai.expect;
  jspa = require('../lib');
}

var PersClassEntity = new jspa.metamodel.EntityType("/db/test.persistent.PersClass");
var ChildPersClassEntity = new jspa.metamodel.EntityType("/db/test.persistent.ChildPersClass", PersClassEntity);
var OtherPersClassEntity = new jspa.metamodel.EntityType("/db/test.persistent.OtherPersClass");

PersClassEntity.declaredAttributes = [
  new jspa.metamodel.SingularAttribute(PersClassEntity, "ref", OtherPersClassEntity),
  new jspa.metamodel.SingularAttribute(PersClassEntity, "name", jspa.metamodel.BasicType.Integer),
  new jspa.metamodel.SingularAttribute(PersClassEntity, "persRef", PersClassEntity)
];

ChildPersClassEntity.declaredAttributes = [
  new jspa.metamodel.SingularAttribute(ChildPersClassEntity, "value", jspa.metamodel.BasicType.String)
];

OtherPersClassEntity.declaredAttributes = [
  new jspa.metamodel.SingularAttribute(ChildPersClassEntity, "value", jspa.metamodel.BasicType.Integer)
];


var test = {
  persistent: {}
};

var PersClass = test.persistent.PersClass = Object.inherit({
  initialize: function (ref, name, persRef) {
    this.ref = ref;
    this.name = name;
    this.persRef = persRef;
  }
});

var ChildPersClass = test.persistent.ChildPersClass = test.persistent.PersClass.inherit({
  initialize: function (ref, name, persRef, value) {
    this.superCall(ref, name, persRef);

    this.value = value;
  }
});

var OtherPersClass = test.persistent.OtherPersClass = Object.inherit({
  initialize: function (value) {
    this.value = value;
  }
});

/* describe("Simple test", function () {
  this.timeout(2000);

  var factory;

  var pu = null, em = null;
  beforeEach(function () {
    factory = new jspa.EntityManagerFactory('http://localhost:8080');
    em = factory.createEntityManager();
    pu = factory.persistenceUnitUtil;
  });

  it("should run", function (done) {
    var suc = false;

    var id;
    em.yield().done(function () {
      var ref = new PersClass(null, 202, null);
      var p1 = new PersClass(null, 101, ref);

      em.persist(p1, function () {
        return em.flush(function () {
          id = pu.getIdentifier(p1);
          expect(id).toBeDefined();

          return em.refresh(p1, function () {
            expect(ref).toBe(p1.persRef);
            p1.name = 303;

            return em.flush(function () {
              expect(p1.name).toBe(303);
            });
          });
        });
      });
    });

    em.clear();

    em.transaction.begin(function () {
      em.find(PersClass, id, function (obj) {
        expect(obj.name).toBe(303);
        em.refresh(obj, function () {
          expect(obj.name).toBe(303);
        });
      });
      em.transaction.commit().fail(function (e) {
        console.log(e);
      });
    });

    em.transaction.begin(function () {
      var ref = new PersClass(null, 202, null);
      var p1 = new PersClass(null, 101, ref);

      em.persist(p1);
      em.flush();

      em.refresh(p1, function () {
        expect(ref).toBe(p1.persRef);
        id = pu.getIdentifier(p1);
        expect(id).toBeDefined();
      });
    });
    em.transaction.commit();

    em.clear();

    em.yield(function () {
      em.find(PersClass, id).then(function (obj) {
        expect(obj.name).toBe(101);

        if (!pu.isLoaded(obj, 'persRef')) {
          return em.refresh(obj.persRef, function () {
            var ref = obj.persRef;
            expect(ref.name).toBe(202);

            ref.name = 'buh';
          });
        } else {
          var ref = obj.persRef;
          expect(ref.name).toBe(202);

          ref.name = 'buh';
        }
      }).then(function () {
        em.flush();
      });
    });

    em.yield(function () {
      var query = em.createQuery(null, PersClass);
      query.maxResults = 3;
      query.getResultList(function (result) {
        expect(result.length).toBe(3);
        for (var i = 0, pers; pers = result[i]; ++i) {
          expect(pers.ref).toBeNull();
        }
      });
    });

    em.yield(function () {
      var cls = new PersClass(null, 100, null);

      em.persist(cls);
      em.flush(function () {
        id = pu.getIdentifier(cls);
        em.detach(cls);
        em.find(PersClass, id, function (entity) {
          expect(cls).not.toBe(entity);
          cls.name = 200;
          em.merge(cls, function (merged) {
            expect(merged).toBe(entity);
            expect(merged.name).toBe(200);
            em.flush();
          });
        });
      });
    });

    em.yield(function () {
      var query = em.createQuery(null, PersClass);
      return query.getResultList(function (result) {
        for (var i = 0, pers; pers = result[i]; ++i) {
          em.remove(pers);
        }
        return em.flush();
      });
    }).done(function () {
      suc = true;
    }).always(function () {
      expect(suc).toBeTruthy();
      done();
    });
  });
});     */
