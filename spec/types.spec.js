if (typeof jspa == 'undefined') {
  expect = require('chai').expect;
  jspa = require('../lib');
}

describe('Test GeoPoint', function() {
  it("should construct with an latitude and longitude argument", function() {
    var point = new jspa.GeoPoint(56.5, 165.2);

    expect(point.latitude).equals(56.5);
    expect(point.longitude).equals(165.2);
  });

  it("should construct with an array argument", function() {
    var point = new jspa.GeoPoint([-36.5, -92.3]);

    expect(point.latitude).equals(-36.5);
    expect(point.longitude).equals(-92.3);
  });

  it("should construct with an geolike object argument", function() {
    var point = new jspa.GeoPoint({"latitude": 90, "longitude": -180.0});

    expect(point.latitude).equals(90);
    expect(point.longitude).equals(-180.0);
  });

  it("should construct from json argument", function() {
    var point1 = new jspa.GeoPoint({"latitude": -90, "longitude": 180.0});
    var point2 = new jspa.GeoPoint(point1.toJSON());

    expect(point1).eql(point2);
  });

  it("should compute distance", function() {
    var point1 = new jspa.GeoPoint(53.5753, 10.0153); // Hamburg
    var point2 = new jspa.GeoPoint(40.7143, -74.006); // New York
    var point3 = new jspa.GeoPoint(-33.8679, 151.207); // Sydney
    var point4 = new jspa.GeoPoint(51.5085, -0.1257); // London

    expect(point1.kilometersTo(point2)).within(6147 * 0.97, 6147 * 1.03);
    expect(point1.milesTo(point2)).within(3819 * 0.97, 3819 * 1.03);
    expect(point3.kilometersTo(point4)).within(16989 * 0.97, 16989 * 1.03);
    expect(point3.milesTo(point4)).within(10556 * 0.97, 10556 * 1.03);
  });
});

