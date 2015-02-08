if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  expect = chai.expect;
  DB = require('../lib');
}

describe('Test code', function() {
  var db, code, entityType, personType, emf;


  before(function() {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);

    var metamodel = emf.metamodel;

    return metamodel.load().then(function() {
      personType = new DB.metamodel.EntityType(randomize("CodePerson"), metamodel.entity(Object));
      metamodel.addType(personType);

      personType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
      personType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
      personType.addAttribute(new DB.metamodel.SingularAttribute("date", metamodel.baseType(Date)));
      personType.addAttribute(new DB.metamodel.SingularAttribute("email", metamodel.baseType(String)));
      return saveMetamodel(metamodel);
    });
  });

  describe('handler', function() {
    ['insert', 'update', 'delete', 'validate'].forEach(function(type) {
      var attr = 'on' + type[0].toUpperCase() + type.slice(1);

      describe(attr, function() {
        beforeEach(function() {
          db = emf.createEntityManager();
          code = db.code;
          entityType = db.metamodel.entity(personType.typeConstructor);
          return db.User.login('root', 'root');
        });

        after(function() {
          return code["delete" + attr.substring(2)](entityType, db.token);
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
            return expect(code["load" + attr.substring(2)](entityType, db.token)).become(null);
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

    after(function() {
      return code.loadResources(db.token).then(function(list) {
        var promises = [];
        list.forEach(function(val) {
          promises.push(code.deleteCode(val.substring(val.lastIndexOf('/')+1), db.token));
        });
        return Promise.all(promises);
      });
    });

    beforeEach(function() {
      db = emf.createEntityManager();
      code = db.code;
      entityType = db.metamodel.entity(personType.typeConstructor);
      return db.User.login('root', 'root').then(function() {
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

    it('should load list of code resources', function() {
      var bucket = randomize("resources");
      return code.saveCode(bucket, function() {
        return "yeah";
      }, db.token).then(function() {
        return expect(code.loadResources(db.token)).to.eventually.include('/code/' + bucket);
      }).then(function() {
        return code.deleteCode(bucket, db.token);
      });
    });
  });

});