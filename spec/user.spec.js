if (typeof jspa == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  expect = chai.expect;
  jspa = require('../lib');
}

describe('Test user and roles', function() {
  var emf, db;

  before(function() {
    emf = new jspa.EntityManagerFactory(env.TEST_SERVER);
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
        expect(jspa.binding.User.isInstance(user)).be.true;
        expect(user._metadata.id).be.ok;
        expect(user._metadata.version).be.ok;
        expect(user._metadata.isPersistent).be.true;
        expect(user._metadata.isDirty).be.false;
        expect(user.username).equals(login);
        expect(user.password).be.undefined;
        expect(user).equals(db.User.me);
        expect(db._token).be.ok;
      });
    });

    it('should logout an user', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function(user) {
        return db.User.logout();
      }).then(function() {
        expect(db.User.me).be.null;
        expect(db._token).be.null;
      });
    });

    it('should not register a user twice', function() {
      var login = makeLogin();
      db.User.register(login, 'secret').then(function(user) {
        expect(user.username).be.equals(login);
      });

      expect(function() {
        db.User.register(login, 'secret')
      }).throw(Error);
    });

    it('should not register an existing user', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function(user) {
        return db.User.logout();
      }).then(function() {
        return expect(db.User.register(login, 'secret')).be.rejected;
      }).then(function() {
        expect(db._token).be.null;
        expect(db.User.me).be.null;
      });
    });

    it('should login with valid credentials', function() {
      var login = makeLogin();
      var user;
      return db.User.register(login, 'secret').then(function(u) {
        user = u;

        expect(user).be.ok;
        expect(jspa.binding.User.isInstance(user)).be.true;
        expect(user._metadata.id).be.ok;
        expect(user._metadata.version).be.ok;
        expect(user._metadata.isPersistent).be.true;
        expect(user._metadata.isDirty).be.false;
        expect(user.username).equals(login);
        expect(user.password).be.undefined;
        expect(user).equals(db.User.me);
        expect(db._token).be.ok;

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
        expect(db.User.login(login, 'hackit')).be.rejected;
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
        db.User.login(login, 'secret');
        expect(function() {
          db.User.login(login, 'secret');
        }).throw(Error);
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

      return jspa.Q.all([user1.insert(), user2.insert(), user3.insert()]);
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
    })
  });


  function makeLogin() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return 'user-' + text;
  }
});