if (typeof jspa == 'undefined') {
  expect = require('chai').expect;
  jspa = require('../lib');
}

describe("Test metamodel class", function () {
  var metamodel;

  beforeEach(function() {
    metamodel = new jspa.metamodel.Metamodel(jspa.connector.Connector.create("http://localhost:8080"));

    var PersClassEntity = new jspa.metamodel.EntityType("test.persistent.PersClass");
    var ChildPersClassEntity = new jspa.metamodel.EntityType("test.persistent.ChildPersClass", PersClassEntity);
    var OtherPersClassEntity = new jspa.metamodel.EntityType("test.persistent.OtherPersClass");

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

    metamodel.addType(PersClassEntity);
    metamodel.addType(ChildPersClassEntity);
    metamodel.addType(OtherPersClassEntity);
  });

  describe("ModelBuilder", function() {
    it("should create basic and object type", function() {
      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels({});

      for (var name in models)
        metamodel.addType(models[name]);

      expect(metamodel.baseType(jspa.metamodel.BasicType.Date.identifier)).equals(jspa.metamodel.BasicType.Date);
      expect(metamodel.baseType(jspa.metamodel.BasicType.DateTime.identifier)).equals(jspa.metamodel.BasicType.DateTime);
      expect(metamodel.baseType(jspa.metamodel.BasicType.Boolean.identifier)).equals(jspa.metamodel.BasicType.Boolean);
      expect(metamodel.baseType(jspa.metamodel.BasicType.Float.identifier)).equals(jspa.metamodel.BasicType.Float);
      expect(metamodel.baseType(jspa.metamodel.BasicType.Integer.identifier)).equals(jspa.metamodel.BasicType.Integer);
      expect(metamodel.baseType(jspa.metamodel.BasicType.String.identifier)).equals(jspa.metamodel.BasicType.String);
      expect(metamodel.baseType(jspa.metamodel.BasicType.Time.identifier)).equals(jspa.metamodel.BasicType.Time);

      expect(metamodel.entity(jspa.metamodel.EntityType.Object.identifier)).instanceOf(jspa.metamodel.EntityType.Object);
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels([model]);

      for (var name in models)
        metamodel.addType(models[name]);

      var entity = metamodel.entity("/db/test.OtherPersClass");
      expect(entity).instanceof(jspa.metamodel.EntityType);
      expect(entity.identifier).equals("/db/test.OtherPersClass");
      expect(entity.superType).equals(metamodel.entity(jspa.metamodel.EntityType.Object.identifier));
      expect(entity.typeConstructor).be.undefined;
      expect(entity.declaredAttributes).length(1);
      expect(entity.declaredAttributes[0]).instanceOf(jspa.metamodel.SingularAttribute);
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels(model);

      for (var n in models)
        metamodel.addType(models[n]);

      var entity = metamodel.entity("/db/test.PersClass");
      expect(entity).instanceof(jspa.metamodel.EntityType);
      expect(entity.identifier).equals("/db/test.PersClass");
      expect(entity.superType).equals(metamodel.entity(jspa.metamodel.EntityType.Object.identifier));
      expect(entity.typeConstructor).be.undefined;
      expect(entity.declaredAttributes).length(2);

      var name = entity.getDeclaredAttribute("name");
      expect(entity.getAttribute("name")).equals(name);
      expect(name).instanceOf(jspa.metamodel.SingularAttribute);
      expect(name.declaringType).equals(entity);
      expect(name.name).equals("name");
      expect(name.type).equals(jspa.metamodel.BasicType.String);
      expect(name.typeConstructor).equals(String);

      var ref = entity.getDeclaredAttribute("ref");
      expect(entity.getAttribute("ref")).equals(ref);
      expect(ref).instanceOf(jspa.metamodel.SingularAttribute);
      expect(ref.declaringType).equals(entity);
      expect(ref.name).equals("ref");
      expect(ref.type).equals(metamodel.entity("/db/test.ChildPersClass"));
      expect(ref.typeConstructor).be.undefined;

      expect(entity.getDeclaredAttribute("value")).be.null;
      expect(entity.getAttribute("value")).be.null;

      entity = metamodel.entity("/db/test.ChildPersClass");
      expect(entity).instanceof(jspa.metamodel.EntityType);
      expect(entity.identifier).equals("/db/test.ChildPersClass");
      expect(entity.superType).equals(metamodel.entity("/db/test.PersClass"));
      expect(entity.typeConstructor).be.undefined;
      expect(entity.declaredAttributes).length(1);

      var value = entity.getDeclaredAttribute("value");
      expect(entity.getAttribute("value")).equals(value);
      expect(value).instanceOf(jspa.metamodel.SingularAttribute);
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels([model]);

      for (var n in models)
        metamodel.addType(models[n]);

      var entity = metamodel.embeddable("/db/test.EmbeddedPersClass");
      expect(entity).instanceof(jspa.metamodel.EmbeddableType);
      expect(entity.identifier).equals("/db/test.EmbeddedPersClass");
      expect(entity.typeConstructor).be.undefined;
      expect(entity.declaredAttributes).length(1);
      expect(entity.declaredAttributes[0]).instanceOf(jspa.metamodel.SingularAttribute);
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels([model]);

      for (var n in models)
        metamodel.addType(models[n]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceOf(jspa.metamodel.SingularAttribute);
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels([model]);

      for (var n in models)
        metamodel.addType(models[n]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceOf(jspa.metamodel.SingularAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.type).equals(type);
      expect(attr.typeConstructor).be.undefined;
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels([model]);

      for (var n in models)
        metamodel.addType(models[n]);

      var type = metamodel.embeddable("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceOf(jspa.metamodel.SingularAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.type).equals(type);
      expect(attr.typeConstructor).be.undefined;
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels([model]);

      for (var n in models)
        metamodel.addType(models[n]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceOf(jspa.metamodel.ListAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.elementType).equals(jspa.metamodel.BasicType.String);
      expect(attr.typeConstructor.prototype).instanceOf(jspa.collection.List);
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels([model]);

      for (var n in models)
        metamodel.addType(models[n]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceOf(jspa.metamodel.SetAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.elementType).equals(jspa.metamodel.BasicType.String);
      expect(attr.typeConstructor.prototype).instanceOf(jspa.collection.Set);
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels([model]);

      for (var n in models)
        metamodel.addType(models[n]);

      var type = metamodel.entity("/db/test.TestClass");
      var attr = type.declaredAttributes[0];
      expect(attr).instanceOf(jspa.metamodel.MapAttribute);
      expect(attr.declaringType).equals(type);
      expect(attr.name).equals("name");
      expect(attr.elementType).equals(jspa.metamodel.BasicType.Integer);
      expect(attr.keyType).equals(jspa.metamodel.BasicType.String);
      expect(attr.typeConstructor.prototype).instanceOf(jspa.collection.Map);
      expect(attr.persistentAttributeType).equals(jspa.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION);
      expect(attr.isAssociation).be.false;
      expect(attr.isCollection).be.true;
      expect(attr.collectionType).equals(jspa.metamodel.PluralAttribute.CollectionType.MAP);
    });
  });

  describe("BasicType", function () {
    it("should be defined", function() {

    });
  });

  describe("EntityType", function () {
    it("Object should have an id and version field", function () {
      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels([]);

      for (var n in models)
        metamodel.addType(models[n]);

      var entity = metamodel.entity(jspa.metamodel.EntityType.Object.identifier);
      expect(entity.declaredId).instanceOf(jspa.metamodel.SingularAttribute);
      expect(entity.declaredId.name).equals("oid");
      expect(entity.declaredVersion).instanceOf(jspa.metamodel.SingularAttribute);
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

      var modelBuilder = new jspa.metamodel.ModelBuilder();
      var models = modelBuilder.buildModels(model);

      for (var n in models)
        metamodel.addType(models[n]);

      var entity = metamodel.entity("/db/test.ChildPersClass");

      var names = ["name", "ref", "value"];
      for (var iter = entity.attributes(); iter.hasNext; ) {
        var attr = iter.next();
        var index = names.indexOf(attr.name);
        expect(index).not.equals(-1);
        expect(attr).equals(entity.getAttribute(attr.name));

        names.splice(index, 1);
      }

      expect(names).length(0);
    });
  })


});