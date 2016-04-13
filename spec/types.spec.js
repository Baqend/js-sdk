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
    "time": { type: metamodel.baseType('Time'), simple:true, values: [new Date("1970-01-01T00:00:00Z"), new Date("1970-01-01T17:33:14Z")] },
    "date": { type: metamodel.baseType('Date'), simple:true, values: [new Date("1970-01-01T00:00:00Z"), new Date("2013-11-22T00:00:00Z")] },
    "dateTime": { type: metamodel.baseType('DateTime'), simple:true, values: [new Date(), new Date("1970-01-01T17:33:14Z")] },
    "geoPoint": { type: metamodel.baseType('GeoPoint'), values: [new DB.GeoPoint(34.5658, 110.4576), new DB.GeoPoint(0, 0)] },
    "jsonArray": { type: metamodel.baseType('JsonArray'), values: [[1,'string',{key:'value'}, [1,2,3]], [], [null, 0, false, '', [], {}]] },
    "jsonObject": { type: metamodel.baseType('JsonObject'), values: [
      {k1:1, k2:'string', k3:{key:'value'}, k4:[1,2,3]}, {}, {k1:3.4, k2:0, k3:false, k4:'', k5:[], k6:{}}
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
    for (var prop in obj)
      if (prop != 'id')
        obj[prop] = null;

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
      var list = DB.List.from(types[name].values);
      testList(name + "List", list);
    });
  });

  describe("refList value", function() {
    testList("refList", new DB.List(testObject(), testObject(), null, testObject()));
  });

  describe("embeddedList value", function() {
    testList("embeddedList", new DB.List(embeddableObject(), embeddableObject(), null, embeddableObject()));
  });

  for (name in types) {
    if (types[name].simple) {
      describe(name + "Set value", function() {
        var set = new DB.Set(types[name].values);
        testSet(name + "Set", set);
      });
    }
  }

  describe("refSet value", function() {
    testSet("refSet", new DB.Set([testObject(), null, testObject(), testObject()]));
  });

  describe("simpleMap value", function() {
    var map = new DB.Map([
      ["Test", true],
      ["String", false]
    ]);

    testMap("simplebooleanMap", map);
  });

  Object.keys(types).forEach(function(name) {
    describe("simple" + name + "Map value", function() {
      var map = new DB.Map();
      var vals = types[name].values;
      for (var i = 0; i < vals.length; ++i) {
        map.set("key" + i, vals[i]);
      }

      testMap("simple" + name + "Map", map);
    });

    if (types[name].simple) {
      describe(name + "simpleMap value", function() {
        var keys = types[name].values;
        var map = new DB.Map();
        for (var i = 0; i < keys.length; ++i) {
          map.set(keys[i], "value" + i);
        }

        testMap(name + "simpleMap", map);
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
    testMap("simpleRefMap", map1);

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

    testMap("refSimpleMap", map1);

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

    testMap("refMap", map1);

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

    testMap("simpleEmbeddedMap", map1);

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

    testMap("dateTimeEmbeddedMap", map1);

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
        expectedValue = value;
      }

      it(value + " should be saved and reloaded", function() {
        obj[name] = value;

        return obj.save({refresh:true}).then(function() {
          expect(obj[name]).eql(expectedValue);
        });
      });
    });
  }

  function testList(name, list) {
    test(name);

    it("should be saved with an empty list", function() {
      obj[name] = new DB.List();

      return obj.save({refresh: true}).then(function() {
        var list = obj[name];
        expect(list.length).eql(0);
      });
    });

    it("should add values", function() {
      obj[name] = DB.List.from(list);

      return obj.save().then(function() {
        obj[name].splice(0, obj[name].length);
        expect(obj[name].length).eql(0);
        return obj.load({refresh: true});
      }).then(function() {
        var newList = obj[name];
        expect(newList.length).eql(list.length);
        for (var i = 0; i < list.length; ++i) {
          expect(newList[i]).eql(list[i]);
        }
      });
    });

    it("should remove values", function() {
      var newList = obj[name] = DB.List.from(list);

      var json = state.getJson();
      json[name] = [];
      state.setJson(json);

      expect(newList.length).eq(0);
    });

    it("should track removes", function() {
      obj[name] = DB.List.from(list);

      var version = 0;
      return obj.save().then(function() {
        obj[name].pop();
        version = obj.version;
        return obj.save({refresh: true});
      }).then(function() {
        var newList = obj[name];
        expect(obj.version).eql(version + 1);
        expect(newList.length).eql(list.length - 1);
        for (var i = 0; i < list.length - 1; ++i) {
          expect(newList[i]).eql(list[i]);
        }
      });
    });

    it("should track adds", function() {
      obj[name] = new DB.List();

      var version = 0;
      return obj.save().then(function() {
        obj[name].push(list[0]);
        version = obj.version;
        return obj.save({refresh: true});
      }).then(function() {
        var newList = obj[name];
        expect(obj.version).eql(version + 1);
        expect(newList.length).eql(1);
        expect(newList[0]).eql(list[0]);
      });
    });

    it("should track changes", function() {
      obj[name] = [list[0]];

      var version = 0;
      return obj.save().then(function() {
        obj[name][0] = list[1];
        version = obj.version;
        return obj.save({refresh: true});
      }).then(function() {
        var newList = obj[name];
        expect(obj.version).eql(version + 1);
        expect(newList.length).eql(1);
        expect(newList[0]).eql(list[1]);
      });
    });

    it("should not track none changes", function() {
      obj[name] = DB.List.from(list);

      var version = 0;
      return obj.save().then(function() {
        version = obj.version;
        obj[name][0] = list[0];
        return obj.save({refresh: true});
      }).then(function() {
        expect(obj.version).eql(version);
      });
    });

    var args = Array.prototype.slice.call(arguments, 1);
    args.forEach(function(arg) {
      var value = arg;
      var expectedValue = DB.List.from(value);

      it(arg + " should be saved and reloaded", function() {
        obj[name] = value;

        return obj.save({refresh: true}).then(function() {
          var list = obj[name];
          var len = expectedValue.length;
          expect(list.length).eql(len);
          for (var i = 0; i < len; ++i) {
            expect(list[i]).eql(expectedValue[i]);
          }
        });
      });
    });
  }

  function testSet(name, set) {
    test(name);

    it("should be saved with an empty set", function() {
      obj[name] = new DB.Set();

      return obj.save({refresh: true}).then(function() {
        var set = obj[name];
        expect(set.size).eql(0);
      });
    });

    it("should add values", function() {
      obj[name] = new DB.Set(set);

      return obj.save().then(function() {
        obj[name].clear();
        return obj.load({refresh: true});
      }).then(function() {
        var newSet = obj[name];
        expect(newSet.size).gt(0);
        for (var iter = set.values(), item; !(item = iter.next()).done;) {
          expect(newSet.has(item.value)).be.true;
        }
      });
    });

    it("should remove values", function() {
      var newSet = obj[name] = new DB.Set(set);

      var json = state.getJson();
      json[name] = [];
      state.setJson(json);

      expect(newSet.size).eq(0);
    });

    it("should track removes", function() {
      obj[name] = new DB.Set(set);

      var version = 0;
      var removed = set.values().next().value;
      return obj.save().then(function() {
        obj[name].delete(removed);
        version = obj.version;
        return obj.save({refresh: true});
      }).then(function() {
        var newSet = obj[name];
        expect(obj.version).eql(version + 1);
        expect(newSet.size).eql(set.size - 1);
        for (var iter = set.values(), item; !(item = iter.next()).done;) {
          expect(newSet.has(item.value)).eql(item.value !== removed);
        }
      });
    });

    it("should track adds", function() {
      obj[name] = new DB.Set();

      var version = 0;
      var add = set.values().next().value;
      return obj.save().then(function() {
        obj[name].add(add);
        version = obj.version;
        return obj.save({refresh: true});
      }).then(function() {
        var newSet = obj[name];
        expect(obj.version).eql(version + 1);
        expect(newSet.size).eql(1);
        expect(newSet.values().next().value).eql(add);
      });
    });

    it("should track changes", function() {
      var items = set.values();
      var val1 = items.next().value;
      var val2 = items.next().value;

      obj[name] = new DB.Set();
      obj[name].add(val1);

      var version = 0;
      return obj.save().then(function() {
        obj[name].delete(val1);
        obj[name].add(val2);
        version = obj.version;
        return obj.save({refresh: true});
      }).then(function() {
        var newSet = obj[name];
        expect(obj.version).eql(version + 1);
        expect(newSet.size).eql(1);
        expect(newSet.values().next().value).eql(val2);
      });
    });

    it("should not track none changes", function() {
      obj[name] = new DB.Set(set);

      var version = 0;
      return obj.save().then(function() {
        version = obj.version;
        obj[name].add(set.values().next().value);
        return obj.save({refresh: true});
      }).then(function() {
        expect(obj.version).eql(version);
      });
    });

    var args = Array.prototype.slice.call(arguments, 1);
    args.forEach(function(arg) {
      var value = arg;
      var expectedValue = new DB.Set(value);

      it(arg + " should be saved and reloaded", function() {
        obj[name] = value;

        return obj.save({refresh: true}).then(function() {
          var set = obj[name];
          var size = expectedValue.size;
          expect(set.size).eql(size);
          expectedValue.forEach(function(val) {
            expect(set.has(val)).be.true;
          });
        });
      });
    });
  }

  function testMap(name, map) {
    test(name);

    it("should be saved with an empty map", function() {
      obj[name] = new DB.Map();

      return obj.save({refresh: true}).then(function() {
        var map = obj[name];
        expect(map.size).eql(0);
      });
    });

    it("should add key", function() {
      obj[name] = new DB.Map(map);

      return obj.save().then(function() {
        obj[name].clear();
        return obj.load({refresh: true});
      }).then(function() {
        var newMap = obj[name];
        expect(newMap.size).gt(0);
        for (var iter = map.entries(), item; !(item = iter.next()).done;) {
          expect(newMap.get(item.value[0])).eqls(item.value[1]);
        }
      });
    });

    it("should remove key", function() {
      var newMap = obj[name] = new DB.Map(map);

      var json = state.getJson();
      json[name] = {};
      state.setJson(json);

      expect(newMap.size).eq(0);
    });

    it("should track removes", function() {
      obj[name] = new DB.Map(map);

      var version = 0;
      var removed = map.keys().next().value;
      return obj.save().then(function() {
        obj[name].delete(removed);
        version = obj.version;
        return obj.save({refresh: true});
      }).then(function() {
        var newMap = obj[name];
        expect(obj.version).eql(version + 1);
        expect(newMap.size).eql(map.size - 1);
        for (var iter = map.entries(), item; !(item = iter.next()).done;) {
          if (item.value[0] == removed) {
            expect(newMap.has(item.value[0])).be.false;
          } else {
            expect(newMap.get(item.value[0])).eqls(item.value[1]);
          }
        }
      });
    });

    it("should track adds", function() {
      obj[name] = new DB.Map();

      var version = 0;
      var add = map.entries().next().value;
      return obj.save().then(function() {
        obj[name].set(add[0], add[1]);
        version = obj.version;
        return obj.save({refresh: true});
      }).then(function() {
        var newMap = obj[name];
        expect(obj.version).eql(version + 1);
        expect(newMap.size).eql(1);
        expect(newMap.get(add[0])).eql(add[1]);
      });
    });

    it("should track changes", function() {
      var items = map.entries();
      var entry1 = items.next().value;
      var entry2 = items.next().value;

      obj[name] = new DB.Map();
      obj[name].set(entry1[0], entry1[1]);

      var version = 0;
      return obj.save().then(function() {
        obj[name].delete(entry1[0]);
        obj[name].set(entry2[0], entry2[1]);
        version = obj.version;
        return obj.save({refresh: true});
      }).then(function() {
        var newMap = obj[name];
        expect(obj.version).eql(version + 1);
        expect(newMap.size).eql(1);
        expect(newMap.get(entry2[0])).eql(entry2[1]);
      });
    });

    it("should not track none changes", function() {
      obj[name] = new DB.Map(map);

      var version = 0;
      return obj.save().then(function() {
        version = obj.version;
        var entry = map.entries().next().value;
        obj[name].set(entry[0], entry[1]);
        return obj.save({refresh: true});
      }).then(function() {
        expect(obj.version).eql(version);
      });
    });

    var args = Array.prototype.slice.call(arguments, 1);
    args.forEach(function(arg) {
      var value = arg;
      var expectedValue = new DB.Map(value);

      it(arg + " should be saved and reloaded", function() {
        obj[name] = value;

        return obj.save({refresh: true}).then(function() {
          var map = obj[name];
          expect(map.size).eql(expectedValue.size);
          for (var iter = expectedValue.entries(), item; !(item = iter.next()).done;) {
            expect(map.get(item.value[0])).eqls(item.value[1]);
          }
        });
      });
    });
  }
});