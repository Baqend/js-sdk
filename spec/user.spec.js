if (typeof baqend == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  expect = chai.expect;
  baqend = require('../lib');
}

describe('Test user and roles', function() {
  var emf, db;

  before(function() {
    emf = new baqend.EntityManagerFactory(env.TEST_SERVER);
  });

  beforeEach(function() {
    return emf.createEntityManager(function(em) {
      db = em;
    });
  });

  describe('user factory', function() {
    it('should have methods', function() {
      expect(db.User).be.ok;
      expect(db.User.register).be.ok;
      expect(db.User.login).be.ok;
      expect(db.User.logout).be.ok;
    });

    it('should register and login a new user', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function(user) {
        expect(user).be.ok;
        expect(baqend.binding.User.isInstance(user)).be.true;
        expect(user._metadata.id).be.ok;
        expect(user._metadata.version).be.ok;
        expect(user._metadata.isPersistent).be.true;
        expect(user._metadata.isDirty).be.false;
        expect(user.username).equals(login);
        expect(user.password).be.undefined;
        expect(user).equals(db.User.me);
        expect(db.token).be.ok;
      });
    });

    it('should logout an user', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function(user) {
        return db.User.logout();
      }).then(function() {
        expect(db.User.me).be.null;
        expect(db.token).be.null;
      });
    });

    it('should not register a user twice', function() {
      var login = makeLogin();
      var promise = db.User.register(login, 'secret').then(function(user) {
        expect(user.username).be.equals(login);
      });

      expect(function() {
        db.User.register(login, 'secret')
      }).throw(Error);

      return promise;
    });

    it('should not register an existing user', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function(user) {
        return db.User.logout();
      }).then(function() {
        return expect(db.User.register(login, 'secret')).be.rejected;
      }).then(function() {
        expect(db.token).be.null;
        expect(db.User.me).be.null;
      });
    });

    it('should login with valid credentials', function() {
      var login = makeLogin();
      var user;
      return db.User.register(login, 'secret').then(function(u) {
        user = u;

        expect(user).be.ok;
        expect(baqend.binding.User.isInstance(user)).be.true;
        expect(user._metadata.id).be.ok;
        expect(user._metadata.version).be.ok;
        expect(user._metadata.isPersistent).be.true;
        expect(user._metadata.isDirty).be.false;
        expect(user.username).equals(login);
        expect(user.password).be.undefined;
        expect(user).equals(db.User.me);
        expect(db.token).be.ok;

        return db.User.logout();
      }).then(function() {
        return db.User.login(login, 'secret');
      }).then(function(u) {
        expect(user).equals(u);
      });
    });

    it('should not login an unknown user', function() {
      var login = makeLogin();
      expect(db.User.login(login, 'secret')).be.rejected;
    });

    it('should not login with invalid credentials', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function(u) {
        return db.User.logout();
      }).then(function() {
        return expect(db.User.login(login, 'hackit')).be.rejected;
      });
    });

    it('should not login twice', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function(u) {
        expect(function() {
          db.User.login(login, 'secret');
        }).throw(Error);
      }).then(function() {
        return db.User.logout();
      }).then(function() {
        return db.User.login(login, 'secret');
      }).then(function() {
        expect(function() {
          db.User.login(login, 'secret');
        }).throw(Error);
      });
    });

    it('should use cookie if global', function() {
      DB.connect && DB.connect(env.TEST_SERVER);
      return DB.ready().then(function() {
        var login = makeLogin();
        return DB.User.register(login, 'secret');
      }).then(function() {
        expect(DB.isGlobal).be.true;
        expect(DB.token).be.not.ok;
        return DB.renew();
      }).then(function() {
        return DB.logout();
      });
    });

    it('should remove cookie if global', function() {
      DB.connect && DB.connect(env.TEST_SERVER);
      return DB.ready().then(function() {
        var login = makeLogin();
        return DB.User.register(login, 'secret');
      }).then(function() {
        expect(DB.isGlobal).be.true;
        expect(DB.token).be.not.ok;
        return DB.logout();
      }).then(function() {
        return expect(DB.renew()).become(null);
      });
    });

    it('should logout user', function() {
      expect(db.isGlobal).be.false;
      var login = makeLogin();
      return db.register(login, 'secret').then(function() {
        expect(db.token).be.ok;
        expect(db.me).be.ok;
        return db.logout();
      }).then(function() {
        expect(db.token).be.not.ok;
        expect(db.me).be.not.ok;
      });
    });

    it('should renew user token', function() {
      expect(db.isGlobal).be.false;
      var login = makeLogin();
      var oldToken;
      return db.register(login, 'secret').then(function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, 1100);
        });
      }).then(function() {
        expect(db.token).be.ok;
        oldToken = db.token;
        return db.renew();
      }).then(function() {
        expect(db.token).not.eqls(oldToken);
      });
    });
  });

  describe('roles', function() {
    var user1, user2, user3;

    beforeEach(function() {
      user1 = db.User();
      user1.username = makeLogin();

      user2 = db.User();
      user2.username = makeLogin();

      user3 = db.User();
      user3.username = makeLogin();

      return Promise.all([user1.insert(), user2.insert(), user3.insert()]);
    });

    it('should save and load', function() {
      var role = db.Role();
      role.addUser(user1);
      role.addUser(user3);

      expect(role.hasUser(user1)).be.true;
      expect(role.hasUser(user2)).be.false;
      expect(role.hasUser(user3)).be.true;

      return role.insert().then(function() {
        expect(role.hasUser(user1)).be.true;
        expect(role.hasUser(user2)).be.false;
        expect(role.hasUser(user3)).be.true;

        role.removeUser(user1);
        role.addUser(user2);
        return role.save();
      }).then(function() {
        expect(role.hasUser(user1)).be.false;
        expect(role.hasUser(user2)).be.true;
        expect(role.hasUser(user3)).be.true;
      });
    });

    it('should renew token', function() {
      var login = makeLogin();
      var oldToken;
      return db.register(login, 'secret').then(function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, 1100);
        });
      }).then(function() {
        oldToken = db.token;
        var role = db.Role();
        role.addUser(user1);
        return role.insert();
      }).then(function() {
        expect(oldToken).not.eqls(db.token);
      });
    });
  });
});