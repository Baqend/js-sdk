'use strict';

var DB;
if (typeof module !== 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test code', function () {
  var db, code, entityType, personType, emf;

  before(function () {
    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage });

    return emf.ready().then(function () {
      var metamodel = emf.metamodel;
      personType = new DB.metamodel.EntityType(helper.randomize('CodePerson'), metamodel.entity(Object));
      metamodel.addType(personType);

      personType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
      personType.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType(Number)));
      personType.addAttribute(new DB.metamodel.SingularAttribute('date', metamodel.baseType(Date)));
      personType.addAttribute(new DB.metamodel.SingularAttribute('email', metamodel.baseType(String)));

      return metamodel.save();
    });
  });

  describe('handler', function () {
    var handlers = ['insert', 'update', 'delete', 'validate'];

    before(function () {
      db = emf.createEntityManager();
      code = db.code;
      entityType = db.metamodel.entity(personType.typeConstructor);
    });

    afterEach(function () {
      return Promise.all(handlers.map(function (type) {
        return code.deleteCode(entityType, type);
      }));
    });

    handlers.forEach(function (type) {
      var signature = 'on' + type.substring(0, 1).toUpperCase() + type.substring(1);

      describe(signature, function () {
        it('should set and get code', function () {
          var fn = 'exports.' + signature + ' = function(db, obj) { return \'' + type + Math.random().toString() + '\'; }';
          return code.saveCode(entityType, type, fn).then(function () {
            return code.loadCode(entityType, type);
          }).then(function (code) {
            expect(code).equals(fn);
          });
        });

        it('should delete code', function () {
          var fn = 'exports.' + signature + ' = function(db, obj) { return \'' + type + Math.random().toString() + '\'; }';
          return code.saveCode(entityType, type, fn).then(function () {
            return code.deleteCode(entityType, type);
          }).then(function (fn) {
            expect(fn).be.null;
            return expect(code.loadCode(entityType, type)).become(null);
          });
        });
      });
    });

    describe('onInsert', function () {
      it('should call handler', function () {
        return code.saveCode(entityType, 'insert', function (module, exports) {
          exports.onInsert = function (db, obj) {
            obj.name = 'changed ' + obj.name;
          };
        }).then(function () {
          var obj = new db[personType.name]({
            name: 'test',
          });

          return obj.insert({ refresh: true });
        }).then(function (obj) {
          expect(obj.name).equals('changed test');
        });
      });

      it('should allow to load before image', function () {
        return code.saveCode(entityType, 'insert', function (module, exports) {
          exports.onInsert = function (db, obj) {
            return db[obj._metadata.type.name].load(obj.id, function (before) {
              if (before != null) { throw new Abort('A object was found!'); }
            });
          };
        }).then(function () {
          var obj = new db[personType.name]({
            name: 'test',
          });

          return obj.save({ refresh: true });
        }).then(function (obj) {
          expect(obj.name).equals('test');
        });
      });
    });

    describe('onUpdate', function () {
      it('should call handler', function () {
        return code.saveCode(entityType, 'update', function (module, exports) {
          exports.onUpdate = function (db, obj) {
            obj.name = 'updated ' + obj.name;
          };
        }).then(function () {
          var obj = new db[personType.name]({
            name: 'test',
          });

          return obj.insert({ refresh: true });
        }).then(function (obj) {
          expect(obj.name).equals('test');
          obj.name = 'new name';
          return obj.save({ refresh: true });
        }).then(function (obj) {
          expect(obj.name).equals('updated new name');
        });
      });

      it('should allow to load before image', function () {
        return code.saveCode(entityType, 'update', function (module, exports) {
          exports.onUpdate = function (db, obj) {
            return db[obj._metadata.type.name].load(obj.id, function (before) {
              obj.name += ' before ' + before.name;
              return obj;
            });
          };
        }).then(function () {
          var obj = new db[personType.name]({
            name: 'test',
          });

          return obj.save();
        }).then(function (obj) {
          obj.name = 'new name';
          return obj.save({ refresh: true });
        }).then(function (obj) {
          expect(obj.name).equals('new name before test');
        });
      });
    });

    describe('onDelete', function () {
      it('should call handler', function () {
        return expect(code.saveCode(entityType, 'delete', function (module, exports) {
          exports.onDelete = function (db, obj) {
            throw new Abort('Delete not accepted.');
          };
        }).then(function () {
          var obj = new db[personType.name]({
            name: 'test',
          });

          return obj.save();
        }).then(function (obj) {
          expect(obj.name).equals('test');
          return obj.delete();
        })).be.rejectedWith('Delete not accepted.');
      });

      it('should allow to load before image', function () {
        return code.saveCode(entityType, 'delete', function (module, exports) {
          exports.onDelete = function (db, obj) {
            return db[obj._metadata.type.name].load(obj.id, function (obj) {
              if (obj.name !== 'test') { throw new Abort('name was ' + obj.name + ' not test'); }
            });
          };
        }).then(function () {
          var obj = new db[personType.name]({
            name: 'test',
          });

          return obj.save();
        }).then(function (obj) {
          return obj.delete();
        });
      });

      it('should be abortable', function () {
        return expect(code.saveCode(entityType, 'delete', function (module, exports) {
          exports.onDelete = function (db, obj) {
            throw new Abort('delete not permitted');
          };
        }).then(function () {
          var obj = new db[personType.name]({
            name: 'test',
          });

          return obj.save();
        }).then(function (obj) {
          return obj.delete();
        })).be.rejectedWith('delete not permitted');
      });
    });

    describe('onValidate', function () {
      it('should call handler', function () {
        return code.saveCode(entityType, 'validate', function (name) {
          name.equals('String is not valid', 'test');
        }).then(function () {
          var obj = new db[personType.name]({
            name: 'test',
          });

          return obj.save();
        }).then(function (obj) {
          obj.name = 'new name';
          return obj.save();
        }).catch(function (e) {
          expect(e.message).contain('Object is not valid');
          return e.data;
        })
          .then(function (result) {
            expect(result.name.isValid).be.false;
            expect(result.name.errors[0]).equals('String is not valid');
          });
      });

      it('should run in own scope', function () {
        // Explicitly using undefined global variable "val" to test failing code validation
        return code.saveCode(entityType, 'validate', function (name) {
          setTimeout(function () {
            // eslint-disable-next-line no-undef
            val += 1;
          }, 300);
        }).then(function () {
          var obj = new db[personType.name]({
            name: 'test',
          });

          return obj.save();
        }).then(function () {
          expect(true).be.false;
        }, function (e) {
          expect(e.status).equals(500);
        });
      });
    });
  });

  describe('modules', function () {
    var fn, bucket;

    before(function () {
      fn = function (module, exports) {
        exports.call = function (db, data) {
          return {
            test: 'test',
            this: data,
          };
        };
      };
      bucket = helper.randomize('code.Test');
      db = emf.createEntityManager();
      code = db.code;
      entityType = db.metamodel.entity(personType.typeConstructor);
    });

    beforeEach(function () {
      return code.saveCode(bucket, 'module', fn).then(function (saved) {
        var module = { exports: {} };
        saved(module, module.exports);
        expect(module.exports.call).be.a('function');
      });
    });

    afterEach(function () {
      return code.deleteCode(bucket, 'module');
    });

    it('should load code', function () {
      return code.loadCode(bucket, 'module', true).then(function (loaded) {
        var module = { exports: {} };
        loaded(module, module.exports);
        expect(module.exports.call).be.a('function');
      });
    });

    it('should return string', function () {
      var fn = function (module, exports) {
        exports.call = function (db, data) {
          return 'test';
        };
      };

      return code.saveCode(bucket, 'module', fn).then(function () {
        return db.modules.get(bucket);
      }).then(function (returned) {
        expect(returned).equals('test');
      });
    });

    it('should return array', function () {
      var fn = function (module, exports) {
        exports.call = function (db, data) {
          return ['test'];
        };
      };

      return code.saveCode(bucket, 'module', fn).then(function () {
        return db.modules.get(bucket);
      }).then(function (returned) {
        expect(returned).eqls(['test']);
      });
    });

    it('should run code', function () {
      var obj = { foo: 'bar' };
      return db.modules.post(bucket, obj).then(function (result) {
        expect(result.this.foo).eqls(obj.foo);
      });
    });

    it('should delete code', function () {
      return code.deleteCode(bucket, 'module').then(function () {
        return expect(code.loadCode(bucket, 'module')).become(null);
      });
    });

    it('should load list of code resources', function () {
      return code.saveCode(bucket, 'module', function (module, exports) {
        exports.call = function () { return 'yeah'; };
      }).then(function () {
        return expect(code.loadModules()).to.eventually.include('/code/' + bucket + '/module');
      }).then(function () {
        return code.deleteCode(bucket, 'module');
      });
    });

    it('should run code by get request', function () {
      return code.saveCode(bucket, 'module', function (module, exports) {
        exports.call = function () { return 'yeah'; };
      }).then(function () {
        return db.modules.get(bucket);
      }).then(function (result) {
        expect(result).eqls('yeah');
      });
    });

    it('should allow require in baqend code', function () {
      return code.saveCode(bucket, 'module', function (module, exports) {
        var http = require('http');

        exports.call = function () { return { ready: !!http.get }; };
      }).then(function () {
        return db.modules.get(bucket);
      }).then(function (result) {
        expect(result.ready).be.true;
      });
    });

    it('should accept query object', function () {
      return code.saveCode(bucket, 'module', function (module, exports) {
        exports.call = function (db, data) { return data.first + ' ' + data.last; };
      }).then(function () {
        return db.modules.get(bucket, { first: 'firstName', last: 'lastName' });
      }).then(function (result) {
        expect(result).eqls('firstName lastName');
      });
    });

    it('should accept provide data as requestType', function () {
      return code.saveCode(bucket, 'module', function (module, exports) {
        exports.call = function (db, data) { return '{"test": true}'; };
      }).then(function () {
        return db.modules.get(bucket, {}, { responseType: 'json' });
      }).then(function (result) {
        expect(result).eqls({ test: true });
      });
    });

    it('should accept string parameter', function () {
      return code.saveCode(bucket, 'module', function (module, exports) {
        exports.call = function (db, data) { return data; };
      }).then(function () {
        return db.modules.post(bucket, 'yeah');
      }).then(function (result) {
        expect(result).eqls('yeah');
      });
    });

    it('should accept array parameter', function () {
      return code.saveCode(bucket, 'module', function (module, exports) {
        exports.call = function (db, data) { return data; };
      }).then(function () {
        return db.modules.post(bucket, ['yeah']);
      }).then(function (result) {
        expect(result).eqls(['yeah']);
      });
    });

    if (typeof Blob !== 'undefined' && !helper.isIE11) {
      it('should accept blob parameter', function () {
        var asset;

        return code.saveCode(bucket, 'module', binaryNodeHandler).then(function () {
          return helper.asset('flames.png');
        }).then(function (blob) {
          asset = blob;
          return db.modules.post(bucket, blob, { responseType: 'blob' });
        }).then(function (result) {
          expect(result).eqls(asset);
        });
      });

      it('should accept base64 parameter', function () {
        var svgBase64 = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxwYXRoIGQ9Im0wLDB2MWgxVjAiLz48L3N2Zz4=';
        var mimeType = 'image/svg+xml';

        return code.saveCode(bucket, 'module', binaryNodeHandler).then(function () {
          return db.modules.post(bucket, svgBase64, { requestType: 'base64', mimeType: mimeType, responseType: 'data-url' });
        }).then(function (result) {
          expect(result).string('data:' + mimeType);
          expect(result).string(svgBase64);
        });
      });
    }

    function binaryNodeHandler(module, exports) {
      exports.post = function (db, req, res) {
        return new Promise(function (success) {
          var chunks = [];
          req.on('data', function (chunk) {
            chunks.push(chunk);
          });
          req.on('end', function () {
            res.status(200)
              .type(req.get('Content-Type'))
              .send(Buffer.concat(chunks));
            success();
          });
        });
      };
    }
  });
});
