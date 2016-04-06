if (typeof DB == 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test entity type', function () {
  var em, emf, EntityClass, EmbeddedClass, obj, state, metamodel, EntityType, EmbeddedType, types;
  emf = new DB.EntityManagerFactory({ schema: {} });
  metamodel = emf.metamodel;

  EntityType = new DB.metamodel.EntityType('jstest.Type', metamodel.entity(Object));
  EmbeddedType = new DB.metamodel.EmbeddableType('jstest.Embedded');
  types = {
    // values used for collection tests
    "boolean": {type: metamodel.baseType('Boolean'), simple:true, values: [true, false] },
    "float": {type: metamodel.baseType('Double'), simple:true, values: [-2.3, 4] },
    "integer": {type: metamodel.baseType('Integer'), simple:true, values: [0, -4, 56] },
    "string": { type: metamodel.baseType('String'), simple:true, values: ["", "Test String"] },
    "time": { type: metamodel.baseType('Time'), simple:true, values: [new Date("1970-01-01T17:33:14")] },
    "date": { type: metamodel.baseType('Date'), simple:true, values: [new Date("2013-11-22")] },
    "dateTime": { type: metamodel.baseType('DateTime'), simple:true, values: [new Date()] },
    "geoPoint": { type: metamodel.baseType('GeoPoint'), values: [new DB.GeoPoint(34.5658, 110.4576), new DB.GeoPoint(0, 0)] },
    "jsonArray": { type: metamodel.baseType('JsonArray'), values: [[1,'string',{key:'value'}, [1,2,3]], [], [null, 0, false, '', [], {}]] },
    "jsonObject": { type: metamodel.baseType('JsonObject'), values: [
      {k1:1, k2:'string', k3:{key:'value'}, k4:[1,2,3]}, {}, {k1:null, k2:0, k3:false, k4:'', k5:[], k6:{}}
    ]}
  };

  for (var i = 0, type; type = [EntityType, EmbeddedType][i]; ++i) {
    for (var name in types) {
      type.addAttribute(new DB.metamodel.SingularAttribute(name, types[name].type));
    }

    type.addAttribute(new DB.metamodel.SingularAttribute("ref", EntityType));
    type.addAttribute(new DB.metamodel.SingularAttribute("embedded", EmbeddedType));

    for (var name in types) {
      type.addAttribute(new DB.metamodel.ListAttribute(name + "List", types[name].type));
    }
    type.addAttribute(new DB.metamodel.ListAttribute("refList", EntityType));
    type.addAttribute(new DB.metamodel.ListAttribute("embeddedList", EmbeddedType));

    for (var name in types) {
      if (types[name].simple) {
        type.addAttribute(new DB.metamodel.SetAttribute(name + "Set", types[name].type));
      }
    }

    type.addAttribute(new DB.metamodel.SetAttribute("refSet", EntityType));

    for (var name in types) {
      type.addAttribute(new DB.metamodel.MapAttribute("simple" + name + "Map", metamodel.baseType('String'), types[name].type));
      if (types[name].simple) {
        type.addAttribute(new DB.metamodel.MapAttribute(name + "simpleMap", types[name].type, metamodel.baseType('String')));
      }
    }

    type.addAttribute(new DB.metamodel.MapAttribute("simpleRefMap", metamodel.baseType('String'), EntityType));
    type.addAttribute(new DB.metamodel.MapAttribute("refSimpleMap", EntityType, metamodel.baseType('String')));
    type.addAttribute(new DB.metamodel.MapAttribute("refMap", EntityType, EntityType));
    type.addAttribute(new DB.metamodel.MapAttribute("simpleEmbeddedMap", metamodel.baseType('String'), EmbeddedType));
    type.addAttribute(new DB.metamodel.MapAttribute("dateTimeEmbeddedMap", metamodel.baseType('DateTime'), EmbeddedType));
  }

  metamodel.addType(EntityType);
  metamodel.addType(EmbeddedType);

  before(function() {
    emf.tokenStorage = helper.rootTokenStorage;

    return emf.connect(env.TEST_SERVER).then(function() {
      return metamodel.save();
    }).then(function() {
      return emf.createEntityManager();
    }).then(function(entityManager) {
      em = entityManager;

      EntityClass = em['jstest.Type'];
      EmbeddedClass = em['jstest.Embedded'];
    });
  });

  beforeEach(function() {
    obj = new EntityClass();
    state = DB.util.Metadata.get(obj);
  });

  function testObject() {
    var obj = EntityType.create();
    setValues(obj);
    return obj;
  }

  function embeddableObject() {
    var obj = EmbeddedType.create();
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
    test("date", new Date(0), new Date("2013-11-22T00:00Z"), new Date("2013-11-22T00:00Z"), new Date("0000-01-01T00:00Z"));
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
    test("ref", EntityType.create(), testObject(), [{}, null]);

    it("should convert references to ids", function() {
      var ref = testObject();

      obj.ref = ref;

      var json = state.getJson();
      expect(ref.id).contain('/db/');
      expect(json.ref).be.ok;
      expect(json.ref).equals(ref.id);

      state.setJson(json);
      expect(obj.ref).equals(ref);
    });
  });

  describe("embedded value", function() {
    test("embedded", EmbeddedType.create(), embeddableObject(), [{}, null]);
  });

  Object.keys(types).forEach(function(name) {
    describe(name + "List value", function() {
      var list = new DB.List();
      var vals = types[name].values;
      for (var i = 0; i < vals.length; ++i) {
        list.push(vals[i]);
      }

      test(name + "List", [list, list]);
    });
  });

  describe("refList value", function() {
    test("refList", [new DB.List()], [new DB.List(testObject(), testObject(), null, testObject())]);
  });

  describe("embeddedList value", function() {
    test("embeddedList", [new DB.List()], [new DB.List(embeddableObject(), embeddableObject(), null, embeddableObject())]);
  });

  for (name in types) {
    if (types[name].simple) {
      describe(name + "Set value", function() {
        var set = new DB.Set();
        var vals = types[name].values;
        for (var i = 0; i < vals.length; ++i) {
          set.add(vals[i]);
        }

        test(name + "Set", set);
      });
    }
  }

  describe("refSet value", function() {
    test("refSet", new DB.Set(), new DB.Set([testObject(), null, testObject(), testObject()]));
  });

  describe("simpleMap value", function() {
    var map = new DB.Map([
      ["Test", true],
      ["String", false]
    ]);

    test("simplebooleanMap", new DB.Map(), new DB.Map(map));

    it("should add key", function() {
      obj.simplebooleanMap = new DB.Map(map);
      obj.simplebooleanMap.set("123", null);

      var json = state.getJson();
      json.simplebooleanMap['add'] = true;
      state.setJson(json);

      expect(obj.simplebooleanMap.size).equals(4);
      expect(obj.simplebooleanMap.get('123')).be.null;
      expect(obj.simplebooleanMap.get('add')).be.true;
      expect(obj.simplebooleanMap.get('Test')).be.true;
      expect(obj.simplebooleanMap.get('String')).be.false;
    });

    it("should remove key", function() {
      obj.simplebooleanMap = new DB.Map(map);

      var json = state.getJson();
      delete json.simplebooleanMap['123'];
      state.setJson(json);

      expect(obj.simplebooleanMap.size).equals(2);
      expect(obj.simplebooleanMap.get('123')).be.undefined;
      expect(obj.simplebooleanMap.get('Test')).be.true;
      expect(obj.simplebooleanMap.get('String')).be.false;
    });
  });

  Object.keys(types).forEach(function(name) {
    describe("simple" + name + "Map value", function() {
      var map = new DB.Map();
      var vals = types[name].values;
      for (var i = 0; i < vals.length; ++i) {
        map.set("key" + i, vals[i]);
      }

      test("simple" + name + "Map", map);
    });

    if (types[name].simple) {
      describe(name + "simpleMap value", function() {
        var keys = types[name].values;
        var map = new DB.Map();
        for (var i = 0; i < keys.length; ++i) {
          map.set(keys[i], "value" + i);
        }

        test(name + "simpleMap", map);
      });
    }
  });

  describe("simpleRefMap value", function() {
    var map1 = new DB.Map([
      ["Test", testObject()],
      ["String", testObject()],
      ["123", testObject()]
    ]);

    //null values should be removed
    test("simpleRefMap", new DB.Map(), map1);

    it("should remove null values", function() {
      var map2 = new DB.Map(map1);
      map2.set("null", null);

      obj["simpleRefMap"] = map2;
      return obj.save({refresh:true}).then(function() {
        expect(obj["simpleRefMap"].size).eqls(3);
        expect(obj["simpleRefMap"].has("null")).be.false;
      });
    });
  });

  describe("refSimpleMap value", function() {
    var map1 = new DB.Map([
      [testObject(), "value1"],
      [testObject(), "value2"]
    ]);

    test("refSimpleMap", new DB.Map(), map1);

    it("should remove null values", function() {
      var nullKey = testObject();
      var map2 = new DB.Map(map1);
      map2.set(nullKey, null);

      obj["refSimpleMap"] = map2;
      return obj.save({refresh:true}).then(function() {
        expect(obj["refSimpleMap"].size).eqls(2);
        expect(obj["refSimpleMap"].has(nullKey)).be.false;
      });
    });
  });

  describe("refMap value", function() {
    var map1 = new DB.Map([
      [testObject(), testObject()],
      [testObject(), testObject()]
    ]);

    test("refMap", new DB.Map(), map1);

    it("should remove null values", function() {
      var nullKey = testObject();
      var map2 = new DB.Map(map1);
      map2.set(nullKey, null);

      obj["refMap"] = map2;
      return obj.save({refresh:true}).then(function() {
        expect(obj["refMap"].size).eqls(2);
        expect(obj["refMap"].has(nullKey)).be.false;
      });
    });
  });

  describe("simpleEmbeddedMap value", function() {
    var map1 = new DB.Map([
      ["Test", embeddableObject()],
      ["String", embeddableObject()]
    ]);

    test("simpleEmbeddedMap", new DB.Map(), map1);

    it("should keep embedded identity", function() {
      obj["simpleEmbeddedMap"] = new DB.Map(map1);
      return obj.save({refresh:true}).then(function() {
        var mapValue = obj["simpleEmbeddedMap"];
        expect(mapValue.get("Test")).equal(map1.get("Test"));
        expect(mapValue.get("String")).equal(map1.get("String"));
      });
    });

    it("should remove null values", function() {
      var nullKey = "123";
      var map2 = new DB.Map(map1);
      map2.set(nullKey, null);

      obj["simpleEmbeddedMap"] = map2;
      return obj.save({refresh:true}).then(function() {
        expect(obj["simpleEmbeddedMap"].size).eqls(2);
        expect(obj["simpleEmbeddedMap"].has(nullKey)).be.false;
      });
    });
  });

  describe("dateTimeEmbeddedMap value", function() {
    var map1 = new DB.Map([
      [new Date("1970-01-01T00:00Z"), embeddableObject()],
      [new Date(), embeddableObject()]
    ]);

    test("dateTimeEmbeddedMap", new DB.Map(), map1);

    it("should keep embedded identity", function() {
      obj["dateTimeEmbeddedMap"] = new DB.Map(map1);
      return obj.save({refresh:true}).then(function() {
        var mapValue = obj["dateTimeEmbeddedMap"];
        expect(mapValue.get("Test")).equal(map1.get("Test"));
        expect(mapValue.get("String")).equal(map1.get("String"));
      });
    });

    it("should remove null values", function() {
      var nullKey = new Date("2015-01-01T00:00Z");
      var map2 = new DB.Map(map1);
      map2.set(nullKey, null);

      obj["dateTimeEmbeddedMap"] = map2;
      return obj.save({refresh:true}).then(function() {
        expect(obj["dateTimeEmbeddedMap"].size).eqls(2);
        expect(obj["dateTimeEmbeddedMap"].has(nullKey)).be.false;
      });
    });
  });

  /**
   * @param {String} name field the name of the field to test
   * @param {Object[]|Object...} values values to test for
   */
  function test(name) {
    it("should save undefined as null", function() {
      var obj = new EntityClass();
      obj[name] = undefined;

      return obj.save({refresh:true}).then(function() {
        expect(obj[name]).be.null;
      });
    });

    it("should save null properly", function() {
      var obj = new EntityClass();
      obj[name] = null;

      return obj.save({refresh:true}).then(function() {
        expect(obj[name]).be.null;
      });
    });

    var args = Array.prototype.slice.call(arguments, 1);
    args.forEach(function(arg) {
      var expectedValue, value;
      if (arg instanceof Array) {
        value = arg[0];
        expectedValue = arg[1];
      } else {
        value = arg;
      }

      if (value instanceof DB.List) {
        expectedValue = new DB.List.from(value);
      } else if (value instanceof DB.Set) {
        expectedValue = new DB.Set(value);
      } else if (value instanceof DB.Map) {
        expectedValue = new DB.Map(value);
      } else {
        expectedValue = value;
      }

      it(value + " should be saved and reloaded", function() {
        obj[name] = value;

        return obj.save({refresh:true}).then(function() {
          if (expectedValue instanceof DB.Map) {
            var map = obj[name];
            expect(map.size).eql(expectedValue.size);
            for (var iter = expectedValue.entries(), item; !(item = iter.next()).done; ) {
              expect(map.get(item.value[0])).eqls(item.value[1]);
            }
          } else {
            expect(obj[name]).eql(expectedValue);
          }
        });
      });
    });
  }

  function testList(test) {
    test(test);

  }
});