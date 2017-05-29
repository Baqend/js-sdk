var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe("Test metamodel classes", function () {
  var metamodel;

  beforeEach(function() {
    metamodel = new DB.metamodel.Metamodel(null);
  });

  describe("ModelBuilder", function() {
    it("should create basic and object type", function() {
      metamodel.init({});

      expect(metamodel.baseType(DB.metamodel.BasicType.Date.ref)).equals(DB.metamodel.BasicType.Date);
      expect(metamodel.baseType(DB.metamodel.BasicType.DateTime.ref)).equals(DB.metamodel.BasicType.DateTime);
      expect(metamodel.baseType(DB.metamodel.BasicType.Boolean.ref)).equals(DB.metamodel.BasicType.Boolean);
      expect(metamodel.baseType(DB.metamodel.BasicType.Double.ref)).equals(DB.metamodel.BasicType.Double);
      expect(metamodel.baseType(DB.metamodel.BasicType.Integer.ref)).equals(DB.metamodel.BasicType.Integer);
      expect(metamodel.baseType(DB.metamodel.BasicType.String.ref)).equals(DB.metamodel.BasicType.String);
      expect(metamodel.baseType(DB.metamodel.BasicType.Time.ref)).equals(DB.metamodel.BasicType.Time);
      expect(metamodel.baseType(DB.metamodel.BasicType.File.ref)).equals(DB.metamodel.BasicType.File);
      expect(metamodel.baseType(DB.metamodel.BasicType.GeoPoint.ref)).equals(DB.metamodel.BasicType.GeoPoint);
      expect(metamodel.baseType(DB.metamodel.BasicType.JsonArray.ref)).equals(DB.metamodel.BasicType.JsonArray);
      expect(metamodel.baseType(DB.metamodel.BasicType.JsonObject.ref)).equals(DB.metamodel.BasicType.JsonObject);

      expect(metamodel.entity(DB.metamodel.EntityType.Object.ref)).instanceof(DB.metamodel.EntityType.Object);
    });

    it("should build type with attributes", function() {
      var model = {
        "class": "/db/test.OtherPersClass",
        "fields": {
          "value": {
            "name": "value",
            "type": "/db/Integer",
            "order": 0
          }
        }
      };

      metamodel.fromJSON([model]);

      var entity = metamodel.entity("/db/test.OtherPersClass");

      expect(entity).instanceof(DB.metamodel.EntityType);
      expect(entity.ref).equals("/db/test.OtherPersClass");
      expect(entity.superType).equals(metamodel.entity(DB.metamodel.EntityType.Object.ref));

      expect(entity.typeConstructor).be.ok;
      expect(entity.declaredAttributes).length(1);
      expect(entity.declaredAttributes[0]).instanceof(DB.metamodel.SingularAttribute);
      expect(entity.declaredAttributes[0].declaringType).equals(entity);
      expect(entity.declaredAttributes[0].name).equals("value");
      expect(entity.declaredAttributes[0].type).equals(DB.metamodel.BasicType.Integer);
      expect(entity.declaredAttributes[0].typeConstructor).equals(Number);
      expect(entity.declaredAttributes[0].order).equals(0);
    });

    it("should build type with inheritance", function() {
      var model = [
        {
          "class": "/db/test.PersClass",
          "fields": {
            "name": {
              "name": "name",
              "type": "/db/String"
            },
            "ref": {
              "name": "ref",
              "type": "/db/test.ChildPersClass"
            }
          }
        },
        {
          "class": "/db/test.ChildPersClass",
          "superClass": "/db/test.PersClass",
          "fields": {
            "value": {
              "name": "value",
              "type": "/db/Integer"
            }
          }
        }
      ];

      metamodel.fromJSON(model);

      var entity = metamodel.entity("/db/test.PersClass");
      expect(entity).instanceof(DB.metamodel.EntityType);
      expect(entity.ref).equals("/db/test.PersClass");
      expect(entity.superType).equals(metamodel.entity(DB.metamodel.EntityType.Object.ref));
      expect(entity.typeConstructor).be.ok;
      expect(entity.declaredAttributes).length(2);

      var name = entity.getDeclaredAttribute("name");
      expect(entity.getAttribute("name")).equals(name);
      expect(name).instanceof(DB.metamodel.SingularAttribute);
      expect(name.declaringType).equals(entity);
      expect(name.name).equals("name");
      expect(name.type).equals(DB.metamodel.BasicType.String);
      expect(name.typeConstructor).equals(String);

      var ref = entity.getDeclaredAttribute("ref");
      expect(entity.getAttribute("ref")).equals(ref);
      expect(ref).instanceof(DB.metamodel.SingularAttribute);
      expect(ref.declaringType).equals(entity);
      expect(ref.name).equals("ref");
      expect(ref.type).equals(metamodel.entity("/db/test.ChildPersClass"));
      expect(ref.typeConstructor).be.ok;

      expect(entity.getDeclaredAttribute("value")).be.null;
      expect(entity.getAttribute("value")).be.null;

      entity = metamodel.entity("/db/test.ChildPersClass");
      expect(entity).instanceof(DB.metamodel.EntityType);
      expect(entity.ref).equals("/db/test.ChildPersClass");
      expect(entity.superType).equals(metamodel.entity("/db/test.PersClass"));
      expect(entity.typeConstructor).be.ok;
      expect(entity.declaredAttributes).length(1);

      var value = entity.getDeclaredAttribute("value");
      expect(entity.getAttribute("value")).equals(value);
      expect(value).instanceof(DB.metamodel.SingularAttribute);
      expect(value.declaringType).equals(entity);
      expect(value.name).equals("value");
      expect(value.type).equals(DB.metamodel.BasicType.Integer);
      expect(value.typeConstructor).equals(Number);

      expect(entity.getDeclaredAttribute("name")).be.null;
      expect(entity.getAttribute("name")).equals(name);
      expect(entity.getDeclaredAttribute("ref")).be.null;
      expect(entity.getAttribute("ref")).equals(ref);
    });

    it("should build embedded type", function() {
      var model = {
        "class": "/db/test.EmbeddedPersClass",
        "embedded": true,
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/String"
          }
        }
      };

      metamodel.fromJSON([model]);

      var entity = metamodel.embeddable("/db/test.EmbeddedPersClass");
      expect(entity).instanceof(DB.metamodel.EmbeddableType);
      expect(entity.ref).equals("/db/test.EmbeddedPersClass");
      expect(entity.typeConstructor).be.ok;
      expect(entity.declaredAttributes).length(1);
      expect(entity.declaredAttributes[0]).instanceof(DB.metamodel.SingularAttribute);
      expect(entity.declaredAttributes[0].declaringType).equals(entity);
      expect(entity.declaredAttributes[0].name).equals("name");
      expect(entity.declaredAttributes[0].type).equals(DB.metamodel.BasicType.String);
      expect(entity.declaredAttributes[0].typeConstructor).equals(String);
    });

    it("should build model with basic attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/String"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(DB.metamodel.SingularAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.type).equals(DB.metamodel.BasicType.String);
      expect(attr.typeConstructor).equals(String);
      expect(attr.persistentAttributeType).equals(DB.metamodel.Attribute.PersistentAttributeType.BASIC);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.false;
    });

    it("should build model with reference attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/test.TestClass"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(DB.metamodel.SingularAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.type).equals(type);
      expect(attr.typeConstructor).be.ok;
      expect(attr.persistentAttributeType).equals(DB.metamodel.Attribute.PersistentAttributeType.ONE_TO_MANY);
      expect(attr.isAssociation).be.true;
      expect(attr.isCollection).be.false;
    });

    it("should build model with embedded attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "embedded": true,
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/test.TestClass"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.embeddable("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(DB.metamodel.SingularAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.type).equals(type);
      expect(attr.typeConstructor).be.ok;
      expect(attr.persistentAttributeType).equals(DB.metamodel.Attribute.PersistentAttributeType.EMBEDDED);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.false;
    });

    it("should build model with list attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/collection.List[/db/String]"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(DB.metamodel.ListAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.elementType).equals(DB.metamodel.BasicType.String);
      expect(attr.typeConstructor).equals(DB.List);
      expect(attr.persistentAttributeType).equals(DB.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.true;
      expect(attr.collectionType).equals(DB.metamodel.PluralAttribute.CollectionType.LIST);
    });

    it("should build model with set attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/collection.Set[/db/String]"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(DB.metamodel.SetAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.elementType).equals(DB.metamodel.BasicType.String);
      expect(attr.typeConstructor).equals(DB.Set);
      expect(attr.persistentAttributeType).equals(DB.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.true;
      expect(attr.collectionType).equals(DB.metamodel.PluralAttribute.CollectionType.SET);
    });

    it("should build model with map attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/collection.Map[/db/String,/db/Integer]"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(DB.metamodel.MapAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.elementType).equals(DB.metamodel.BasicType.Integer);
      expect(attr.keyType).equals(DB.metamodel.BasicType.String);
      expect(attr.typeConstructor).equals(DB.Map);
      expect(attr.persistentAttributeType).equals(DB.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.true;
      expect(attr.collectionType).equals(DB.metamodel.PluralAttribute.CollectionType.MAP);
    });
  });

  describe("BasicType", function () {
    it("should be accessible by native constructors", function() {
      metamodel.init({});

      expect(metamodel.baseType(Boolean)).equals(DB.metamodel.BasicType.Boolean);
      expect(metamodel.baseType(Number)).equals(DB.metamodel.BasicType.Double);
      expect(metamodel.baseType(String)).equals(DB.metamodel.BasicType.String);
      expect(metamodel.baseType(Date)).equals(DB.metamodel.BasicType.DateTime);
      expect(metamodel.baseType(Object)).equals(DB.metamodel.BasicType.JsonObject);
      expect(metamodel.baseType(Array)).equals(DB.metamodel.BasicType.JsonArray);
      expect(metamodel.baseType(DB.GeoPoint)).equals(DB.metamodel.BasicType.GeoPoint);

      expect(metamodel.entity(Object)).instanceof(DB.metamodel.EntityType.Object);
    });

    it("should be accessible by simple name", function() {
      metamodel.init({});

      expect(metamodel.baseType('Date')).equals(DB.metamodel.BasicType.Date);
      expect(metamodel.baseType('DateTime')).equals(DB.metamodel.BasicType.DateTime);
      expect(metamodel.baseType('Boolean')).equals(DB.metamodel.BasicType.Boolean);
      expect(metamodel.baseType('Double')).equals(DB.metamodel.BasicType.Double);
      expect(metamodel.baseType('Integer')).equals(DB.metamodel.BasicType.Integer);
      expect(metamodel.baseType('String')).equals(DB.metamodel.BasicType.String);
      expect(metamodel.baseType('Time')).equals(DB.metamodel.BasicType.Time);
      expect(metamodel.baseType('File')).equals(DB.metamodel.BasicType.File);
      expect(metamodel.baseType('GeoPoint')).equals(DB.metamodel.BasicType.GeoPoint);
      expect(metamodel.baseType('JsonArray')).equals(DB.metamodel.BasicType.JsonArray);
      expect(metamodel.baseType('JsonObject')).equals(DB.metamodel.BasicType.JsonObject);
    });
  });

  describe("EntityType", function () {
    it("Object should have metadata fields", function () {
      metamodel.init({});

      var entity = metamodel.entity(DB.metamodel.EntityType.Object.ref);
      expect(entity.declaredId).instanceof(DB.metamodel.SingularAttribute);
      expect(entity.declaredId.name).equals("id");
      expect(entity.declaredVersion).instanceof(DB.metamodel.SingularAttribute);
      expect(entity.declaredVersion.name).equals("version");
      expect(entity.declaredAcl).instanceof(DB.metamodel.SingularAttribute);
      expect(entity.declaredAcl.name).equals("acl");

      expect(entity.id).equals(entity.declaredId);
      expect(entity.version).equals(entity.declaredVersion);
      expect(entity.acl).equals(entity.declaredAcl);
    });

    it("Object metadata fields should be iterable", function() {
      metamodel.init({});

      var entity = metamodel.entity(DB.metamodel.EntityType.Object.ref);
      var names = ["id", "version", "acl"];
      var count = 0;
      for (var iter = entity.attributes(), item = iter.next(); !item.done; item = iter.next()) {
        var attr = item.value;
        var index = names.indexOf(attr.name);
        expect(index).equals(attr.order);
        expect(attr).equals(entity.getAttribute(attr.name));
        count++;
      }
      expect(count).equals(3);
    });

    it("attributes should be iterable", function () {
      var model = [
        {
          "class": "/db/test.PersClass",
          "fields": {
            "name": {
              "name": "name",
              "type": "/db/String"
            },
            "ref": {
              "name": "ref",
              "type": "/db/test.ChildPersClass"
            }
          }
        },
        {
          "class": "/db/test.ChildPersClass",
          "superClass": "/db/test.PersClass",
          "fields": {
            "value": {
              "name": "value",
              "type": "/db/Integer"
            }
          }
        }
      ];

      metamodel.fromJSON(model);

      var entity = metamodel.entity("/db/test.ChildPersClass");

      var names = ["id", "version", "acl", "name", "ref", "value"];
      for (var iter = entity.attributes(), item = iter.next(); !item.done; item = iter.next()) {
        var attr = item.value;
        var index = names.indexOf(attr.name);
        expect(index).not.equals(-1);
        expect(attr).equals(entity.getAttribute(attr.name));

        names.splice(index, 1);
      }

      expect(names).length(0);
    });
  });
});

