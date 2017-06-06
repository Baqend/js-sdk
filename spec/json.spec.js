var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe("Test toJSON and fromJSON", function() {
  var db, db2, model = [
    {
      "class": "/db/Level0",
      "fields": {
        "value": {
          "name": "value",
          "type": "/db/String"
        },
        "level1": {
          "name": "level1",
          "type": "/db/Level1"
        }
      }
    },
    {
      "class": "/db/Level1",
      "fields": {
        "value": {
          "name": "value",
          "type": "/db/String"
        },
        "testMap": {
          "name": "testMap",
          "type": "/db/collection.Map[/db/String,/db/Level2]"
        },
        "testList": {
          "name": "testList",
          "type": "/db/collection.List[/db/Level2]"
        },
        "testSet": {
          "name": "testSet",
          "type": "/db/collection.Set[/db/Level2]"
        }
      }
    },
    {
      "class": "/db/Level2",
      "fields": {
        "value": {
          "name": "value",
          "type": "/db/String"
        },
        "embedded": {
          "name": "embedded",
          "type": "/db/Embedded",
        }
      }
    },
    {
      "class": "/db/Embedded",
      "embedded": true,
      "fields": {
        "value": {
          "name": "value",
          "type": "/db/String"
        },
        "level0": {
          "name": "level0",
          "type": "/db/Level0"
        }
      }
    }
  ];

  beforeEach(function() {
    var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, schema: model, tokenStorage: helper.rootTokenStorage});
    return emf.metamodel.save().then(function() {
      db = emf.createEntityManager();
      db2 = emf.createEntityManager();
      expect(db.isReady).be.true;
      expect(db2.isReady).be.true;
    });
  });

  describe("default", function() {

    it('should convert to JSON', function() {
      var obj, json;
      obj = new db.Level0();
      obj.value = "test";
      json = obj.toJSON({depth: 0});
      expect(json).be.ok;
      expect(json.value).eqls("test");
      expect(json._metadata).be.undefined;
    });

    it('should create object from JSON', function() {
      var obj, json;
      json = {
        value: "test"
      }
      obj = db.Level0.fromJSON(json)
      expect(obj).be.ok;
      expect(obj.value).eqls("test");
      expect(obj.version).be.null;
      obj.save().then(function(obj) {
        expect(obj.id).be.ok;
        expect(obj.version).eqls(1);
      });
    });

    it('should update existing object from JSON', function() {
      var obj, objFromJson, json, id;
      obj = new db.Level0({value: "test"})
      obj.save().then(function(obj) {
        id = obj.id
        json = obj.toJSON({depth: 0});
        json.value = "test2"
        obj = db.Level0.fromJSON(json);
        expect(obj).be.ok;
        expect(obj.id).eqls(id)
        expect(obj.value).eqls("test2");
      });
    });
  })

  describe("nested", function() {
    var obj;
    beforeEach(function() {
      obj = new db.Level0();
      obj.value = "level0";
      obj.level1 = new db.Level1({value: "level1"})
    });

    it('should convert to JSON with nested objects', function() {
      var json = obj.toJSON({depth: 1});
      expect(json).be.ok;
      expect(json.value).eqls("level0")
      expect(json.level1).be.ok;
      expect(json.level1.value).eqls("level1");
    });

    it('should update existing object from JSON without nested objects', function() {
      return obj.save({depth: 1}).then(function(obj) {
        expect(obj.value).eqls("level0");
        expect(obj.version).eqls(1);
        expect(obj.level1.value).eqls("level1");
        expect(obj.level1.version).eqls(1);
        var json = obj.toJSON({depth: 1});
        json.value = "level0 updated";
        json.level1.value = "level1 updated";
        obj = db.Level0.fromJSON(json)
        return obj.save({depth: 0})
      }).then(function(obj) {
        expect(obj.value).eqls("level0 updated");
        expect(obj.version).eqls(2);
        expect(obj.level1.version).eqls(1);
        expect(obj.level1._metadata.isPersistent).eqls(false);
      })
    })

    it('should update existing object from JSON with nested objects', function() {
      return obj.save({depth: 1}).then(function(obj) {
        expect(obj.value).eqls("level0");
        expect(obj.version).eqls(1);
        expect(obj.level1.value).eqls("level1");
        expect(obj.level1.version).eqls(1);
        var json = obj.toJSON({depth: 1});
        json.value = "level0 updated";
        json.level1.value = "level1 updated";
        obj = db.Level0.fromJSON(json)
        return obj.save({depth: 1})
      }).then(function(obj) {
        expect(obj.value).eqls("level0 updated");
        expect(obj.version).eqls(2);
        expect(obj.level1.value).eqls("level1 updated");
        expect(obj.level1.version).eqls(2);
        expect(obj.level1._metadata.isPersistent).eqls(true);
      })
    })

  })

  describe("List", function() {
    var obj, listItem1, listItem2, listItem3;
    beforeEach(function() {
      listItem1 = new db.Level2({value: "listItem1"})
      listItem2 = new db.Level2({value: "listItem2"})
      listItem3 = new db.Level2({value: "listItem3"})
      obj = new db.Level1({value: "level1"})
      obj.testList = new DB.List(listItem1, listItem2)
    });

    it('should serialize a list with references', function() {
      return obj.save({depth: 1}).then(function(obj) {
        return Promise.all([db2.load(obj.testList[0].id), db2.load(obj.id)]);
      }).then(function(loaded) {
        var obj = loaded[1];
        var json = obj.toJSON({depth: 1})
        expect(json).be.ok
        expect(typeof json.testList[0]).eqls('object')
        expect(typeof json.testList[1]).eqls('string')
        expect(json.testList[0].value).eqls('listItem1')
      })
    })

    it('should create a list with references from json', function() {
      var json = obj.toJSON({depth: 1})
      obj = db.Level1.fromJSON(json)
      return obj.save({depth: 1}).then(function(obj) {
        return db2.Level1.load(obj.id, {depth: 1})
      }).then(function(obj) {
        expect(obj.testList[0]).to.have.property('id');
        expect(obj.testList[1]).to.have.property('id');
      })
    })

    it('should add a newly created object to a map from json', function() {
      obj.save({depth: 1}).then(function(obj) {
        var json = obj.toJSON({depth: 1})
        json.testList.push(listItem3.toJSON());
        obj = db.Level1.fromJSON(json)
        return obj.save({depth: 1}).then(function(obj) {
          return db2.Level1.load(obj.id, {depth: 1})
        })
      }).then(function(obj) {
        expect(obj.testList.length).eqls(3);
        expect(obj.testList[2]).to.have.property('id');
      })
    })

  })

  describe("Map", function() {
    var obj, listItem1, listItem2, listItem3;
    beforeEach(function() {
      listItem1 = new db.Level2({value: "listItem1"})
      listItem2 = new db.Level2({value: "listItem2"})
      listItem3 = new db.Level2({value: "listItem3"})
      obj = new db.Level1({value: "level1"})
      obj.testMap = new DB.Map([["listItem1", listItem1], ["listItem2", listItem2]])
    });

    it('should serialize a map with references', function() {
      return obj.save({depth: 1}).then(function(obj) {
        return Promise.all([db2.load(obj.testMap.get("listItem1").id), db2.load(obj.id)]);
      }).then(function(loaded) {
        var obj = loaded[1];
        var json = obj.toJSON({depth: 1})
        expect(json).be.ok
        expect(typeof json.testMap['listItem1']).eqls('object')
        expect(typeof json.testMap['listItem2']).eqls('string')
        expect(json.testMap['listItem1'].value).eqls('listItem1')
      })
    })

    it('should create a map with references from json', function() {
      var json = obj.toJSON({depth: 1})
      obj = db.Level1.fromJSON(json)
      return obj.save({depth: 1}).then(function(obj) {
        return db2.Level1.load(obj.id, {depth: 1})
      }).then(function(obj) {
        expect(obj.testMap.get('listItem1')).to.have.property('id');
        expect(obj.testMap.get('listItem2')).to.have.property('id');
      })
    })

    it('should add a newly created object to a map from json', function() {
      obj.save({depth: 1}).then(function(obj) {
        var json = obj.toJSON({depth: 1})
        json.testMap["listItem3"] = listItem3.toJSON();
        obj = db.Level1.fromJSON(json)
        return obj.save({depth: 1}).then(function(obj) {
          return db2.Level1.load(obj.id, {depth: 1})
        })
      }).then(function(obj) {
        expect(obj.testMap.size).eqls(3);
        expect(obj.testMap.get('listItem3')).to.have.property('id');
      })
    })

  })

  describe("Set", function() {
    var obj, listItem1, listItem2, listItem3;
    beforeEach(function() {
      listItem1 = new db.Level2({value: "listItem1"})
      listItem2 = new db.Level2({value: "listItem2"})
      listItem3 = new db.Level2({value: "listItem3"})
      obj = new db.Level1({value: "level1"})
      obj.testSet = new DB.Set([listItem1, listItem2])
    });

    it('should serialize a set with references', function() {
      return obj.save({depth: 1}).then(function(obj) {
        var it = obj.testSet.values()
        var item = it.next().value
        return Promise.all([db2.load(item.id), db2.load(obj.id)]);
      }).then(function(loaded) {
        var obj = loaded[1];
        var json = obj.toJSON({depth: 1})
        expect(json).be.ok
        for (var i = 0; i < json.testSet.length; i++){
          if(typeof json.testSet[i] === 'object')
            expect(json.testSet[i].value).eqls('listItem1')
        }
      })
    })

    it('should create a map with references from json', function() {
      var json = obj.toJSON({depth: 1})
      obj = db.Level1.fromJSON(json)
      return obj.save({depth: 1}).then(function(obj) {
        return db2.Level1.load(obj.id, {depth: 1})
      }).then(function(obj) {
        var it = obj.testSet.values()
        expect(it.next().value).to.have.property('id');
        expect(it.next().value).to.have.property('id');
      })
    })

    it('should add a newly created object to a map from json', function() {
      obj.save({depth: 1}).then(function(obj) {
        var json = obj.toJSON({depth: 1})
        json.testSet.push(listItem3.toJSON());
        obj = db.Level1.fromJSON(json)
        return obj.save({depth: 1}).then(function(obj) {
          return db2.Level1.load(obj.id, {depth: 1})
        })
      }).then(function(obj) {
        expect(obj.testSet.size).eqls(3);
        obj.testSet.forEach(function(item) {
          if (item.value === 'listItem3')
            expect(item).to.have.property('id');
        })
      })
    })

  })

  describe("Embedded", function() {
    var level0, embedded, obj;
    beforeEach(function() {
      level0 = new db.Level0({
        value: "level0"
      });
      embedded = new db.Embedded({
        value: 'embedded',
        level0: level0
      })
      obj = new db.Level2({
        value: "level2",
        embedded: embedded
      })
    });

    it('should serialize a object with embedded json', function() {
      return obj.save({depth: 2}).then(function(obj) {
        return db2.Level2.load(obj.id, {depth: 2})
      }).then(function(obj) {
        var json = obj.toJSON({depth: 2})
        expect(json).be.ok
        expect(json.embedded.value).eqls('embedded')
        expect(json.embedded.level0.value).eqls('level0')
      })
    })

  })

});
