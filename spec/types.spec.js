if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  expect = chai.expect;
  DB = require('../lib');
}

describe('Test GeoPoint', function() {
  it("should construct with an latitude and longitude argument", function() {
    var point = new DB.GeoPoint(56.5, 165.2);

    expect(point.latitude).equals(56.5);
    expect(point.longitude).equals(165.2);
  });

  it("should construct with an array argument", function() {
    var point = new DB.GeoPoint([-36.5, -92.3]);

    expect(point.latitude).equals(-36.5);
    expect(point.longitude).equals(-92.3);
  });

  it("should construct with an geolike object argument", function() {
    var point = new DB.GeoPoint({"latitude": 90, "longitude": -180.0});

    expect(point.latitude).equals(90);
    expect(point.longitude).equals(-180.0);
  });

  it("should construct from json argument", function() {
    var point1 = new DB.GeoPoint({"latitude": -90, "longitude": 180.0});
    var point2 = new DB.GeoPoint(point1.toJSON());

    expect(point1).eql(point2);
  });

  it("should compute distance", function() {
    var point1 = new DB.GeoPoint(53.5753, 10.0153); // Hamburg
    var point2 = new DB.GeoPoint(40.7143, -74.006); // New York
    var point3 = new DB.GeoPoint(-33.8679, 151.207); // Sydney
    var point4 = new DB.GeoPoint(51.5085, -0.1257); // London

    expect(point1.kilometersTo(point2)).within(6147 * 0.97, 6147 * 1.03);
    expect(point1.milesTo(point2)).within(3819 * 0.97, 3819 * 1.03);
    expect(point3.kilometersTo(point4)).within(16989 * 0.97, 16989 * 1.03);
    expect(point3.milesTo(point4)).within(10556 * 0.97, 10556 * 1.03);
  });
});

