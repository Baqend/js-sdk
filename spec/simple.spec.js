if (typeof jspa == 'undefined') {
  expect = require('chai').expect;
  jspa = require('../lib');
}

(function (global) {
  var schema = [
    {
      "class": "/db/test.persistent.PersClass",
      "fields": [
        {
          "name": "ref",
          "type": "/db/test.persistent.OtherPersClass"
        },
        {
          "name": "name",
          "type": "/db/_native.Integer"
        },
        {
          "name": "persRef",
          "type": "/db/test.persistent.PersClass"
        }
      ]
    },
    {
      "class": "/db/test.persistent.ChildPersClass",
      "superClass": "/db/test.persistent.PersClass",
      "fields": [
        {
          "name": "value",
          "type": "/db/_native.String"
        }
      ]
    },
    {
      "class": "/db/test.persistent.OtherPersClass",
      "fields": [
        {
          "name": "value",
          "type": "/db/_native.Integer"
        }
      ]
    }
  ];


  global.test = global.test || {};

  Object.extend(global.test, {
    persistent: {}
  });

  var PersClass = global.test.persistent.PersClass = Object.inherit({
    initialize: function (ref, name, persRef) {
      this.ref = ref;
      this.name = name;
      this.persRef = persRef;
    }
  });

  var ChildPersClass = global.test.persistent.ChildPersClass = test.persistent.PersClass.inherit({
    initialize: function (ref, name, persRef, value) {
      this.superCall(ref, name, persRef);

      this.value = value;
    }
  });

  var OtherPersClass = global.test.persistent.OtherPersClass = Object.inherit({
    initialize: function (value) {
      this.value = value;
    }
  });

  describe("Simple test", function () {
    var factory = new jspa.EntityManagerFactory('http://localhost:8080');
    factory.define(schema);

    var pu = null, em = null;
    beforeEach(function () {
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
  });
})(typeof global !== 'undefined' ? global : window);