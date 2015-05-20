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

  describe('methods', function() {

    var fn, bucket;

    before(function() {
      fn = function(data) {
        return {
          "test": "test",
          "this": data
        };
      };
      bucket = randomize("code.Test");
    });

    after(function() {
      return code.loadMethods(db.token).then(function(list) {
        var promises = [];
        list.forEach(function(val) {
          promises.push(code.deleteMethod(val.match("^/code/([^/]*)/method")[1], db.token));
        });
        return Promise.all(promises);
      });
    });

    beforeEach(function() {
      db = emf.createEntityManager();
      code = db.code;
      entityType = db.metamodel.entity(personType.typeConstructor);
      return db.User.login('root', 'root').then(function() {
        return code.saveMethod(bucket, fn, db.token).then(function(saved) {
          expect(saved().test).eqls(fn().test);
        });
      });
    });

    it('should load code', function() {
      return code.loadMethod(bucket, db.token).then(function(loaded) {
        expect(loaded().test).eqls(fn().test);
        expect(code.getMethod(bucket)).be.null;
      });
    });

    it('should return string', function() {
      return code.saveMethod(bucket + "string", function() { return "test" }, db.token).then(function() {
        return db.methods.get(bucket + "string");
      }).then(function(returned) {
        expect(returned).eqls("test");
      });
    });

    it('should return array', function() {
      return code.saveMethod(bucket + "array", function() { return ["test"] }, db.token).then(function() {
        return db.methods.get(bucket + "array");
      }).then(function(returned) {
        expect(returned).eqls(["test"]);
      });
    });

    it('should run code', function() {
      var obj = { "foo": "bar" };
      return db.methods.post(bucket, obj).then(function(result) {
        expect(result.this.foo).eqls(obj.foo);
      });
    });

    it('should delete code', function() {
      return code.deleteMethod(bucket, db.token).then(function() {
        return expect(code.loadMethod(bucket, db.token)).become(null);
      });
    });

    it('should load list of code resources', function() {
      var bucket = randomize("resources");
      return code.saveMethod(bucket, function() {
        return "yeah";
      }, db.token).then(function() {
        return expect(code.loadMethods(db.token)).to.eventually.include('/code/' + bucket + '/method');
      }).then(function() {
        return code.deleteMethod(bucket, db.token);
      });
    });

    it('should run code by get request', function() {
      var bucket = randomize("resources");
      return code.saveMethod(bucket, function() {
        return "yeah";
      }, db.token).then(function() {
        return db.methods.get(bucket);
      }).then(function(result) {
        expect(result).eqls("yeah");
      });
    });

    it('should accept string parameter', function() {
      var bucket = randomize("resources");
      return code.saveMethod(bucket, function(data) {
        return data;
      }, db.token).then(function() {
        return db.methods.post(bucket, "yeah");
      }).then(function(result) {
        expect(result).eqls("yeah");
      });
    });

    it('should accept array parameter', function() {
      var bucket = randomize("resources");
      return code.saveMethod(bucket, function(data) {
        return data;
      }, db.token).then(function() {
        return db.methods.post(bucket, ["yeah"]);
      }).then(function(result) {
        expect(result[0]).eqls("yeah");
      });
    });

    it('should accept query object', function() {
      var bucket = randomize("resources");
      return code.saveMethod(bucket, function(data) {
        return data.first + data.last;
      }, db.token).then(function() {
        return db.methods.get(bucket, { first: 'firstName', last: 'lastName' });
      }).then(function(result) {
        expect(result).eqls("firstNamelastName");
      });
    });
  });

});