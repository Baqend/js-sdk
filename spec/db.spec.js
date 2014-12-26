if (typeof baqend == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  expect = chai.expect;
  baqend = require('../lib');
}

describe("Test db", function() {
  var db;

  beforeEach(function() {
    var model = [
      {
        "class": "/db/TestClass",
        "fields": {
          "testValue": {
            "name": "testValue",
            "type": "/db/Integer"
          }
        }
      },
      {
        "class": "/db/test.NsClass",
        "fields": {
          "value": {
            "name": "value",
            "type": "/db/Integer"
          }
        }
      },
      {
        "class": "/db/TestEmbeddedClass",
        "embedded": true,
        "fields": {
          "value": {
            "name": "value",
            "type": "/db/Integer"
          }
        }
      }
    ];

    var emf = new baqend.EntityManagerFactory(env.TEST_SERVER, model);
    saveMetamodel(emf.metamodel);

    return emf.createEntityManager().then(function(em) {
      db = em;
    });
  });

  it('should call ready method', function() {
    return db.ready(function(localDb) {
      expect(localDb).equals(db);
    });
  });

  describe('Test enhancement', function() {
    it('should add DAO methods', function() {
      expect(db.TestClass).be.ok;
      expect(db.TestClass.find).be.ok;
      expect(db.TestClass.get).be.ok;
      expect(db.TestClass.methods).be.ok;
      expect(db.TestClass.addMethods).be.ok;
      expect(db.TestClass.addMethod).be.ok;
      expect(db.TestClass.partialUpdate).be.ok;

      var TestClass = db.TestClass;
      var testClass = TestClass();
      expect(testClass).be.ok;
      expect(baqend.binding.Managed.isInstance(testClass)).be.true;
      expect(baqend.binding.Entity.isInstance(testClass)).be.true;
      expect("testValue" in testClass).be.true;
      expect(testClass.save).be.ok;
      expect(testClass.insert).be.ok;
      expect(testClass.update).be.ok;
      expect(testClass.saveAndRefresh).be.ok;
      expect(testClass.insertAndRefresh).be.ok;
      expect(testClass.updateAndRefresh).be.ok;
      expect(testClass.refresh).be.ok;
      expect(testClass.remove).be.ok;
      expect(testClass.attr).be.ok;
    });

    it('should not enhance dao methods to embedded objects', function() {
      expect(db.TestEmbeddedClass).be.ok;
      expect(db.TestEmbeddedClass.find).be.undefined;
      expect(db.TestEmbeddedClass.get).be.undefined;
      expect(db.TestEmbeddedClass.methods).be.ok;
      expect(db.TestEmbeddedClass.addMethods).be.ok;
      expect(db.TestEmbeddedClass.addMethod).be.ok;
      expect(db.TestEmbeddedClass.partialUpdate).be.undefined;

      var TestEmbeddedClass = db.TestEmbeddedClass;
      var testClass = TestEmbeddedClass();
      expect(testClass).be.ok;
      expect(baqend.binding.Managed.isInstance(testClass)).be.true;
      expect(baqend.binding.Entity.isInstance(testClass)).be.false;
      expect("value" in testClass).be.true;
      expect(testClass.save).be.undefined;
      expect(testClass.insert).be.undefined;
      expect(testClass.update).be.undefined;
      expect(testClass.saveAndRefresh).be.undefined;
      expect(testClass.insertAndRefresh).be.undefined;
      expect(testClass.updateAndRefresh).be.undefined;
      expect(testClass.refresh).be.undefined;
      expect(testClass.remove).be.undefined;
      expect(testClass.attr).be.undefined;
    });

    it('should add property constructor on proxy classes', function() {
      var testClass = db.TestClass({
        testValue: 3,
        notEnhanced: 'testString'
      });

      expect(testClass.testValue).equals(3);
      expect(testClass.notEnhanced).equals('testString');

      testClass = db.TestEmbeddedClass({
        value: 3,
        notEnhanced: 'testString'
      });

      expect(testClass.value).equals(3);
      expect(testClass.notEnhanced).equals('testString');
    });

    it('should class in namespaces to be enhanced', function() {
      var testClass = new db['test.NsClass']();

      expect(db['test.NsClass']).be.ok;
      expect(db['test.NsClass'].find).be.ok;
      expect(db.test).be.undefined;
      expect(testClass).be.ok;
    });

    it('should add ref', function() {
      var classFactory = new baqend.binding.Enhancer();

      var testClass = db.TestClass();

      expect(classFactory.getIdentifier(testClass.constructor)).be.ok;
    });

    it('should add metadata object', function() {
      var testClass = db.TestClass();

      expect(testClass._metadata).be.ok;
    });

    it('should enhance custom classes', function() {
      db.TestClass = function() {
        this.firstName = function() {
          return "firstName";
        };
        this.lastName = function() {
          return "lastName";
        };
      };

      var testClass = db.TestClass();
      expect(testClass.firstName()).equal("firstName");
      expect(testClass.lastName()).equal("lastName");
      expect("testValue" in testClass).be.true;
      expect(testClass.save).be.ok;
      expect(testClass.insert).be.ok;
      expect(testClass.update).be.ok;
      expect(testClass.saveAndRefresh).be.ok;
      expect(testClass.insertAndRefresh).be.ok;
      expect(testClass.updateAndRefresh).be.ok;
      expect(testClass.refresh).be.ok;
      expect(testClass.remove).be.ok;
      expect(testClass.attr).be.ok;

      expect(baqend.binding.Entity.isInstance(testClass)).be.true;
    });

    it('should call custom classes constructor', function() {
      db.TestClass = function(a,b,c) {
        this.a = a;
        this.b = b;
        this.c = c;
      };

      var testClass = db.TestClass(1,2,3);
      expect(testClass.a).equals(1);
      expect(testClass.b).equals(2);
      expect(testClass.c).equals(3);
    });

    it('should not enhance complete implemented classes', function() {
      db.TestClass = Object.inherit(baqend.binding.Entity, {
        firstName: function() {
          return "firstName";
        },
        lastName: function() {
          return "lastName";
        },
        save: function() {
          return 'overwritten';
        }
      });

      var testClass = db.TestClass();
      expect(testClass.firstName()).equal("firstName");
      expect(testClass.lastName()).equal("lastName");
      expect("testValue" in testClass).be.true;
      expect(testClass.save).be.ok;
      expect(testClass.insert).be.ok;
      expect(testClass.update).be.ok;
      expect(testClass.saveAndRefresh).be.ok;
      expect(testClass.insertAndRefresh).be.ok;
      expect(testClass.updateAndRefresh).be.ok;
      expect(testClass.refresh).be.ok;
      expect(testClass.remove).be.ok;
      expect(testClass.attr).be.ok;

      expect(testClass.save()).equals('overwritten');
    });

    it('should be allowed once to set a class', function() {
      db.TestClass = function() {};

      expect(function() {db.TestClass = function() {}}).throw(Error);
    });
  });

  describe('Test dao methods', function() {
    it('should add new methods', function() {
      var TestClass = db.TestClass;

      var returnVal = "testMethod";
      var newMethod = function() {
        return returnVal;
      };

      TestClass.methods.newMethod0 = newMethod;

      TestClass.addMethod('newMethod1', newMethod);

      TestClass.addMethods({
        newMethod2: newMethod,
        newMethod3: newMethod
      });

      TestClass.addMethods({
        newMethod4: newMethod
      });

      var testClass = TestClass();

      expect(testClass.newMethod0()).equal(returnVal);
      expect(testClass.newMethod1()).equal(returnVal);
      expect(testClass.newMethod2()).equal(returnVal);
      expect(testClass.newMethod3()).equal(returnVal);
      expect(testClass.newMethod4()).equal(returnVal);
    });

    it('should convert to JSON', function() {
      var testClass = db.TestClass();
      testClass.testValue = 5;
      var json = testClass.toJSON();
      expect(json).be.ok;
      expect(json.testValue).eqls(testClass.testValue);
      expect(json._metadata).be.undefined;
      expect(json._objectInfo).be.undefined;
    });

    it('should convert to JSON including objectInfo', function() {
      var testClass = db.TestClass();
      testClass.attach(db);

      testClass.testValue = 5;
      var json = testClass.toJSON(true);
      expect(json).be.ok;
      expect(json.testValue).eqls(testClass.testValue);
      expect(json._metadata).be.undefined;
      expect(json._objectInfo).be.ok;
    });

    it('should convert from JSON', function() {
      var testClass = db.TestClass();
      testClass.attach(db);

      testClass.testValue = 5;
      var newTestClass = db.TestClass.fromJSON(testClass.toJSON());
      expect(newTestClass).be.ok;
      expect(newTestClass.testValue).eqls(testClass.testValue);
    });

    it('should convert from JSON including objectInfo', function() {
      var testClass = db.TestClass();
      testClass.attach(db);

      testClass.testValue = 5;
      var newTestClass = db.TestClass.fromJSON(testClass.toJSON(true));
      expect(newTestClass).eqls(testClass);
    });

  });

});