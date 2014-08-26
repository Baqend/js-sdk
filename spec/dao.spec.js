if (typeof jspa == 'undefined') {
  env = require('./env');
  expect = require('chai').expect;
  jspa = require('../lib');
}

var isBrowser = typeof window != "undefined";

describe("Test dao", function() {

  var entityManager;

  beforeEach(function() {
    var model = [
      {
        "class": "/db/TestClass",
        "fields": {
          "testValue": {
            "name": "testValue",
            "type": "/db/_native.Integer"
          }
        }
      },
      {
        "class": "/db/test.NsClass",
        "fields": {
          "value": {
            "name": "value",
            "type": "/db/_native.Integer"
          }
        }
      }
    ];
    var emf = new jspa.EntityManagerFactory(env.TEST_SERVER, model);

    if(isBrowser) {
      window.db = null;
    }

    return emf.createEntityManager().then(function(em) {
      entityManager = em;
    });
  });

  describe('Test enhancement', function() {

    it('should add DAO methods', function() {
      expect(entityManager.TestClass).be.ok;
      expect(entityManager.TestClass.find).be.ok;
      expect(entityManager.TestClass.get).be.ok;
      expect(entityManager.TestClass.methods).be.ok;
      expect(entityManager.TestClass.addMethods).be.ok;
      expect(entityManager.TestClass.addMethod).be.ok;
      expect(entityManager.TestClass.partialUpdate).be.ok;

      var TestClass = entityManager.TestClass;
      var testClass = TestClass();
      expect(testClass).be.ok;
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

    it('should class in namespaces to be enhanced', function() {
      var testClass = new entityManager['test.NsClass']();

      expect(entityManager['test.NsClass']).be.ok;
      expect(entityManager['test.NsClass'].find).be.ok;
      expect(entityManager.test).be.undefined;
      expect(testClass).be.ok;
    });

    it('should add identifier', function() {
      var classFactory = new jspa.binding.ClassFactory();

      var testClass = entityManager.TestClass();

      expect(classFactory.getIdentifier(testClass.constructor)).be.ok;
    });

    it('should add metadata object', function() {
      var testClass = entityManager.TestClass();

      expect(testClass._metadata).be.ok;
    });

    it('should enhance custom classes', function() {
      entityManager.TestClass = function() {
        this.firstName = function() {
          return "firstName";
        };
        this.lastName = function() {
          return "lastName";
        };
      };

      var testClass = entityManager.TestClass();
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
    });

    it('should be allowed once to set a class', function() {
      entityManager.TestClass = function() {};

      expect(function() {entityManager.TestClass = function() {}}).throw(Error);
    });

    if(isBrowser) {
      it('should add global DB object', function() {
        expect(db).be.not.ok;
        expect(DB).be.ok;
        return DB.ready(env.TEST_SERVER).then(function(localDb) {
          expect(localDb).equal(db);
          expect(localDb).instanceof(jspa.EntityManager);
        });
      });

      it('should allow to add an callback to global DB object', function() {
        return DB.ready(env.TEST_SERVER, function(localDb) {
          expect(localDb).equal(db);
          expect(localDb).instanceof(jspa.EntityManager);
        });
      });

      it('should only create one instance', function() {
        return DB.ready(env.TEST_SERVER).then(function(oldDb) {
          return DB.ready(env.TEST_SERVER).then(function(newDb) {
            expect(oldDb).equal(newDb);
            expect(db).equal(oldDb);
          });
        });
      });
    }
  });

  describe('Test dao methods', function() {

    it('should add new methods', function() {
      var TestClass = entityManager.TestClass;

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

  });

});