describe('Test entity type', function () {
  var em, emf, EntityClass, EmbeddedClass, o1, o2, o3, data;

  emf = new jspa.EntityManagerFactory("http://localhost:8080");
  var metamodel = emf.metamodel;
  metamodel.fromJSON([]);

  var EntityType = new jspa.metamodel.EntityType('jstest.Type', metamodel.entity(Object));
  var EmbeddedType = new jspa.metamodel.EmbeddableType('jstest.Embedded');

  for (var i = 0, type; type = [EntityType, EmbeddedType][i]; ++i) {
    var attrs = type.declaredAttributes;
    attrs.push(new jspa.metamodel.SingularAttribute(type, "boolean", metamodel.baseType('Boolean')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "float", metamodel.baseType('Float')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "integer", metamodel.baseType('Integer')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "string", metamodel.baseType('String')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "time", metamodel.baseType('Time')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "date", metamodel.baseType('Date')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "dateTime", metamodel.baseType('DateTime')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "geoPoint", metamodel.baseType('GeoPoint')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "jsonArray", metamodel.baseType('JsonArray')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "jsonObject", metamodel.baseType('JsonObject')));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "ref", EntityType));
    attrs.push(new jspa.metamodel.SingularAttribute(type, "embedded", EmbeddedType));

    attrs.push(new jspa.metamodel.ListAttribute(type, "simpleList", metamodel.baseType('Float')));
    attrs.push(new jspa.metamodel.ListAttribute(type, "refList", EntityType));
    attrs.push(new jspa.metamodel.ListAttribute(type, "embeddedList", EmbeddedType));

    attrs.push(new jspa.metamodel.SetAttribute(type, "simpleSet", metamodel.baseType('String')));
    attrs.push(new jspa.metamodel.SetAttribute(type, "refSet", EntityType));

    attrs.push(new jspa.metamodel.MapAttribute(type, "simpleMap", metamodel.baseType('String'), metamodel.baseType('Boolean')));
    attrs.push(new jspa.metamodel.MapAttribute(type, "simpleRefMap", metamodel.baseType('String'), EntityType));
    attrs.push(new jspa.metamodel.MapAttribute(type, "refSimpleMap", EntityType, metamodel.baseType('String')));
    attrs.push(new jspa.metamodel.MapAttribute(type, "refMap", EntityType, EntityType));
    attrs.push(new jspa.metamodel.MapAttribute(type, "simpleEmbeddedMap", metamodel.baseType('String'), EmbeddedType));
  }

  metamodel.addType(EntityType);
  metamodel.addType(EmbeddedType);
  metamodel.save();

  beforeEach(function() {
    return emf.createEntityManager().done(function(entityManager) {
      em = entityManager;

      EntityClass = em['jstest.Type'];
      EmbeddedClass = em['jstest.Embedded'];
    });
  });

  function testObject() {
    var obj = new EntityType.typeConstructor();
    setValues(obj);
    return obj;
  }

  function embeddableObject() {
    var obj = new EmbeddedType.typeConstructor();
    setValues(obj);
    return obj;
  }

  function setValues(obj) {
    obj.boolean = true;
    obj.float = 1.1;
    obj.integer = 45;
    obj.string = "myString";
  }

  describe("boolean value", function() {
    test("boolean", false, true, ['test', true], [3, true], [{}, true], [[], true])
  });

  describe("float value", function() {
    test("float", 0.0, 42.42);
  });

  describe("integer value", function() {
    test("integer", 0, 42);
  });

  describe("string value", function() {
    test("string", "", "Test String", 'String', null);
  });

  describe("time value", function() {
    test("time", new Date(0), new Date("1970-01-01T17:33:14"));
  });

  describe("date value", function() {
    test("date", new Date(0), new Date("2013-11-22"), new Date("2013-11-22"), new Date("0000-01-01"));
  });

  describe("dateTime value", function() {
    test("dateTime", new Date(0), new Date(), new Date("0000-00-00T00:00:00"));
  });

  describe("geoPoint value", function() {
    test("geoPoint", new jspa.GeoPoint(), new jspa.GeoPoint(34.5658, 110.4576), new jspa.GeoPoint(-45.67, -177.45));
  });

  describe("jsonObject value", function() {
    test("jsonObject", {}, {"key": "value", "num": 1, "arr": [1,2,3]}, [[], null]);
  });

  describe("jsonArray value", function() {
    test("jsonArray", [[], []], [[1, "test", {"key": "value"}], [1, "test", {"key": "value"}]], [{}, null]);
  });

  describe("ref value", function() {
    test("ref", new EntityType.typeConstructor(), testObject(), [{}, null]);

    it("should convert references to ids", function() {
      var obj = EntityClass();
      var ref = testObject();

      obj.ref = ref;

      var state = jspa.util.State.get(obj);
      var json = state.getDatabaseObject();

      var refId = jspa.util.State.get(ref).getIdentifier();
      expect(refId).contain('/db/');
      expect(json.ref).equals(refId);

      state.setDatabaseObject(json);
      expect(obj.ref).equals(ref);
    });
  });

  describe("embedded value", function() {
    test("embedded", new EmbeddedType.typeConstructor(), embeddableObject(), [{}, null]);
  });

  describe("simpleList value", function() {
    test("simpleList", new jspa.List(), jspa.List([1.1, null, 2.2, 3.3]));
  });

  describe("refList value", function() {
    test("refList", new jspa.List(), jspa.List([o1, o2, null, o3]));
  });

  describe("embeddedList value", function() {
    test("embeddedList", new jspa.List(), jspa.List([embeddableObject(), embeddableObject(), null, embeddableObject()]));
  });

  describe("simpleSet value", function() {
    test("simpleSet", new jspa.Set(), jspa.Set(['Test', 'String', null, '123']));
  });

  describe("refSet value", function() {
    test("refSet", new jspa.Set(), jspa.Set([o1, null, o2, o3]));
  });

  describe("simpleMap value", function() {
    var map = jspa.Map([
      {key: "Test", value: true},
      {key: "String", value: false},
      {key: "123", value: null}
    ]);

    test("simpleMap", new jspa.Map(), map);
  });

  describe("simpleRefMap value", function() {
    var map = jspa.Map([
      {key: "Test", value: testObject()},
      {key: "String", value: testObject()},
      {key: "123", value: testObject()},
      {key: "null", value: null}
    ]);

    test("simpleRefMap", new jspa.Map(), map);
  });

  describe("refSimpleMap value", function() {
    var map = jspa.Map([
      {key: testObject(), value: true},
      {key: testObject(), value: false},
      {key: testObject(), value: null}
    ]);

    test("refSimpleMap", new jspa.Map(), map);
  });

  describe("refMap value", function() {
    var map = jspa.Map([
      {key: testObject(), value: testObject()},
      {key: testObject(), value: testObject()},
      {key: testObject(), value: null}
    ]);

    test("refMap", new jspa.Map(), map);
  });

  describe("simpleEmbeddedMap value", function() {
    var map = jspa.Map([
      {key: "Test", value: embeddableObject()},
      {key: "String", value: embeddableObject()},
      {key: "123", value: null}
    ]);

    test("simpleEmbeddedMap", new jspa.Map(), map);
  });

  function test(field) {
    it("should handle undefined properly", function() {
      var obj = EntityClass();
      obj[field] = undefined;

      var state = jspa.util.State.get(obj);
      var json = state.getDatabaseObject();

      state.setDatabaseObject(json);
      expect(obj[field]).null;
    });

    it("should handle null properly", function() {
      var obj = EntityClass();
      obj[field] = null;

      var state = jspa.util.State.get(obj);
      var json = state.getDatabaseObject();

      state.setDatabaseObject(json);
      expect(obj[field]).null;
    });

    Array.prototype.slice.call(arguments, 1).forEach(function(arg) {
      var value = Array.isInstance(arg)? arg[0]: arg;
      var expectedValue = Array.isInstance(arg)? arg[1]: arg;

      it(value + " should be converted to json and back", function() {
        var obj = EntityClass();
        obj[field] = value;

        var state = jspa.util.State.get(obj);
        var json = state.getDatabaseObject();

        state.setDatabaseObject(json);
        expect(obj[field]).eql(expectedValue);

        expect(state.getDatabaseObject()).eql(json);
      });
    });
  }
});

  /*beforeEach(function () {
    em = emf.createEntityManager();
  });

  it('should persist sample models', function (done) {
    var promise = em.yield();

    promise.always(function () {
      expect(o1._objectInfo.state.isPersistent).be.true;
      expect(o2._objectInfo.state.isPersistent).be.true;
      expect(o3._objectInfo.state.isPersistent).be.true;

      done();
    });
  });

  it('should init schemas', function (done) {
    em.yield(function () {
      for (var name in data) {
        var def = data[name];
        if (Number.isInstance(def[2])) {
          //collections
          for (var i = 3; i < def.length; ++i) {
            expect(em.metamodel.managedType(def[i])).not.equalNull();
          }
        } else {
          // entities
          expect(em.metamodel.managedType(def[2])).not.equalNull();
        }
      }

      done();
    });
  });

  Object.keys(data).forEach(function(name) {
    describe(" " + name, function() {
      var type, defaultValue, value, attr, constr, isCollection, collectionType, collectionTypes, valueType;

      defaultValue = data[name][0];
      value = data[name][1];
      isCollection = Number.isInstance(data[name][2]);

      beforeEach(function () {
        if (isCollection) {
          collectionType = data[name][2];
          collectionTypes = data[name].slice(3).map(em.metamodel.managedType.bind(em.metamodel));
        } else {
          valueType = em.metamodel.managedType(data[name][2]);
        }

        type = schema.entity('test.type.' + name);
        attr = type.getDeclaredAttribute('value');
        constr = type.typeConstructor;
      });

      it('should has a valid schema', function () {
        expect(type.isEntity).be.true;
        expect(type.identifier).equal('/db/test.type.' + name);
        expect(type.id.isId).be.true;
        expect(type.version.isVersion).be.true;
        expect(type.declaredAttributes.length).equal(1);

        expect(type.typeConstructor).not.undefined;
        expect(type.getAttribute('value')).equal(attr);

        for (var i = 0, iter = type.attributes(); iter.hasNext; ++i) {
          expect(iter.next()).equal(attr);
        }

        expect(i).equal(1);

        expect(attr.isId).be.false;
        expect(attr.isVersion).be.false;
        expect(attr.name).equal('value');

        if (isCollection) {
          expect(attr.persistentAttributeType).equal(1);
          expect(jspa.metamodel.PluralAttribute.isInstance(attr)).be.true;

          if (collectionType == jspa.metamodel.PluralAttribute.CollectionType.MAP) {
            expect(attr.collectionType).equal(2);
            expect(jspa.metamodel.MapAttribute.isInstance(attr)).be.true;
            expect(attr.keyType).equal(collectionTypes[0]);
          } else if (collectionType == jspa.metamodel.PluralAttribute.CollectionType.SET) {
            expect(attr.collectionType).equal(3);
            expect(jspa.metamodel.SetAttribute.isInstance(attr)).be.true;
          } else {
            expect(attr.collectionType).equal(1);
            expect(jspa.metamodel.ListAttribute.isInstance(attr)).be.true;
          }

          expect(attr.elementType).equal(collectionTypes[collectionTypes.length - 1]);
        } else {
          if (valueType.isEntity) {
            expect(attr.persistentAttributeType).equal(5);
          } else if (valueType.isBasic) {
            expect(attr.persistentAttributeType).equal(0);
          } else if (valueType.isEmbeddable) {
            expect(attr.persistentAttributeType).equal(2);
          }

          expect(jspa.metamodel.SingularAttribute.isInstance(attr)).be.true;
          expect(attr.type).equal(valueType);
        }
      });

      it('should persist as empty object', function (done) {
        var obj = new constr();
        em.persist(obj);

        var promise = em.flush(function () {
          expect(obj._objectInfo.oid).not.undefined;
          expect(obj._objectInfo.version).not.undefined;
          expect(obj._objectInfo.state.isPersistent).be.true;
          expect(obj.value).equalNull();

          done();
        });
      });

      it('should persist', function (done) {
        var obj = new constr();
        em.persist(obj);
        obj.value = value;

        var promise = em.flush().always(function () {
          expect(obj._objectInfo.oid).not.undefined;
          expect(obj._objectInfo.version).not.undefined;
          expect(obj._objectInfo.state.isPersistent).be.true;
          expect(obj.value).equal(value);

          done();
        });
      });

      it('should persist and load', function (done) {
        var obj = new constr();
        em.persist(obj);
        obj.value = value;

        var loaded;
        var promise = em.flush().then(function () {
          em.detach(obj);

          return em.find(obj._objectInfo.oid).done(function (o) {
            loaded = o;
          });
        }).always(function () {
          expect(loaded).not.equal(obj);

          expect(loaded._objectInfo.oid).not.undefined;
          expect(loaded._objectInfo.version).not.undefined;
          expect(loaded._objectInfo.state.isPersistent).be.true;
          expect(loaded.value).equal(value);

          done();
        });
      });

      it('should persist and load null', function (done) {
        var obj = new constr();
        em.persist(obj);
        obj.value = null;

        var loaded;
        var promise = em.flush().then(function () {
          em.detach(obj);

          return em.find(obj._objectInfo.oid).done(function (o) {
            loaded = o;
          });
        }).always(function () {
          expect(loaded).not.equal(obj);

          expect(loaded._objectInfo.oid).not.undefined;
          expect(loaded._objectInfo.version).not.undefined;
          expect(loaded._objectInfo.state.isPersistent).be.true;
          expect(loaded.value).equalNull();

          done();
        });
      });

      it('should persist and load default value', function (done) {
        var obj = new constr();
        em.persist(obj);
        obj.value = defaultValue;

        var loaded;
        var promise = em.flush().then(function () {
          em.detach(obj);

          return em.find(obj._objectInfo.oid).done(function (o) {
            loaded = o;
          });
        }).always(function () {
          expect(loaded).not.equal(obj);

          expect(loaded._objectInfo.oid).not.undefined;
          expect(loaded._objectInfo.version).not.undefined;
          expect(loaded._objectInfo.state.isPersistent).be.true;
          expect(loaded.value).equal(defaultValue);

          done();
        });
      });

      it('should persist and be editable', function (done) {
        var obj = new constr();
        em.persist(obj);
        obj.value = defaultValue;

        var promise = em.flush().then(function () {
          obj.value = value;

          return em.flush();
        }).always(function () {
          expect(obj._objectInfo.oid).not.undefined;
          expect(obj._objectInfo.version).not.undefined;
          expect(obj._objectInfo.state.isPersistent).be.true;
          expect(obj.value).equal(value);

          done();
        });
      });

      if (!isCollection) {
        it('should be usable in lists', function (done) {
          var listConstr = schema.entity('test.type.' + name + 'List').typeConstructor;

          var obj = new listConstr();
          var val = obj.value = jspa.List([null, value, defaultValue, value]);

          em.persist(obj);
          var loaded;
          var promise = em.flush().then(function () {
            em.detach(obj);

            return em.find(obj._objectInfo.oid).done(function (o) {
              loaded = o;
            });
          }).always(function () {
            expect(obj._objectInfo.oid).not.undefined;
            expect(obj._objectInfo.version).not.undefined;
            expect(obj.value).equal(val);

            expect(loaded._objectInfo.oid).not.undefined;
            expect(loaded._objectInfo.version).not.undefined;
            expect(loaded._objectInfo.state.isPersistent).be.true;
            expect(loaded.value).equal(val);

            done();
          });
        });

        it('should be usable in sets', function (done) {
          var setConstr = schema.entity('test.type.' + name + 'Set').typeConstructor;

          var obj = new setConstr();
          var val = obj.value = jspa.Set([null, value, defaultValue]);

          em.persist(obj);
          var loaded;
          var promise = em.flush().then(function () {
            em.detach(obj);

            return em.find(obj._objectInfo.oid).done(function (o) {
              loaded = o;
            });
          }).always(function () {
            expect(obj._objectInfo.oid).not.undefined;
            expect(obj._objectInfo.version).not.undefined;
            expect(obj.value).equal(val);

            expect(loaded._objectInfo.oid).not.undefined;
            expect(loaded._objectInfo.version).not.undefined;
            expect(loaded._objectInfo.state.isPersistent).be.true;
            expect(loaded.value).equal(val);

            done();
          });
        });

        it('should be usable as map values', function (done) {
          var mapConstr = schema.entity('test.type.' + name + 'AsMapValues').typeConstructor;

          var obj = new mapConstr();
          var val = obj.value = jspa.Map([
            { key: "test1", value: value },
            { key: "test2", value: defaultValue },
            { key: "test3", value: null }
          ]);

          em.persist(obj);
          var loaded;
          var promise = em.flush().then(function () {
            em.detach(obj);

            return em.find(obj._objectInfo.oid).done(function (o) {
              loaded = o;
            });
          }).always(function () {
            expect(obj._objectInfo.oid).not.undefined;
            expect(obj._objectInfo.version).not.undefined;
            expect(obj.value).equal(val);

            expect(loaded._objectInfo.oid).not.undefined;
            expect(loaded._objectInfo.version).not.undefined;
            expect(loaded._objectInfo.state.isPersistent).be.true;
            expect(loaded.value).equal(val);

            done();
          });
        });

        it('should be usable as map keys', function (done) {
          var mapConstr = schema.entity('test.type.' + name + 'AsMapKeys').typeConstructor;

          var obj = new mapConstr();
          var val = obj.value = jspa.Map([
            { key: value, value: "test1" },
            { key: defaultValue, value: "test2" },
            { key: null, value: "test3" }
          ]);

          em.persist(obj);
          var loaded;
          var promise = em.flush().then(function () {
            em.detach(obj);

            return em.find(obj._objectInfo.oid).done(function (o) {
              loaded = o;
            });
          }).always(function () {
            expect(obj._objectInfo.oid).not.undefined;
            expect(obj._objectInfo.version).not.undefined;
            expect(obj.value).equal(val);

            expect(loaded._objectInfo.oid).not.undefined;
            expect(loaded._objectInfo.version).not.undefined;
            expect(loaded._objectInfo.state.isPersistent).be.true;
            expect(loaded.value).equal(val);

            done();
          });
        });
      }

      it('should be usable as embedded value', function (done) {
        var wrapper = schema.entity('test.type.' + name + 'EmbeddedWrapper').typeConstructor;
        var embedded = schema.embeddable('test.type.' + name + 'Embedded').typeConstructor;

        var obj = new wrapper();
        var val = new embedded();
        val.value = value;
        obj.embedded = val;

        em.persist(obj);
        var loaded;
        var promise = em.flush().then(function () {
          em.detach(obj);

          return em.find(obj._objectInfo.oid).done(function (o) {
            loaded = o;
          });
        }).always(function () {
          expect(obj._objectInfo.oid).not.undefined;
          expect(obj._objectInfo.version).not.undefined;
          expect(obj.embedded).equal(val);

          expect(loaded._objectInfo.oid).not.undefined;
          expect(loaded._objectInfo.version).not.undefined;
          expect(loaded._objectInfo.state.isPersistent).be.true;
          expect(loaded.embedded).equal(val);

          done();
        });
      });

    })
  });
});         */

