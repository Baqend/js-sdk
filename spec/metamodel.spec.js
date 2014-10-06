if (typeof jspa == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  expect = chai.expect;
  jspa = require('../lib');
}

describe("Test metamodel classes", function () {
  var metamodel;

  beforeEach(function() {
    metamodel = new jspa.metamodel.Metamodel(null);
  });

  describe("ModelBuilder", function() {
    it("should create basic and object type", function() {
      metamodel.init();

      expect(metamodel.baseType(jspa.metamodel.BasicType.Date.ref)).equals(jspa.metamodel.BasicType.Date);
      expect(metamodel.baseType(jspa.metamodel.BasicType.DateTime.ref)).equals(jspa.metamodel.BasicType.DateTime);
      expect(metamodel.baseType(jspa.metamodel.BasicType.Boolean.ref)).equals(jspa.metamodel.BasicType.Boolean);
      expect(metamodel.baseType(jspa.metamodel.BasicType.Float.ref)).equals(jspa.metamodel.BasicType.Float);
      expect(metamodel.baseType(jspa.metamodel.BasicType.Integer.ref)).equals(jspa.metamodel.BasicType.Integer);
      expect(metamodel.baseType(jspa.metamodel.BasicType.String.ref)).equals(jspa.metamodel.BasicType.String);
      expect(metamodel.baseType(jspa.metamodel.BasicType.Time.ref)).equals(jspa.metamodel.BasicType.Time);
      expect(metamodel.baseType(jspa.metamodel.BasicType.GeoPoint.ref)).equals(jspa.metamodel.BasicType.GeoPoint);
      expect(metamodel.baseType(jspa.metamodel.BasicType.JsonArray.ref)).equals(jspa.metamodel.BasicType.JsonArray);
      expect(metamodel.baseType(jspa.metamodel.BasicType.JsonObject.ref)).equals(jspa.metamodel.BasicType.JsonObject);

      expect(metamodel.entity(jspa.metamodel.EntityType.Object.ref)).instanceof(jspa.metamodel.EntityType.Object);
    });

    it("should build type with attributes", function() {
      var model = {
        "class": "/db/test.OtherPersClass",
        "fields": {
          "value": {
            "name": "value",
            "type": "/db/_native.Integer"
          }
        }
      };

      metamodel.fromJSON([model]);

      var entity = metamodel.entity("/db/test.OtherPersClass");

      expect(entity).instanceof(jspa.metamodel.EntityType);
      expect(entity.ref).equals("/db/test.OtherPersClass");
      expect(entity.superType).equals(metamodel.entity(jspa.metamodel.EntityType.Object.ref));

      expect(entity.typeConstructor).be.ok;
      expect(entity.declaredAttributes).length(1);
      expect(entity.declaredAttributes[0]).instanceof(jspa.metamodel.SingularAttribute);
      expect(entity.declaredAttributes[0].declaringType).equals(entity);
      expect(entity.declaredAttributes[0].name).equals("value");
      expect(entity.declaredAttributes[0].type).equals(jspa.metamodel.BasicType.Integer);
      expect(entity.declaredAttributes[0].typeConstructor).equals(Number);
    });

    it("should build type with inheritance", function() {
      var model = [
        {
          "class": "/db/test.PersClass",
          "fields": {
            "name": {
              "name": "name",
              "type": "/db/_native.String"
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
              "type": "/db/_native.Integer"
            }
          }
        }
      ];

      metamodel.fromJSON(model);

      var entity = metamodel.entity("/db/test.PersClass");
      expect(entity).instanceof(jspa.metamodel.EntityType);
      expect(entity.ref).equals("/db/test.PersClass");
      expect(entity.superType).equals(metamodel.entity(jspa.metamodel.EntityType.Object.ref));
      expect(entity.typeConstructor).be.ok;
      expect(entity.declaredAttributes).length(2);

      var name = entity.getDeclaredAttribute("name");
      expect(entity.getAttribute("name")).equals(name);
      expect(name).instanceof(jspa.metamodel.SingularAttribute);
      expect(name.declaringType).equals(entity);
      expect(name.name).equals("name");
      expect(name.type).equals(jspa.metamodel.BasicType.String);
      expect(name.typeConstructor).equals(String);

      var ref = entity.getDeclaredAttribute("ref");
      expect(entity.getAttribute("ref")).equals(ref);
      expect(ref).instanceof(jspa.metamodel.SingularAttribute);
      expect(ref.declaringType).equals(entity);
      expect(ref.name).equals("ref");
      expect(ref.type).equals(metamodel.entity("/db/test.ChildPersClass"));
      expect(ref.typeConstructor).be.ok;

      expect(entity.getDeclaredAttribute("value")).be.null;
      expect(entity.getAttribute("value")).be.null;

      entity = metamodel.entity("/db/test.ChildPersClass");
      expect(entity).instanceof(jspa.metamodel.EntityType);
      expect(entity.ref).equals("/db/test.ChildPersClass");
      expect(entity.superType).equals(metamodel.entity("/db/test.PersClass"));
      expect(entity.typeConstructor).be.ok;
      expect(entity.declaredAttributes).length(1);

      var value = entity.getDeclaredAttribute("value");
      expect(entity.getAttribute("value")).equals(value);
      expect(value).instanceof(jspa.metamodel.SingularAttribute);
      expect(value.declaringType).equals(entity);
      expect(value.name).equals("value");
      expect(value.type).equals(jspa.metamodel.BasicType.Integer);
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
            "type": "/db/_native.String"
          }
        }
      };

      metamodel.fromJSON([model]);

      var entity = metamodel.embeddable("/db/test.EmbeddedPersClass");
      expect(entity).instanceof(jspa.metamodel.EmbeddableType);
      expect(entity.ref).equals("/db/test.EmbeddedPersClass");
      expect(entity.typeConstructor).be.ok;
      expect(entity.declaredAttributes).length(1);
      expect(entity.declaredAttributes[0]).instanceof(jspa.metamodel.SingularAttribute);
      expect(entity.declaredAttributes[0].declaringType).equals(entity);
      expect(entity.declaredAttributes[0].name).equals("name");
      expect(entity.declaredAttributes[0].type).equals(jspa.metamodel.BasicType.String);
      expect(entity.declaredAttributes[0].typeConstructor).equals(String);
    });

    it("should build model with basic attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/_native.String"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(jspa.metamodel.SingularAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.type).equals(jspa.metamodel.BasicType.String);
      expect(attr.typeConstructor).equals(String);
      expect(attr.persistentAttributeType).equals(jspa.metamodel.Attribute.PersistentAttributeType.BASIC);
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
      expect(attr).instanceof(jspa.metamodel.SingularAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.type).equals(type);
      expect(attr.typeConstructor).be.ok;
      expect(attr.persistentAttributeType).equals(jspa.metamodel.Attribute.PersistentAttributeType.ONE_TO_MANY);
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
      expect(attr).instanceof(jspa.metamodel.SingularAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.type).equals(type);
      expect(attr.typeConstructor).be.ok;
      expect(attr.persistentAttributeType).equals(jspa.metamodel.Attribute.PersistentAttributeType.EMBEDDED);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.false;
    });

    it("should build model with list attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/_native.collection.List[/db/_native.String]"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(jspa.metamodel.ListAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.elementType).equals(jspa.metamodel.BasicType.String);
      expect(attr.typeConstructor).equals(jspa.List);
      expect(attr.persistentAttributeType).equals(jspa.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.true;
      expect(attr.collectionType).equals(jspa.metamodel.PluralAttribute.CollectionType.LIST);
    });

    it("should build model with set attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/_native.collection.Set[/db/_native.String]"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(jspa.metamodel.SetAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.elementType).equals(jspa.metamodel.BasicType.String);
      expect(attr.typeConstructor).equals(jspa.Set);
      expect(attr.persistentAttributeType).equals(jspa.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.true;
      expect(attr.collectionType).equals(jspa.metamodel.PluralAttribute.CollectionType.SET);
    });

    it("should build model with map attribute", function() {
      var model = {
        "class": "/db/test.TestClass",
        "fields": {
          "name": {
            "name": "name",
            "type": "/db/_native.collection.Map[/db/_native.String,/db/_native.Integer]"
          }
        }
      };

      metamodel.fromJSON([model]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceof(jspa.metamodel.MapAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.elementType).equals(jspa.metamodel.BasicType.Integer);
      expect(attr.keyType).equals(jspa.metamodel.BasicType.String);
      expect(attr.typeConstructor).equals(jspa.Map);
      expect(attr.persistentAttributeType).equals(jspa.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.true;
      expect(attr.collectionType).equals(jspa.metamodel.PluralAttribute.CollectionType.MAP);
    });
  });

  describe("BasicType", function () {
    it("should be accessible by native constructors", function() {
      metamodel.init();

      expect(metamodel.baseType(Boolean)).equals(jspa.metamodel.BasicType.Boolean);
      expect(metamodel.baseType(Number)).equals(jspa.metamodel.BasicType.Float);
      expect(metamodel.baseType(String)).equals(jspa.metamodel.BasicType.String);
      expect(metamodel.baseType(Date)).equals(jspa.metamodel.BasicType.DateTime);
      expect(metamodel.baseType(Object)).equals(jspa.metamodel.BasicType.JsonObject);
      expect(metamodel.baseType(Array)).equals(jspa.metamodel.BasicType.JsonArray);
      expect(metamodel.baseType(jspa.GeoPoint)).equals(jspa.metamodel.BasicType.GeoPoint);

      expect(metamodel.entity(Object)).instanceof(jspa.metamodel.EntityType.Object);
    });

    it("should be accessible by simple name", function() {
      metamodel.init();

      expect(metamodel.baseType('Date')).equals(jspa.metamodel.BasicType.Date);
      expect(metamodel.baseType('DateTime')).equals(jspa.metamodel.BasicType.DateTime);
      expect(metamodel.baseType('Boolean')).equals(jspa.metamodel.BasicType.Boolean);
      expect(metamodel.baseType('Float')).equals(jspa.metamodel.BasicType.Float);
      expect(metamodel.baseType('Integer')).equals(jspa.metamodel.BasicType.Integer);
      expect(metamodel.baseType('String')).equals(jspa.metamodel.BasicType.String);
      expect(metamodel.baseType('Time')).equals(jspa.metamodel.BasicType.Time);
      expect(metamodel.baseType('GeoPoint')).equals(jspa.metamodel.BasicType.GeoPoint);
      expect(metamodel.baseType('JsonArray')).equals(jspa.metamodel.BasicType.JsonArray);
      expect(metamodel.baseType('JsonObject')).equals(jspa.metamodel.BasicType.JsonObject);
    });
  });

  describe("EntityType", function () {
    it("Object should have an id and version field", function () {
      metamodel.init();

      var entity = metamodel.entity(jspa.metamodel.EntityType.Object.ref);
      expect(entity.declaredId).instanceof(jspa.metamodel.SingularAttribute);
      expect(entity.declaredId.name).equals("id");
      expect(entity.declaredVersion).instanceof(jspa.metamodel.SingularAttribute);
      expect(entity.declaredVersion.name).equals("version");

      expect(entity.id).equals(entity.declaredId);
      expect(entity.version).equals(entity.declaredVersion);
    });

    it("attributes should be iterable", function () {
      var model = [
        {
          "class": "/db/test.PersClass",
          "fields": {
            "name": {
              "name": "name",
              "type": "/db/_native.String"
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
              "type": "/db/_native.Integer"
            }
          }
        }
      ];

      metamodel.fromJSON(model);

      var entity = metamodel.entity("/db/test.ChildPersClass");

      var names = ["name", "ref", "value"];
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
    metamodel = new jspa.metamodel.Metamodel(jspa.connector.Connector.create(env.TEST_SERVER));
  });

  it('not init twice', function() {
    metamodel.init();
    expect(metamodel.init.bind(metamodel)).throw(Error);
  });

  it("should only be allowed once to load the metamodel", function() {
    return metamodel.load().then(function() {
      expect(function() { metamodel.load() }).throw(Error);
    });
  });

  it("should not be allowed to load after save metamodel", function() {
    return metamodel.save().then(function() {
      expect(function() { metamodel.load() }).throw(Error);
    });
  });

  it("should not be allowed to load when used by an EntityManager", function() {
    var emf = new jspa.EntityManagerFactory(env.TEST_SERVER);
    return emf.createEntityManager().then(function(em) {
      expect(function() { em.metamodel.load(); }).throw(Error);
    });
  });

  it("should not be allowed to save when used by an EntityManager", function() {
    var emf = new jspa.EntityManagerFactory(env.TEST_SERVER);
    return emf.createEntityManager().then(function(em) {
      expect(function() { em.metamodel.save(); }).throw(Error);
    });
  });

  describe("Testmodel", function() {
    var type, childType, embeddedType, metamodel;

    before(function() {
      metamodel = new jspa.metamodel.Metamodel(jspa.connector.Connector.create(env.TEST_SERVER));
      metamodel.init();
      metamodel.addType(type = new jspa.metamodel.EntityType("jstest.Person", metamodel.entity(Object)));
      metamodel.addType(childType = new jspa.metamodel.EntityType("jstest.ChildPerson", type));
      metamodel.addType(embeddedType = new jspa.metamodel.EmbeddableType("jstest.EmbeddedPerson"));

      type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(type, "name", metamodel.baseType(String)));
      type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(type, "ref", type));
      type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(type, "date", metamodel.baseType(Date)));
      type.declaredAttributes.push(new jspa.metamodel.ListAttribute(type, "list", metamodel.baseType('String')));
      type.declaredAttributes.push(new jspa.metamodel.SetAttribute(type, "set", metamodel.baseType('Integer')));
      type.declaredAttributes.push(new jspa.metamodel.MapAttribute(type, "map", metamodel.baseType('String'), type));

      childType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(childType, "age", metamodel.baseType('Integer')));

      embeddedType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(embeddedType, "age", metamodel.baseType(Number)));
      embeddedType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(embeddedType, "ref", type));

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
      var model = new jspa.metamodel.Metamodel(jspa.connector.Connector.create(env.TEST_SERVER));

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

    it('should be accessable vie db', function() {
      var emf = new jspa.EntityManagerFactory(env.TEST_SERVER);

      return emf.createEntityManager().then(function(db) {
        var loadType = db.metamodel.entity("jstest.Person");
        var loadChildType = db.metamodel.entity("jstest.ChildPerson");
        var loadEmbeddedType = db.metamodel.embeddable("jstest.EmbeddedPerson");

        expect(loadType).not.equals(type);
        expect(loadChildType).not.equals(childType);
        expect(loadEmbeddedType).not.equals(embeddedType);

        testLoadedTypes(loadType, loadChildType, loadEmbeddedType, db.metamodel);
      });
    });
  });

  function testLoadedTypes(loadType, loadChildType, loadEmbeddedType, metamodel) {
    expect(loadType).be.ok;
    expect(loadType).instanceof(jspa.metamodel.EntityType);
    expect(loadType.ref).equals('/db/jstest.Person');
    expect(loadType.superType).equals(metamodel.entity(Object));
    expect(loadType.declaredAttributes).length(6);

    expect(loadChildType).be.ok;
    expect(loadChildType).instanceof(jspa.metamodel.EntityType);
    expect(loadChildType.ref).equals('/db/jstest.ChildPerson');
    expect(loadChildType.superType).equals(loadType);
    expect(loadChildType.declaredAttributes).length(1);

    expect(loadEmbeddedType).be.ok;
    expect(loadEmbeddedType).instanceof(jspa.metamodel.EmbeddableType);
    expect(loadEmbeddedType.ref).equals('/db/jstest.EmbeddedPerson');
    expect(loadEmbeddedType.declaredAttributes).length(2);

    expect(loadType.getDeclaredAttribute('name')).instanceof(jspa.metamodel.SingularAttribute);
    expect(loadType.getDeclaredAttribute('name').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('name').name).equals('name');
    expect(loadType.getDeclaredAttribute('name').type).equals(metamodel.baseType(String));

    expect(loadType.getDeclaredAttribute('ref')).instanceof(jspa.metamodel.SingularAttribute);
    expect(loadType.getDeclaredAttribute('ref').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('ref').name).equals('ref');
    expect(loadType.getDeclaredAttribute('ref').type).equals(loadType);

    expect(loadType.getDeclaredAttribute('date')).instanceof(jspa.metamodel.SingularAttribute);
    expect(loadType.getDeclaredAttribute('date').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('date').name).equals('date');
    expect(loadType.getDeclaredAttribute('date').type).equals(metamodel.baseType(Date));

    expect(loadType.getDeclaredAttribute('list')).instanceof(jspa.metamodel.ListAttribute);
    expect(loadType.getDeclaredAttribute('list').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('list').name).equals('list');
    expect(loadType.getDeclaredAttribute('list').elementType).equals(metamodel.baseType('String'));

    expect(loadType.getDeclaredAttribute('set')).instanceof(jspa.metamodel.SetAttribute);
    expect(loadType.getDeclaredAttribute('set').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('set').name).equals('set');
    expect(loadType.getDeclaredAttribute('set').elementType).equals(metamodel.baseType('Integer'));

    expect(loadType.getDeclaredAttribute('map')).instanceof(jspa.metamodel.MapAttribute);
    expect(loadType.getDeclaredAttribute('map').declaringType).equals(loadType);
    expect(loadType.getDeclaredAttribute('map').name).equals('map');
    expect(loadType.getDeclaredAttribute('map').keyType).equals(metamodel.baseType('String'));
    expect(loadType.getDeclaredAttribute('map').elementType).equals(loadType);


    expect(loadChildType.getDeclaredAttribute('age')).instanceof(jspa.metamodel.SingularAttribute);
    expect(loadChildType.getDeclaredAttribute('age').declaringType).equals(loadChildType);
    expect(loadChildType.getDeclaredAttribute('age').name).equals('age');
    expect(loadChildType.getDeclaredAttribute('age').type).equals(metamodel.baseType('Integer'));


    expect(loadEmbeddedType.getDeclaredAttribute('age')).instanceof(jspa.metamodel.SingularAttribute);
    expect(loadEmbeddedType.getDeclaredAttribute('age').declaringType).equals(loadEmbeddedType);
    expect(loadEmbeddedType.getDeclaredAttribute('age').name).equals('age');
    expect(loadEmbeddedType.getDeclaredAttribute('age').type).equals(metamodel.baseType('Float'));

    expect(loadEmbeddedType.getDeclaredAttribute('ref')).instanceof(jspa.metamodel.SingularAttribute);
    expect(loadEmbeddedType.getDeclaredAttribute('ref').declaringType).equals(loadEmbeddedType);
    expect(loadEmbeddedType.getDeclaredAttribute('ref').name).equals('ref');
    expect(loadEmbeddedType.getDeclaredAttribute('ref').type).equals(loadType);
  }

  describe('Acl', function() {
    var db, emf, obj, user1, user2, user3;

    var SchemaAclPersonName = randomize('SchemaAclPerson');
    var SchemaAclEmbeddedPersonName = randomize('SchemaAclEmbeddedPerson');

    function createUser(emf, username) {
      return emf.createEntityManager().then(function(db) {
        return db.User.register(username, 'secret').then(function(user) {
          return db.User.logout().thenResolve(user);
        });
      });
    }

    before(function() {
      var staticEmf = new jspa.EntityManagerFactory(env.TEST_SERVER);

      return jspa.Q.all([
        createUser(staticEmf, makeLogin()),
        createUser(staticEmf, makeLogin()),
        createUser(staticEmf, makeLogin())
      ]).then(function(users) {
        user1 = users[0];
        user2 = users[1];
        user3 = users[2];

        var metamodel = staticEmf.createMetamodel();
        metamodel.init();

        var type, embeddedType;
        metamodel.addType(type = new jspa.metamodel.EntityType(SchemaAclPersonName, metamodel.entity(Object)));
        metamodel.addType(embeddedType = new jspa.metamodel.EmbeddableType(SchemaAclEmbeddedPersonName));

        type.declaredAttributes.push(new jspa.metamodel.SingularAttribute(type, "name", metamodel.baseType(String)));
        embeddedType.declaredAttributes.push(new jspa.metamodel.SingularAttribute(embeddedType, "name", metamodel.baseType(String)));

        type.createPermission.denyAccess(user2);
        type.updatePermission.denyAccess(user2).denyAccess(user3);
        type.deletePermission.denyAccess(user2).denyAccess(user3);
        type.queryPermission.denyAccess(user2);
        type.schemaAddPermission.denyAccess(user2);
        type.schemaReplacePermission.denyAccess(user2).denyAccess(user3);
        type.schemaSubclassPermission.denyAccess(user2);

        embeddedType.loadPermission.denyAccess(user2);
        embeddedType.schemaAddPermission.denyAccess(user2).denyAccess(user3);
        embeddedType.schemaReplacePermission.denyAccess(user2).denyAccess(user3);

        return metamodel.save();
      }).then(function() {
        emf = new jspa.EntityManagerFactory(env.TEST_SERVER);

        return emf.createEntityManager(db).then(function(em) {
          db = em;
          obj = db[SchemaAclPersonName]();
          return obj.insert();
        });
      });
    });

    it('should convert acls', function() {
      var metamodel = emf.createMetamodel();
      return metamodel.load().then(function() {
        var AclPerson = metamodel.entity(SchemaAclPersonName);
        for (var name in AclPerson) {
          if (name.indexOf('Permission') != -1 && name != 'loadPermission') {
            expect(AclPerson[name].isDenied(user2)).be.true;
          }
        }

        var EmbeddableType = metamodel.embeddable(SchemaAclEmbeddedPersonName);
        for (name in EmbeddableType) {
          if (name.indexOf('Permission') != -1) {
            expect(EmbeddableType[name].isDenied(user2)).be.true;
          }
        }
      });
    });

    describe('for user1', function() {
      var metamodel;
      before(function() {
        return db.login(user1.username, 'secret');
      });

      after(function() {
        return db.logout();
      });

      beforeEach(function() {
        metamodel = emf.createMetamodel();
      });

      it('should allow schema load', function() {
        return metamodel.load(db.token).then(function() {
          expect(metamodel.entity(SchemaAclPersonName)).be.ok;
          expect(metamodel.embeddable(SchemaAclEmbeddedPersonName)).be.ok;
        });
      });

      it('should allow schema add', function() {
        return metamodel.load(db.token).then(function() {
          return expect(metamodel.save(false, db.token)).be.fulfilled;
        });
      });

      it('should allow schema replace', function() {
        return metamodel.load(db.token).then(function() {
          return expect(metamodel.save(true, db.token)).be.fulfilled;
        });
      });

      it('should allow schema subclassing', function() {
        return metamodel.load(db.token).then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);

          var child = new jspa.metamodel.EntityType(randomize("SchemaAclChildPerson"), AclPerson);
          metamodel.addType(child);

          return expect(metamodel.save(child, false, db.token)).be.fulfilled;
        });
      });

      it('should allow object load', function() {
        return expect(db[SchemaAclPersonName].get(obj.id)).be.fulfilled;
      });

      it('should allow object creation', function() {
        return expect(db[SchemaAclPersonName]().insert()).be.fulfilled;
      });

      it('should allow object update', function() {
        return db[SchemaAclPersonName]().insert().then(function(obj) {
          return expect(obj.save()).be.fulfilled;
        });
      });

      it('should allow object removal', function() {
        return db[SchemaAclPersonName]().insert().then(function(obj) {
          return expect(obj.remove()).be.fulfilled;
        });
      });
    });

    describe('for user2', function() {
      var metamodel;
      before(function() {
        return db.login(user2.username, 'secret');
      });

      after(function() {
        return db.logout();
      });

      beforeEach(function() {
        metamodel = emf.createMetamodel();
      });

      it('should allow/deny schema load', function() {
        return metamodel.load(db.token).then(function() {
          expect(metamodel.entity(SchemaAclPersonName)).be.ok;
          expect(metamodel.embeddable(SchemaAclEmbeddedPersonName)).be.undefined;
        });
      });

      it('should deny schema add', function() {
        return metamodel.load(db.token).then(function() {
          return expect(metamodel.save(false, db.token)).be.rejected;
        });
      });

      it('should deny schema replace', function() {
        return metamodel.load(db.token).then(function() {
          return expect(metamodel.save(true, db.token)).be.rejected;
        });
      });

      it('should deny schema subclassing', function() {
        return metamodel.load(db.token).then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);

          var rnd = Math.floor(Math.random() * 1000000);
          var child = new jspa.metamodel.EntityType("SchemaAclChildPerson" + rnd, AclPerson);
          metamodel.addType(child);

          return expect(metamodel.save(child, false, db.token)).be.rejected;
        });
      });

      it('should allow object load', function() {
        return expect(db[SchemaAclPersonName].get(obj.id)).be.fulfilled;
      });

      it('should deny object creation', function() {
        return expect(db[SchemaAclPersonName]().insert()).be.rejected;
      });

      it('should deny object update', function() {
        return db[SchemaAclPersonName].get(obj.id).then(function(obj) {
          obj.name = 'New Name';
          return expect(obj.save()).be.rejected;
        });
      });

      it('should deny object removal', function() {
        return db[SchemaAclPersonName].get(obj.id).then(function(obj) {
          return expect(obj.remove()).be.rejected;
        });
      });
    });

    describe('for user3', function() {
      var metamodel;
      before(function() {
        return db.login(user3.username, 'secret');
      });

      after(function() {
        return db.logout();
      });

      beforeEach(function() {
        metamodel = emf.createMetamodel();
      });

      it('should allow schema load', function() {
        return metamodel.load(db.token).then(function() {
          expect(metamodel.entity(SchemaAclPersonName)).be.ok;
          expect(metamodel.embeddable(SchemaAclEmbeddedPersonName)).be.ok;
        });
      });

      it('should allow schema add', function() {
        return metamodel.load(db.token).then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);
          return expect(metamodel.save(AclPerson, false, db.token)).be.fulfilled;
        });
      });

      it('should deny schema replace', function() {
        return metamodel.load(db.token).then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);
          return expect(metamodel.save(AclPerson, true, db.token)).be.rejected;
        });
      });

      it('should allow schema subclassing', function() {
        return metamodel.load(db.token).then(function() {
          var AclPerson = metamodel.entity(SchemaAclPersonName);

          var rnd = Math.floor(Math.random() * 1000000);
          var child = new jspa.metamodel.EntityType("SchemaAclChildPerson" + rnd, AclPerson);
          metamodel.addType(child);

          return expect(metamodel.save(child, false, db.token)).be.fulfilled;
        });
      });

      it('should allow object load', function() {
        return expect(db[SchemaAclPersonName].get(obj.id)).be.fulfilled;
      });

      it('should allow object creation', function() {
        return expect(db[SchemaAclPersonName]().insert()).be.fulfilled;
      });

      it('should deny object update', function() {
        return db[SchemaAclPersonName].get(obj.id).then(function(obj) {
          obj.name = 'New Name';
          return expect(obj.save()).be.rejected;
        });
      });

      it('should deny object removal', function() {
        return db[SchemaAclPersonName].get(obj.id).then(function(obj) {
          return expect(obj.remove()).be.rejected;
        });
      });
    });
  });
});