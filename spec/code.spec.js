if (typeof baqend == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  expect = chai.expect;
  baqend = require('../lib');
}

describe('Test code', function() {
  var db, code, entityType, personType;


  before(function() {
    var emf = new baqend.EntityManagerFactory(env.TEST_SERVER);

    var metamodel = emf.metamodel;

    metamodel.init();
    personType = new baqend.metamodel.EntityType("CodePerson" + Math.random().toString().replace("0.", ""), metamodel.entity(Object));
    metamodel.addType(personType);

    personType.addAttribute(new baqend.metamodel.SingularAttribute("name", metamodel.baseType(String)));
    personType.addAttribute(new baqend.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
    personType.addAttribute(new baqend.metamodel.SingularAttribute("date", metamodel.baseType(Date)));
    personType.addAttribute(new baqend.metamodel.SingularAttribute("email", metamodel.baseType(String)));
    return saveMetamodel(metamodel);
  });

  describe('handler', function() {
    ['insert', 'update', 'delete', 'validate'].forEach(function(type) {
      var attr = 'on' + type[0].toUpperCase() + type.slice(1);


      describe(attr, function() {
        beforeEach(function() {
          var emf = new baqend.EntityManagerFactory(env.TEST_SERVER);
          return emf.createEntityManager(function(em) {
            db = em;
            code = em.code;
            entityType = db.metamodel.entity(personType.typeConstructor);
            return db.User.login('root', 'root');
          });
        });

        it('should return null if no code has been loaded', function() {
          expect(db[personType.name][attr]).be.null;
        });

        it('should set and get code', function() {
          var fn = new Function("return '"+type+Math.random().toString()+"';");
          return code["save" + attr.substring(2)](entityType, fn, db.token).then(function() {
            expect(db[personType.name][attr]()).equals(fn());
          }).then(function() {
            return code["load" + attr.substring(2)](entityType, db.token);
          }).then(function() {
            expect(db[personType.name][attr]()).equals(fn());
          });
        });

        it('should delete code', function() {
          var fn = new Function("return '"+type+Math.random().toString()+"';");
          return code["save" + attr.substring(2)](entityType, fn, db.token).then(function() {
            expect(db[personType.name][attr]()).equals(fn());
            return code["delete" + attr.substring(2)](entityType, db.token);
          }).then(function() {
            expect(db[personType.name][attr]).be.null;
            return expect(code["load" + attr.substring(2)](entityType, db.token)).be.rejected;
          });
        });

        if(type != 'validate') {
          it('should apply EntityManager', function() {
            var fn = new Function("db", "return db;");
            db.code.setHandler(personType.name, type, fn);
            expect(db[personType.name][attr]()).be.ok;
          });

          it('should use parameter as this', function() {
            var obj = {
              test: "test"
            };
            var fn = new Function("return this;");
            db.code.setHandler(personType.name, type, fn);
            expect(db[personType.name][attr](obj)).equals(obj);
          });
        } else {
          it('should not apply EntityManager', function() {
            entityType.validationCode = new Function("return db");
            expect(db[personType.name][attr]).to.throw(ReferenceError);
          });
        }
      });

    });
  });

  describe('code', function() {

    var fn, bucket;

    before(function() {
      fn = function() {
        return {
          "test": "test",
          "this": this
        };
      };
      bucket = randomize("code.Test");
    });

    beforeEach(function() {
      var emf = new baqend.EntityManagerFactory(env.TEST_SERVER);
      return emf.createEntityManager(function(em) {
        db = em;
        code = em.code;
        entityType = db.metamodel.entity(personType.typeConstructor);
        return db.User.login('root', 'root');
      }).then(function() {
        return code.saveCode(bucket, fn, db.token).then(function(saved) {
          expect(saved().test).eqls(fn().test);
        });
      });
    });

    it('should load code', function() {
      return code.loadCode(bucket, db.token).then(function(loaded) {
        expect(loaded().test).eqls(fn().test);
        expect(code.getCode(bucket)).be.null;
      });
    });

    it('should run code', function() {
      var obj = { "foo": "bar" };
      code.removeCode(bucket);
      return db.run(bucket, obj).then(function(result) {
        expect(result.this.foo).eqls(obj.foo);
      });
    });

    it('should run code locally', function() {
      var obj = { "foo": "bar" };
      var fn = function() {
        return {
          that: this
        }
      };
      var bucket = "localBucket";
      code.setCode(bucket, fn);
      return db.run(bucket, obj).then(function(result) {
        expect(result.that.foo).eqls(obj.foo);
      });
    });

    it('should delete code', function() {
      return code.deleteCode(bucket, db.token).then(function() {
        return expect(code.loadCode(bucket, db.token)).be.rejected;
      });
    });

  });

});