describe('Test Metamodel', function() {
  var metamodel;

  beforeEach(function() {
    var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage});
    metamodel = emf.createMetamodel();
  });

  it('not init twice', function() {
    metamodel.init({});
    expect(metamodel.init.bind(metamodel, {})).throw(Error);
  });

  it("should only be allowed once to load the metamodel", function() {
    return metamodel.load().then(function() {
      expect(function() { metamodel.load() }).throw(Error);
    });
  });

  it("should not be allowed to load after save metamodel", function() {
    metamodel.init({});
    return metamodel.save().then(function() {
      expect(function() { metamodel.load() }).throw(Error);
    });
  });

  it("should block the entityManager when isn't ready", function() {
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    expect(emf.createEntityManager().isReady).be.false;
  });

  it("should not block the entityManager when is ready", function() {
    var emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: {}, tokenStorage: new DB.util.TokenStorage() });
    expect(emf.createEntityManager().isReady).be.true;
  });

  it("should not be allowed to save without initialization", function() {
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);

    return expect(function() {
      emf.metamodel.save()
    }).throw('Metamodel is not initialized.');
  });

  it("should allow modification when used by an EntityManager", function() {
    var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage });
    var em = emf.createEntityManager();

    return emf.ready().then(function() {
      return emf.metamodel.save();
    });
  });

  it('should update schema', function() {
    var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: new DB.util.TokenStorage()});
    var db = emf.createEntityManager(true);
    var metamodel = db.metamodel;
    var SchemaUpdatePerson = helper.randomize('SchemaUpdatePerson');
    var initialType;

    return  db.ready().then(function() {
      return db.login('root', 'root');
    }).then(function() {
      var type = new DB.metamodel.EntityType(SchemaUpdatePerson, metamodel.entity(Object));
      metamodel.addType(type);

      type.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
      type.addAttribute(new DB.metamodel.SingularAttribute("street", metamodel.baseType(String)));
      type.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType('Integer')));

      initialType = type.toJSON();

      return metamodel.update(initialType);
    }).then(function() {
      var UpdatePerson = metamodel.entity(SchemaUpdatePerson);
      var renameField = {
        operation: 'renameField',
        bucket: UpdatePerson.ref,
        from: 'name',
        to: 'lastName'
      };
      var addField = {
        operation: 'addField',
        bucket: UpdatePerson.ref,
        field: {
          name: "firstName",
          type: "/db/String",
          order: 2
        }
      };

      return metamodel.update(renameField).then(function() {
      }).then(function() {
        return metamodel.update(addField);
      });
    }).then(function() {
      var newPerson = metamodel.entity(SchemaUpdatePerson);
      expect(newPerson.getDeclaredAttribute("firstName")).be.ok;
      expect(newPerson.getDeclaredAttribute("firstName").type).equals(metamodel.baseType(String));

      expect(newPerson.getDeclaredAttribute("lastName")).be.ok;
      expect(newPerson.getDeclaredAttribute("lastName").type).equals(metamodel.baseType(String));
    });
  });

  it('should handle metadata on classes', function() {
    const model = {
      "class": "/db/test.OtherPersClass",
      "metadata": {
        "hello": "world"
      },
      "fields": {
        "value": {
          "name": "value",
          "type": "/db/Integer",
          "order": 0
        }
      }
    };

    metamodel.fromJSON([model]);

    const entity = metamodel.entity("/db/test.OtherPersClass");

    expect(entity).instanceof(DB.metamodel.EntityType);
    expect(entity.metadata).deep.equals({
      "hello": "world"
    });
    expect(entity.hasMetadata('hello')).be.true;
    expect(entity.getMetadata('hello')).equals('world');
    expect(entity.hasMetadata('notexisting')).be.false;
    expect(entity.getMetadata('notexisting')).be.null;

  });

  it('should handle metadata on fields', function() {
    const model = {
      "class": "/db/test.OtherPersClass",
      "fields": {
        "value": {
          "name": "value",
          "type": "/db/Integer",
          "order": 0,
          "metadata": {
            "hello": "world"
          }
        }
      }
    };

    metamodel.fromJSON([model]);

    const entity = metamodel.entity("/db/test.OtherPersClass");

    expect(entity).instanceof(DB.metamodel.EntityType);
    expect(entity.getDeclaredAttribute('value').metadata).deep.equals({
      "hello": "world"
    });
    expect(entity.getDeclaredAttribute('value').hasMetadata('hello')).be.true;
    expect(entity.getDeclaredAttribute('value').getMetadata('hello')).equals('world');
    expect(entity.getDeclaredAttribute('value').hasMetadata('notexisting')).be.false;
    expect(entity.getDeclaredAttribute('value').getMetadata('notexisting')).be.null;

  });

  describe("Testmodel", function() {
    var type, childType, embeddedType, metamodel;

    before(function() {
      var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage});
      metamodel = emf.metamodel;
      metamodel.init({});
      metamodel.addType(type = new DB.metamodel.EntityType("jstest.Person", metamodel.entity(Object)));
      metamodel.addType(childType = new DB.metamodel.EntityType("jstest.ChildPerson", type));
      metamodel.addType(embeddedType = new DB.metamodel.EmbeddableType("jstest.EmbeddedPerson"));

      type.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
      type.addAttribute(new DB.metamodel.SingularAttribute("ref", type));
      type.addAttribute(new DB.metamodel.SingularAttribute("date", metamodel.baseType(Date)));
      type.addAttribute(new DB.metamodel.ListAttribute("list", metamodel.baseType('String')));
      type.addAttribute(new DB.metamodel.SetAttribute("set", metamodel.baseType('Integer')));
      type.addAttribute(new DB.metamodel.MapAttribute("map", metamodel.baseType('String'), type));
      type.addAttribute(new DB.metamodel.SingularAttribute("removeMe", metamodel.baseType('String')));

      childType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType('Integer')));

      embeddedType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
      embeddedType.addAttribute(new DB.metamodel.SingularAttribute("ref", type));

      return metamodel.save();
    });

    it('should be available', function() {
      var loadType = metamodel.entity("jstest.Person");
      var loadChildType = metamodel.entity("jstest.ChildPerson");
      var loadEmbeddedType = metamodel.embeddable("jstest.EmbeddedPerson");

      expect(loadType).equals(type);
      expect(loadChildType).equals(childType);
      expect(loadEmbeddedType).equals(embeddedType);

      testLoadedTypes(loadType, loadChildType, loadEmbeddedType, metamodel);
    });

    it('should be loadable', function() {
      var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER});
      var model = emf.createMetamodel();

      return model.load().then(function() {
        var loadType = model.entity("jstest.Person");
        var loadChildType = model.entity("jstest.ChildPerson");
        var loadEmbeddedType = model.embeddable("jstest.EmbeddedPerson");

        expect(loadType).not.equals(type);
        expect(loadChildType).not.equals(childType);
        expect(loadEmbeddedType).not.equals(embeddedType);

        testLoadedTypes(loadType, loadChildType, loadEmbeddedType, model);
      });
    });

    it('should be accessible via db', function() {
      var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, staleness: 0});

      return emf.createEntityManager().ready().then(function(db) {
        var loadType = db.metamodel.entity("jstest.Person");
        var loadChildType = db.metamodel.entity("jstest.ChildPerson");
        var loadEmbeddedType = db.metamodel.embeddable("jstest.EmbeddedPerson");

        expect(loadType).not.equals(type);
        expect(loadChildType).not.equals(childType);
        expect(loadEmbeddedType).not.equals(embeddedType);

        testLoadedTypes(loadType, loadChildType, loadEmbeddedType, db.metamodel);
      });
    });

    it('should be allowed to remove attributes', function() {
      expect(function() {type.removeAttribute('removeMeNot')}).to.throw(Error);
      expect(type.getAttribute('removeMe')).to.be.ok;
      type.removeAttribute('removeMe');
      expect(type.getAttribute('removeMe')).to.be.null;
      type.addAttribute(new DB.metamodel.SingularAttribute("removeMe", metamodel.baseType('String')));
    });
  });

  function testLoadedTypes(loadType, loadChildType, loadEmbeddedType, metamodel) {
    expect(loadType).be.ok;
    expect(loadType).instanceof(DB.metamodel.EntityType);
    expect(loadType.ref).equals('/db/jstest.Person');
    expect(loadType.superType).equals(metamodel.entity(Object));
    expect(loadType.declaredAttributes).length(7);

    expect(loadChildType).be.ok;
    expect(loadChildType).instanceof(DB.metamodel.EntityType);
    expect(loadChildType.ref).equals('/db/jstest.ChildPerson');
    expect(loadChildType.superType).equals(loadType);
    expect(loadChildType.declaredAttributes).length(1);

    expect(loadEmbeddedType).be.ok;
    expect(loadEmbeddedType).instanceof(DB.metamodel.EmbeddableType);
    expect(loadEmbeddedType.ref).equals('/db/jstest.EmbeddedPerson');
    expect(loadEmbeddedType.declaredAttributes).length(2);

    expect(loadType.getDeclaredAttribute('name')).instanceof(DB.metamodel.SingularAttribute);
    expect(loadType.getDeclaredAttribute('name').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('name').name).equals('name');
    expect(loadType.getDeclaredAttribute('name').type).equals(metamodel.baseType(String));

    expect(loadType.getDeclaredAttribute('ref')).instanceof(DB.metamodel.SingularAttribute);
    expect(loadType.getDeclaredAttribute('ref').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('ref').name).equals('ref');
    expect(loadType.getDeclaredAttribute('ref').type).equals(loadType);

    expect(loadType.getDeclaredAttribute('date')).instanceof(DB.metamodel.SingularAttribute);
    expect(loadType.getDeclaredAttribute('date').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('date').name).equals('date');
    expect(loadType.getDeclaredAttribute('date').type).equals(metamodel.baseType(Date));

    expect(loadType.getDeclaredAttribute('list')).instanceof(DB.metamodel.ListAttribute);
    expect(loadType.getDeclaredAttribute('list').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('list').name).equals('list');
    expect(loadType.getDeclaredAttribute('list').elementType).equals(metamodel.baseType('String'));

    expect(loadType.getDeclaredAttribute('set')).instanceof(DB.metamodel.SetAttribute);
    expect(loadType.getDeclaredAttribute('set').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('set').name).equals('set');
    expect(loadType.getDeclaredAttribute('set').elementType).equals(metamodel.baseType('Integer'));

    expect(loadType.getDeclaredAttribute('map')).instanceof(DB.metamodel.MapAttribute);
    expect(loadType.getDeclaredAttribute('map').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('map').name).equals('map');
    expect(loadType.getDeclaredAttribute('map').keyType).equals(metamodel.baseType('String'));
    expect(loadType.getDeclaredAttribute('map').elementType).equals(loadType);


    expect(loadChildType.getDeclaredAttribute('age')).instanceof(DB.metamodel.SingularAttribute);
    expect(loadChildType.getDeclaredAttribute('age').declaringType).equals(loadChildType);
    expect(loadChildType.getDeclaredAttribute('age').name).equals('age');
    expect(loadChildType.getDeclaredAttribute('age').type).equals(metamodel.baseType('Integer'));


    expect(loadEmbeddedType.getDeclaredAttribute('age')).instanceof(DB.metamodel.SingularAttribute);
    expect(loadEmbeddedType.getDeclaredAttribute('age').declaringType).equals(loadEmbeddedType);
    expect(loadEmbeddedType.getDeclaredAttribute('age').name).equals('age');
    expect(loadEmbeddedType.getDeclaredAttribute('age').type).equals(metamodel.baseType('Double'));

    expect(loadEmbeddedType.getDeclaredAttribute('ref')).instanceof(DB.metamodel.SingularAttribute);
    expect(loadEmbeddedType.getDeclaredAttribute('ref').declaringType).equals(loadEmbeddedType);
    expect(loadEmbeddedType.getDeclaredAttribute('ref').name).equals('ref');
    expect(loadEmbeddedType.getDeclaredAttribute('ref').type).equals(loadType);
  }

  describe('Acl', function() {
    var db, emf, obj, user1, user2, user3, initialType, initialEmbeddedType;

    var SchemaAclPersonName = helper.randomize('SchemaAclPerson');
    var SchemaAclEmbeddedPersonName = helper.randomize('SchemaAclEmbeddedPerson');

    function createUser(emf, username) {
      return emf.createEntityManager().ready().then(function(db) {
        return db.User.register(username, 'secret', db.User.LoginOption.NO_LOGIN);
      });
    }

    before(function() {
      var staticEmf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage});

      return Promise.all([
        createUser(staticEmf, helper.makeLogin()),
        createUser(staticEmf, helper.makeLogin()),
        createUser(staticEmf, helper.makeLogin())
      ]).then(function(users) {
        user1 = users[0];
        user2 = users[1];
        user3 = users[2];

        var metamodel = staticEmf.createMetamodel();
        metamodel.init({});

        var type, embeddedType;
        metamodel.addType(type = new DB.metamodel.EntityType(SchemaAclPersonName, metamodel.entity(Object)));
        metamodel.addType(embeddedType = new DB.metamodel.EmbeddableType(SchemaAclEmbeddedPersonName));

        type.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
        embeddedType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));

        type.insertPermission.denyAccess(user2);
        type.updatePermission.denyAccess(user2).denyAccess(user3);
        type.deletePermission.denyAccess(user2).denyAccess(user3).allowAccess(user1);
        type.queryPermission.allowAccess(user2);
        type.schemaSubclassPermission.allowAccess(user1).allowAccess(user3);
        type.schemaAddPermission.allowAccess(user1);
        type.schemaReplacePermission.allowAccess(user1);

        embeddedType.schemaAddPermission.allowAccess(user1);
        embeddedType.schemaReplacePermission.allowAccess(user1);

        return metamodel.save();
      }).then(function() {
        emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, staleness: 0});
        //db and emf shares the same login credentials
        db = emf.createEntityManager(true);
        return db.ready().then(function() {
          obj = new db[SchemaAclPersonName]();
          return obj.insert();
        });
      });
    });

    it('should convert acls', function() {
      var metamodel = emf.createMetamodel();
      return metamodel.load().then(function() {
        var AclPerson = metamodel.entity(SchemaAclPersonName);

        expect(AclPerson.insertPermission.isDenied(user2)).be.true;
        expect(AclPerson.updatePermission.isDenied(user2)).be.true;
        expect(AclPerson.deletePermission.isDenied(user2)).be.true;
        expect(AclPerson.queryPermission.isAllowed(user2)).be.true;
        expect(AclPerson.schemaSubclassPermission.isAllowed(user1)).be.true;
        expect(AclPerson.schemaAddPermission.isAllowed(user1)).be.true;
        expect(AclPerson.schemaReplacePermission.isAllowed(user1)).be.true;

        var EmbeddableType = metamodel.embeddable(SchemaAclEmbeddedPersonName);
        expect(EmbeddableType.schemaAddPermission.isAllowed(user1)).be.true;
        expect(EmbeddableType.schemaReplacePermission.isAllowed(user1)).be.true;
      });
    });

    describe('for user1', function() {
      var metamodel;
      before(function() {
        return db.User.login(user1.username, 'secret');
      });

      after(function() {
        return db.User.logout();
      });

      beforeEach(function() {
        metamodel = emf.createMetamodel();
      });

      it('should allow schema load', function() {
        return metamodel.load().then(function() {
          expect(metamodel.entity(SchemaAclPersonName)).be.ok;
          expect(metamodel.embeddable(SchemaAclEmbeddedPersonName)).be.ok;
        });
      });

      it('should deny schema add', function() {
        return metamodel.load().then(function() {
          return expect(metamodel.save()).be.rejected;
        });
      });

      it('should allow schema subclassing', function() {
        return metamodel.load().then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);

          var child = new DB.metamodel.EntityType(helper.randomize("SchemaAclChildPerson"), AclPerson);
          child.schemaReplacePermission.allowAccess(db.User.me);
          metamodel.addType(child);

          return expect(metamodel.save(child)).be.fulfilled;
        });
      });

      it('should allow object load', function() {
        return expect(db[SchemaAclPersonName].load(obj.id)).be.fulfilled;
      });

      it('should allow object creation', function() {
        return expect(new db[SchemaAclPersonName]().insert()).be.fulfilled;
      });

      it('should allow object update', function() {
        return new db[SchemaAclPersonName]().insert().then(function(obj) {
          return expect(obj.save()).be.fulfilled;
        });
      });

      it('should allow object removal', function() {
        return new db[SchemaAclPersonName]().insert().then(function(obj) {
          return expect(obj.delete()).be.fulfilled;
        });
      });
    });

    describe('for user2', function() {
      var metamodel;
      before(function() {
        return db.User.login(user2.username, 'secret');
      });

      after(function() {
        return db.User.logout();
      });

      beforeEach(function() {
        metamodel = emf.createMetamodel();
      });

      it('should allow schema load', function() {
        return metamodel.load().then(function() {
          expect(metamodel.entity(SchemaAclPersonName)).be.ok;
          expect(metamodel.embeddable(SchemaAclEmbeddedPersonName)).be.ok;
        });
      });

      it('should deny schema add', function() {
        return metamodel.load().then(function() {
          return expect(metamodel.save()).be.rejected;
        });
      });

      it('should deny schema subclassing', function() {
        return metamodel.load().then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);

          var rnd = Math.floor(Math.random() * 1000000);
          var child = new DB.metamodel.EntityType("SchemaAclChildPerson" + rnd, AclPerson);
          child.schemaReplacePermission.allowAccess(db.User.me);
          metamodel.addType(child);

          return expect(metamodel.save(child)).be.rejected;
        });
      });

      it('should allow object load', function() {
        return expect(db[SchemaAclPersonName].load(obj.id)).be.fulfilled;
      });

      it('should deny object creation', function() {
        return expect(new db[SchemaAclPersonName]().insert()).be.rejected;
      });

      it('should deny object update', function() {
        return db[SchemaAclPersonName].load(obj.id).then(function(obj) {
          obj.name = 'New Name';
          return expect(obj.save()).be.rejected;
        });
      });

      it('should deny object removal', function() {
        return db[SchemaAclPersonName].load(obj.id).then(function(obj) {
          return expect(obj.delete()).be.rejected;
        });
      });
    });

    describe('for user3', function() {
      var metamodel;
      before(function() {
        return db.User.login(user3.username, 'secret');
      });

      after(function() {
        return db.User.logout();
      });

      beforeEach(function() {
        metamodel = emf.createMetamodel();
      });

      it('should allow schema load', function() {
        return metamodel.load().then(function() {
          expect(metamodel.entity(SchemaAclPersonName)).be.ok;
          expect(metamodel.embeddable(SchemaAclEmbeddedPersonName)).be.ok;
        });
      });

      it('should deny schema add', function() {
        return metamodel.load().then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);
          return expect(metamodel.save(AclPerson)).be.rejected;
        });
      });

      it('should deny schema replace', function() {
        return metamodel.load().then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);
          var json = AclPerson.toJSON();
          json.operation = 'replaceClass';
          return expect(metamodel.update(json)).be.rejected;
        });
      });

      it('should allow schema subclassing', function() {
        return metamodel.load().then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);

          var rnd = Math.floor(Math.random() * 1000000);
          var child = new DB.metamodel.EntityType("SchemaAclChildPerson" + rnd, AclPerson);
          child.schemaReplacePermission.allowAccess(db.User.me);
          metamodel.addType(child);

          return expect(metamodel.save(child)).be.fulfilled;
        });
      });

      it('should allow object load', function() {
        return expect(db[SchemaAclPersonName].load(obj.id)).be.fulfilled;
      });

      it('should allow object creation', function() {
        return expect(new db[SchemaAclPersonName]().insert()).be.fulfilled;
      });

      it('should deny object update', function() {
        return db[SchemaAclPersonName].load(obj.id).then(function(obj) {
          obj.name = 'New Name';
          return expect(obj.save()).be.rejected;
        });
      });

      it('should deny object removal', function() {
        return db[SchemaAclPersonName].load(obj.id).then(function(obj) {
          return expect(obj.delete()).be.rejected;
        });
      });
    });
  });
});
