if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  expect = chai.expect;
  DB = require('../lib');
}

describe("Test enhancer", function() {
  var db, model = [
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

  beforeEach(function() {
    var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, schema: model});
    return saveMetamodel(emf.metamodel).then(function() {
      db = emf.createEntityManager();
      expect(db.isReady).be.true;
    });
  });

  it('should add DAO methods', function() {
    expect(db.TestClass).be.ok;
    expect(db.TestClass.find).be.ok;
    expect(db.TestClass.load).be.ok;
    expect(db.TestClass.methods).be.ok;
    expect(db.TestClass.addMethods).be.ok;
    expect(db.TestClass.addMethod).be.ok;
    expect(db.TestClass.partialUpdate).be.ok;
    expect(db.TestClass.fromJSON).be.ok;

    var TestClass = db.TestClass;
    var testClass = new TestClass();
    expect(testClass).be.ok;

    expect("testValue" in testClass).be.true;
    expect(testClass.save).be.ok;
    expect(testClass.insert).be.ok;
    expect(testClass.update).be.ok;
    expect(testClass.load).be.ok;
    expect(testClass.delete).be.ok;
    expect(testClass.attr).be.ok;
  });

  it('should provide EntityFactory instances', function() {
    var testClass = new db.TestClass();

    expect(testClass instanceof DB.binding.Entity).be.true;
    expect(testClass instanceof DB.binding.Managed).be.true;
    expect(testClass instanceof db.TestClass).be.true;
    expect(testClass instanceof db.TestEmbeddedClass).be.false;
    expect(null instanceof db.TestClass).be.false;
  });

  it('should not enhance dao methods to embedded objects', function() {
    expect(db.TestEmbeddedClass).be.ok;
    expect(db.TestEmbeddedClass.find).be.undefined;
    expect(db.TestEmbeddedClass.get).be.undefined;
    expect(db.TestEmbeddedClass.methods).be.ok;
    expect(db.TestEmbeddedClass.addMethods).be.ok;
    expect(db.TestEmbeddedClass.addMethod).be.ok;
    expect(db.TestEmbeddedClass.partialUpdate).be.undefined;
    expect(db.TestEmbeddedClass.fromJSON).be.ok;

    var TestEmbeddedClass = db.TestEmbeddedClass;
    var testClass = new TestEmbeddedClass();
    expect(testClass).be.ok;

    expect("value" in testClass).be.true;
    expect(testClass.toJSON).be.ok;
    expect(testClass.save).be.undefined;
    expect(testClass.insert).be.undefined;
    expect(testClass.update).be.undefined;
    expect(testClass.load).be.undefined;
    expect(testClass.remove).be.undefined;
    expect(testClass.attr).be.undefined;
  });

  it('should provide EmbeddedFactory instances', function() {
    var testClass = new db.TestEmbeddedClass();

    expect(testClass instanceof DB.binding.Entity).be.false;
    expect(testClass instanceof DB.binding.Managed).be.true;
    expect(testClass instanceof db.TestClass).be.false;
    expect(testClass instanceof db.TestEmbeddedClass).be.true;
    expect(null instanceof db.TestEmbeddedClass).be.false;
  });

  it('should add property constructor on proxy classes', function() {
    var testClass = new db.TestClass({
      testValue: 3,
      notEnhanced: 'testString'
    });

    expect(testClass.testValue).equals(3);
    expect(testClass.notEnhanced).equals('testString');

    testClass = new db.TestEmbeddedClass({
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
    var classFactory = new DB.binding.Enhancer();

    var testClass = new db.TestClass();

    expect(classFactory.getIdentifier(testClass.constructor)).be.ok;
  });

  it('should add metadata object', function() {
    var testClass = new db.TestClass();

    expect(testClass._metadata).be.ok;
  });

  it('should enhance custom classes', function() {
    var myClass = function() {
      DB.binding.Entity.call(this);
      this.test = 'hallo';
    };

    var subClass = DB.binding.Entity.extend(myClass);

    myClass.prototype.firstName = function() {
      return "firstName";
    };

    db.TestClass = myClass;

    db.TestClass.prototype.lastName = function() {
      return "lastName";
    };

    expect(subClass).equals(myClass);

    var testClass = new db.TestClass();
    expect(testClass.firstName()).equal("firstName");
    expect(testClass.lastName()).equal("lastName");
    expect("testValue" in testClass).be.true;
    expect(testClass.test).equals('hallo');
    expect(testClass.save).be.ok;
    expect(testClass.insert).be.ok;
    expect(testClass.update).be.ok;
    expect(testClass.load).be.ok;
    expect(testClass.delete).be.ok;
    expect(testClass.attr).be.ok;

    expect(testClass instanceof DB.binding.Entity).be.true;
    expect(testClass instanceof DB.binding.Managed).be.true;
    expect(testClass instanceof myClass).be.true;
  });

  it('should call custom classes constructor', function() {
    db.TestClass = DB.binding.Entity.extend(function(a,b,c) {
      DB.binding.Entity.call(this);
      this.a = a;
      this.b = b;
      this.c = c;
    });

    var testClass = new db.TestClass(1,2,3);
    expect(testClass.a).equals(1);
    expect(testClass.b).equals(2);
    expect(testClass.c).equals(3);
  });

  it('should reject none entity classes', function() {
    var myClass = function(a) {
      this.a = a;
    };

    expect(function() {
      db.TestClass = myClass;
    }).throw('must extends the Entity class');
  });

  it('should reject none embaddable classes', function() {
    var myClass = function(a) {
      this.a = a;
    };

    expect(function() {
      db.TestEmbeddedClass = myClass;
    }).throw('must extends the Managed class');
  });

  it('should reject none embaddable classes', function() {
    var myClass = DB.binding.Entity.extend(function(a) {
      this.a = a;
    });

    expect(function() {
      db.TestEmbeddedClass = myClass;
    }).throw('must extends the Managed class');
  });

  it('should be allowed once to set a class', function() {
    db.TestClass = DB.binding.Entity.extend(function() {});

    expect(function() {
      db.TestClass = DB.binding.Entity.extend(function() {});
    }).throw('already been set');
  });

  it('should allow adding classes before initialization', function() {
    var emf = new DB.EntityManagerFactory({schema: model});

    var db = emf.createEntityManager();
    db.TestClass = DB.binding.Entity.extend(function(a,b,c) {
      DB.binding.Entity.call(this);
      this.a = a;
      this.b = b;
      this.c = c;
    });

    expect(db.isReady).be.false;
    emf.connect(env.TEST_SERVER);

    return db.ready().then(function() {
      var testClass = new db.TestClass(1,2,3);
      expect(testClass.a).equals(1);
      expect(testClass.b).equals(2);
      expect(testClass.c).equals(3);
      expect(testClass.save).be.ok;
      expect(testClass.insert).be.ok;
      expect(testClass.update).be.ok;
      expect(testClass.load).be.ok;
      expect(testClass.delete).be.ok;
      expect(testClass.attr).be.ok;
    });
  });

  it("enhanced objects should be enumarable", function() {
    var obj = new db.TestClass();

    var expected = ['id', 'version', 'acl', 'key', 'testValue'];
    var count = 0;
    for (var prop in obj) {
      if (!(obj[prop] instanceof Function)) {
        count++;
        expect(expected).include(prop);
      }
    }

    expect(count).equals(expected.length);
  });

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

    var testClass = new TestClass();

    expect(testClass.newMethod0()).equal(returnVal);
    expect(testClass.newMethod1()).equal(returnVal);
    expect(testClass.newMethod2()).equal(returnVal);
    expect(testClass.newMethod3()).equal(returnVal);
    expect(testClass.newMethod4()).equal(returnVal);
  });

  it('should convert to JSON', function() {
    var testClass = new db.TestClass();
    testClass.testValue = 5;
    var json = testClass.toJSON();
    expect(json).be.ok;
    expect(json.testValue).eqls(5);
    expect(json._metadata).be.undefined;
  });

  it('should convert embedded to JSON', function() {
    var testClass = new db.TestEmbeddedClass();
    testClass.value = 5;
    var json = testClass.toJSON();
    expect(json).be.ok;
    expect(json.value).eqls(5);
    expect(json._metadata).be.undefined;
  });

  it('should convert to JSON including metadata', function() {
    var testClass = new db.TestClass();
    testClass.attach(db);

    testClass.testValue = 5;
    var json = testClass.toJSON();
    expect(json).be.ok;
    expect(json.testValue).eqls(testClass.testValue);
    expect(json._metadata).be.undefined;
    expect(json.id).be.ok;
    expect(json.acl).be.ok;
  });

  it('should convert to JSON excluding metadata', function() {
    var testClass = new db.TestClass();
    testClass.attach(db);

    testClass.testValue = 5;
    var json = testClass.toJSON(true);
    expect(json).be.ok;
    expect(json.testValue).equal(testClass.testValue);
    expect(json._metadata).be.undefined;
    expect(json.id).be.undefined;
    expect(json.acl).be.undefined;
  });

  it('should convert from JSON including metadata', function() {
    var testClass = new db.TestClass();
    testClass.attach(db);

    testClass.testValue = 5;
    var newTestClass = db.TestClass.fromJSON(testClass.toJSON());
    expect(newTestClass).be.ok;
    expect(newTestClass).equal(testClass);
    expect(newTestClass.testValue).equal(testClass.testValue);
  });

  it('should convert from JSON excluding metadata', function() {
    var testClass = new db.TestClass();
    testClass.attach(db);

    testClass.testValue = 5;
    var newTestClass = db.TestClass.fromJSON(testClass.toJSON(true));
    expect(newTestClass).not.equal(testClass);
    expect(newTestClass.id).not.equal(testClass.id);
    expect(newTestClass.testValue).eql(testClass.testValue);
  });

  it('should convert embedded from JSON', function() {
    var newTestClass = db.TestEmbeddedClass.fromJSON({value: 5});
    expect(newTestClass.value).eql(5);
  });


});