describe('Test entity type', function () {
  var em, emf, EntityClass, EmbeddedClass, obj, state;

  emf = new DB.EntityManagerFactory(env.TEST_SERVER);
  var metamodel = emf.metamodel;
  metamodel.init({});

  var EntityType = new DB.metamodel.EntityType('jstest.Type', metamodel.entity(Object));
  var EmbeddedType = new DB.metamodel.EmbeddableType('jstest.Embedded');
  var simpleTypes = {
    // values used for collection tests
    "boolean": {type: metamodel.baseType('Boolean'), values: [true, false] },
    "float": {type: metamodel.baseType('Double'), values: [-2.3, 4] },
    "integer": {type: metamodel.baseType('Integer'), values: [0, -4, 56] },
    "string": { type: metamodel.baseType('String'), values: ["", "Test String"] },
    "time": { type: metamodel.baseType('Time'), values: [new Date("1970-01-01T17:33:14")] },
    "date": { type: metamodel.baseType('Date'), values: [new Date("2013-11-22")] },
    "dateTime": { type: metamodel.baseType('DateTime'), values: [new Date()] },
    "geoPoint": { type: metamodel.baseType('GeoPoint'), values: [new DB.GeoPoint(34.5658, 110.4576)] }
  };

  for (var i = 0, type; type = [EntityType, EmbeddedType][i]; ++i) {
    for (var name in simpleTypes) {
      type.addAttribute(new DB.metamodel.SingularAttribute(name, simpleTypes[name].type));
    }

    type.addAttribute(new DB.metamodel.SingularAttribute("jsonArray", metamodel.baseType('JsonArray')));
    type.addAttribute(new DB.metamodel.SingularAttribute("jsonObject", metamodel.baseType('JsonObject')));
    type.addAttribute(new DB.metamodel.SingularAttribute("ref", EntityType));
    type.addAttribute(new DB.metamodel.SingularAttribute("embedded", EmbeddedType));

    for (var name in simpleTypes) {
      type.addAttribute(new DB.metamodel.ListAttribute(name + "List", simpleTypes[name].type));
    }
    type.addAttribute(new DB.metamodel.ListAttribute("refList", EntityType));
    type.addAttribute(new DB.metamodel.ListAttribute("embeddedList", EmbeddedType));

    for (var name in simpleTypes) {
      type.addAttribute(new DB.metamodel.SetAttribute(name + "Set", simpleTypes[name].type));
    }
    type.addAttribute(new DB.metamodel.SetAttribute("refSet", EntityType));

    for (var name in simpleTypes) {
      type.addAttribute(new DB.metamodel.MapAttribute(name + "simpleMap", simpleTypes[name].type, metamodel.baseType('String')));
      type.addAttribute(new DB.metamodel.MapAttribute("simple" + name + "Map", metamodel.baseType('String'), simpleTypes[name].type));
    }
    type.addAttribute(new DB.metamodel.MapAttribute("simpleRefMap", metamodel.baseType('String'), EntityType));
    type.addAttribute(new DB.metamodel.MapAttribute("refSimpleMap", EntityType, metamodel.baseType('String')));
    type.addAttribute(new DB.metamodel.MapAttribute("refMap", EntityType, EntityType));
    type.addAttribute(new DB.metamodel.MapAttribute("simpleEmbeddedMap", metamodel.baseType('String'), EmbeddedType));
  }

  metamodel.addType(EntityType);
  metamodel.addType(EmbeddedType);

  before(function() {
    return saveMetamodel(metamodel).then(function() {
      return emf.createEntityManager();
    }).then(function(entityManager) {
      em = entityManager;

      EntityClass = em['jstest.Type'];
      EmbeddedClass = em['jstest.Embedded'];
    });
  });

  beforeEach(function() {
    obj = EntityClass();
    state = DB.util.Metadata.get(obj);
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
    test("float", 0.0, 42.42, 42);
  });

  describe("integer value", function() {
    test("integer", 0, 42);
  });

  describe("string value", function() {
    test("string", "", "Test String", 'String', null);
  });

  describe("time value", function() {
    test("time", new Date(0), new Date("1970-01-01T17:33:14+05:00"), [new Date("1970-01-01T17:33:14-08:00"), new Date("1970-01-01T01:33:14Z")], new Date("1970-01-01T17:33:14Z"));
  });

  describe("date value", function() {
    test("date", new Date(0), new Date("2013-11-22"), new Date("2013-11-22"), new Date("0000-01-01"));
  });

  describe("dateTime value", function() {
    test("dateTime", new Date(0), new Date(), new Date("0000-01-01T00:00:00Z"));
  });

  describe("geoPoint value", function() {
    test("geoPoint", new DB.GeoPoint(), new DB.GeoPoint(34.5658, 110.4576), new DB.GeoPoint(-45.67, -177.45));
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
      var ref = testObject();

      obj.ref = ref;

      var json = state.getDatabaseObject();
      var refId = DB.util.Metadata.get(ref).ref;
      expect(refId).contain('/db/');
      expect(json.ref).be.ok;
      expect(json.ref).equals(refId);

      state.setDatabaseObject(json);
      expect(obj.ref).equals(ref);
    });
  });

  describe("embedded value", function() {
    test("embedded", new EmbeddedType.typeConstructor(), embeddableObject(), [{}, null]);
  });

  for (name in simpleTypes) {
    describe(name + "List value", function() {
      var list = new DB.List();
      var vals = simpleTypes[name].values;
      for (var i = 0; i < vals.length; ++i) {
        list.add(vals[i]);
      }

      test(name + "List", list);
    });
  }

  describe("refList value", function() {
    test("refList", new DB.List(), DB.List([testObject(), testObject(), null, testObject()]));
  });

  describe("embeddedList value", function() {
    test("embeddedList", new DB.List(), DB.List([embeddableObject(), embeddableObject(), null, embeddableObject()]));
  });

  for (name in simpleTypes) {
    describe(name + "Set value", function() {
      var set = new DB.Set();
      var vals = simpleTypes[name].values;
      for (var i = 0; i < vals.length; ++i) {
        set.add(vals[i]);
      }

      test(name + "Set", set);
    });
  }

  describe("refSet value", function() {
    test("refSet", new DB.Set(), DB.Set([testObject(), null, testObject(), testObject()]));
  });

  describe("simpleMap value", function() {
    var map = DB.Map([
      {key: "Test", value: true},
      {key: "String", value: false},
      {key: "123", value: null}
    ]);

    test("simplebooleanMap", new DB.Map(), new DB.Map(map));

    it("should add key", function() {
      obj.simplebooleanMap = new DB.Map(map);

      var json = state.getDatabaseObject();
      json.simplebooleanMap['add'] = true;
      state.setDatabaseObject(json);

      expect(obj.simplebooleanMap.size).equals(4);
      expect(obj.simplebooleanMap.get('123')).be.null;
      expect(obj.simplebooleanMap.get('add')).be.true;
      expect(obj.simplebooleanMap.get('Test')).be.true;
      expect(obj.simplebooleanMap.get('String')).be.false;
    });

    it("should remove key", function() {
      obj.simplebooleanMap = new DB.Map(map);

      var json = state.getDatabaseObject();
      delete json.simplebooleanMap['123'];
      state.setDatabaseObject(json);

      expect(obj.simplebooleanMap.size).equals(2);
      expect(obj.simplebooleanMap.get('123')).be.undefined;
      expect(obj.simplebooleanMap.get('Test')).be.true;
      expect(obj.simplebooleanMap.get('String')).be.false;
    });
  });

  for (name in simpleTypes) {
    describe("simple" + name + "Map value", function() {
      var map = new DB.Map();
      var vals = simpleTypes[name].values;
      for (var i = 0; i < vals.length; ++i) {
        map.set("key" + i, vals[i]);
      }

      test("simple" + name + "Map", map);
    });

    describe(name + "simpleMap value", function() {
      var keys = simpleTypes[name].values;
      var map = new DB.Map();
      for (var i = 0; i < keys.length; ++i) {
        map.set(keys[i], "value" + i);
      }

      test(name + "simpleMap", map);
    });
  }

  describe("simpleRefMap value", function() {
    var map = DB.Map([
      {key: "Test", value: testObject()},
      {key: "String", value: testObject()},
      {key: "123", value: testObject()},
      {key: "null", value: null}
    ]);

    test("simpleRefMap", new DB.Map(), map);
  });

  describe("refSimpleMap value", function() {
    var map = DB.Map([
      {key: testObject(), value: true},
      {key: testObject(), value: false},
      {key: testObject(), value: null}
    ]);

    test("refSimpleMap", new DB.Map(), map);
  });

  describe("refMap value", function() {
    var map = DB.Map([
      {key: testObject(), value: testObject()},
      {key: testObject(), value: testObject()},
      {key: testObject(), value: null}
    ]);

    test("refMap", new DB.Map(), map);
  });

  describe("simpleEmbeddedMap value", function() {
    var map = DB.Map([
      {key: "Test", value: embeddableObject()},
      {key: "String", value: embeddableObject()},
      {key: "123", value: null}
    ]);

    test("simpleEmbeddedMap", new DB.Map(), map);
  });

  /**
   * @param {String} name field the name of the field to test
   * @param {Object[]|Object...} values values to test for
   */
  function test(name) {
    it("should save undefined properly", function() {
      var obj = EntityClass();
      obj[name] = undefined;

      return obj.saveAndRefresh().then(function() {
        expect(obj[name]).be.null;
      });
    });

    it("should save null properly", function() {
      var obj = EntityClass();
      obj[name] = null;

      return obj.saveAndRefresh().then(function() {
        expect(obj[name]).be.null;
      });
    });

    var args = Array.prototype.slice.call(arguments, 1);
    args.forEach(function(arg) {
      var value = Array.isInstance(arg)? arg[0]: arg;
      var expectedValue = Array.isInstance(arg)? arg[1]: arg;

      it(value + " should be saved and refreshed", function() {
        obj[name] = value;

        return obj.saveAndRefresh().then(function() {
            expect(obj[name]).eql(expectedValue);
        });
      });
    });
  }
});