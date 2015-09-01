if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  //chai.config.includeStack = true;
  expect = chai.expect;
  DB = require('../lib');
}

describe('Test code', function() {
  var db, code, entityType, personType, emf, rootToken;


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

      return loadRootToken().then(function(token) {
        rootToken = token;
        return metamodel.save(token);
      });
    });
  });

  describe('handler', function() {
    var handlers = ['insert', 'update', 'delete', 'validate'];

    before(function() {
      db = emf.createEntityManager();
      code = db.code;
      entityType = db.metamodel.entity(personType.typeConstructor);
    });

    afterEach(function() {
      return Promise.all(handlers.map(function(type) {
        return code.deleteCode(entityType, type, rootToken);
      }));
    });

    handlers.forEach(function(type) {
      var signature = 'on' + type.substring(0,1).toUpperCase() + type.substring(1);

      describe(signature, function() {
        it('should set and get code', function() {
          var fn = "exports." + signature + " = function(db, obj) { return '"+type+Math.random().toString()+"'; }";
          return code.saveCode(entityType, type, fn, rootToken).then(function() {
            return code.loadCode(entityType, type, rootToken);
          }).then(function(code) {
            expect(code).equals(fn);
          });
        });

        it('should delete code', function() {
          var fn = "exports." + signature + " = function(db, obj) { return '"+type+Math.random().toString()+"'; }";
          return code.saveCode(entityType, type, fn, rootToken).then(function() {
            return code.deleteCode(entityType, type, rootToken);
          }).then(function(fn) {
            expect(fn).be.null;
            return expect(code.loadCode(entityType, type, rootToken)).become(null);
          });
        });
      });
    });

    describe('onInsert', function() {
      it('should call handler', function() {
        return code.saveCode(entityType, 'insert', function(module, exports) {
          exports.onInsert = function(db, obj) {
            obj.name = 'changed ' + obj.name;
          }
        }, rootToken).then(function() {
          var obj = db[personType.name]({
            name: 'test'
          });

          return obj.insert({reload: true});
        }).then(function(obj) {
          expect(obj.name).equals('changed test');
        });
      });

      it('should allow to load before image', function() {
        return code.saveCode(entityType, 'insert', function(module, exports) {
          exports.onInsert = function(db, obj) {
            return db[obj._metadata.type.name].load(obj.id, function(before) {
              if (before != null)
                throw new Abort('A object was found!');
            });
          }
        }, rootToken).then(function() {
          var obj = db[personType.name]({
            name: 'test'
          });

          return obj.save({reload:true});
        }).then(function(obj) {
          expect(obj.name).equals('test');
        });
      });
    });

    describe('onUpdate', function() {
      it('should call handler', function() {
        return code.saveCode(entityType, 'update', function(module, exports) {
          exports.onUpdate = function(db, obj) {
            obj.name = 'updated ' + obj.name;
          }
        }, rootToken).then(function() {
          var obj = db[personType.name]({
            name: 'test'
          });

          return obj.insert({reload: true});
        }).then(function(obj) {
          expect(obj.name).equals('test');
          obj.name = 'new name';
          return obj.save({reload: true});
        }).then(function(obj) {
          expect(obj.name).equals('updated new name');
        });
      });

      it('should allow to load before image', function() {
        return code.saveCode(entityType, 'update', function(module, exports) {
          exports.onUpdate = function(db, obj) {
            return db[obj._metadata.type.name].load(obj.id, function(before) {
              obj.name += ' before ' + before.name;
              return obj;
            });
          }
        }, rootToken).then(function() {
          var obj = db[personType.name]({
            name: 'test'
          });

          return obj.save();
        }).then(function(obj) {
          obj.name = 'new name';
          return obj.save({reload: true});
        }).then(function(obj) {
          expect(obj.name).equals('new name before test');
        });
      });
    });

    describe('onDelete', function() {
      it('should call handler', function() {
        return expect(code.saveCode(entityType, 'delete', function(module, exports) {
          exports.onDelete = function(db, obj) {
            throw new Abort('Delete not accepted.');
          }
        }, rootToken).then(function() {
          var obj = db[personType.name]({
            name: 'test'
          });

          return obj.save();
        }).then(function(obj) {
          expect(obj.name).equals('test');
          return obj.delete();
        })).be.rejectedWith("Delete not accepted.")
      });

      it('should allow to load before image', function() {
        return code.saveCode(entityType, 'delete', function(module, exports) {
          exports.onDelete = function(db, obj) {
            return db[obj._metadata.type.name].load(obj.id, function(obj) {
              if (obj.name != 'test')
                throw new Abort('name was ' + obj.name + ' not test');
            });
          }
        }, rootToken).then(function() {
          var obj = db[personType.name]({
            name: 'test'
          });

          return obj.save();
        }).then(function(obj) {
          return obj.delete();
        });
      });

      it('should be abortable', function() {
        return expect(code.saveCode(entityType, 'delete', function(module, exports) {
          exports.onDelete = function(db, obj) {
            throw new Abort('delete not permitted');
          }
        }, rootToken).then(function() {
          var obj = db[personType.name]({
            name: 'test'
          });

          return obj.save();
        }).then(function(obj) {
          return obj.delete();
        })).be.rejectedWith("delete not permitted");
      });
    });

    describe('onValidate', function() {
      it('should call handler', function() {
        return code.saveCode(entityType, 'validate', function(name) {
          name.equals('String is not valid', 'test');
        }, rootToken).then(function() {
          var obj = db[personType.name]({
            name: 'test'
          });

          return obj.save();
        }).then(function(obj) {
          obj.name = 'new name';
          return obj.save();
        }).catch(function(e) {
          expect(e.message).contain('Object is not valid');
          return e.data;
        }).then(function(result) {
          expect(result.name.isValid).be.false;
          expect(result.name.errors[0]).equals('String is not valid');
        });
      });

      it('should run in own scope', function() {
        return code.saveCode(entityType, 'validate', function(name) {
          setTimeout(function() {
            val++;
          }, 300)
        }, rootToken).then(function() {
          var obj = db[personType.name]({
            name: 'test'
          });

          return obj.save();
        }).then(function() {
          expect(true).be.false;
        }, function(e) {
          expect(e.status).equals(500);
        });
      });
    });
  });

  describe('modules', function() {
    var fn, bucket;

    before(function() {
      fn = function(module, exports) {
        exports.call = function(db, data) {
          return {
            "test": "test",
            "this": data
          };
        }
      };
      bucket = randomize("code.Test");
      db = emf.createEntityManager();
      code = db.code;
      entityType = db.metamodel.entity(personType.typeConstructor);
    });

    beforeEach(function() {
      return code.saveCode(bucket, 'module', fn, rootToken).then(function(saved) {
        var module = {exports: {}};
        saved(module, module.exports);
        expect(module.exports.call).be.a('function');
      });
    });

    afterEach(function() {
      return code.deleteCode(bucket, 'module', rootToken);
    });

    it('should load code', function() {
      return code.loadCode(bucket, 'module', rootToken, true).then(function(loaded) {
        var module = {exports: {}};
        loaded(module, module.exports);
        expect(module.exports.call).be.a('function');
      });
    });

    it('should return string', function() {
      var fn = function(module, exports) {
        exports.call = function(db, data) {
          return "test";
        }
      };

      return code.saveCode(bucket, 'module', fn, rootToken).then(function() {
        return db.modules.get(bucket);
      }).then(function(returned) {
        expect(returned).equals("test");
      });
    });

    it('should return array', function() {
      var fn = function(module, exports) {
        exports.call = function(db, data) {
          return ["test"];
        }
      };

      return code.saveCode(bucket, 'module', fn, rootToken).then(function() {
        return db.modules.get(bucket);
      }).then(function(returned) {
        expect(returned).eqls(["test"]);
      });
    });

    it('should run code', function() {
      var obj = { "foo": "bar" };
      return db.modules.post(bucket, obj).then(function(result) {
        expect(result.this.foo).eqls(obj.foo);
      });
    });

    it('should delete code', function() {
      return code.deleteCode(bucket, 'module', rootToken).then(function() {
        return expect(code.loadCode(bucket, 'module', rootToken)).become(null);
      });
    });

    it('should load list of code resources', function() {
      return code.saveCode(bucket, 'module', function(module, exports) {
        exports.call = function() { return "yeah" };
      }, rootToken).then(function() {
        return expect(code.loadModules(rootToken)).to.eventually.include('/code/' + bucket + '/module');
      }).then(function() {
        return code.deleteCode(bucket, 'module', rootToken);
      });
    });

    it('should run code by get request', function() {
      return code.saveCode(bucket, 'module', function(module, exports) {
        exports.call = function() { return "yeah" };
      }, rootToken).then(function() {
        return db.modules.get(bucket);
      }).then(function(result) {
        expect(result).eqls("yeah");
      });
    });

    it('should allow require in baqend code', function() {
      return code.saveCode(bucket, 'module', function(module, exports) {
        var http = require('http');

        exports.call = function() { return {ready: !!http.get} };
      }, rootToken).then(function() {
        return db.modules.get(bucket);
      }).then(function(result) {
        expect(result.ready).be.true;
      });
    });

    it('should accept string parameter', function() {
      return code.saveCode(bucket, 'module', function(module, exports) {
        exports.call = function(db, data) { return data };
      }, rootToken).then(function() {
        return db.modules.post(bucket, "yeah");
      }).then(function(result) {
        expect(result).eqls("yeah");
      });
    });

    it('should accept array parameter', function() {
      return code.saveCode(bucket, 'module', function(module, exports) {
        exports.call = function(db, data) { return data };
      }, rootToken).then(function() {
        return db.modules.post(bucket, ["yeah"]);
      }).then(function(result) {
        expect(result).eqls(["yeah"]);
      });
    });

    it('should accept query object', function() {
      return code.saveCode(bucket, 'module', function(module, exports) {
        exports.call = function(db, data) { return data.first + ' ' + data.last };
      }, rootToken).then(function() {
        return db.modules.get(bucket, { first: 'firstName', last: 'lastName' });
      }).then(function(result) {
        expect(result).eqls("firstName lastName");
      });
    });
  });

});