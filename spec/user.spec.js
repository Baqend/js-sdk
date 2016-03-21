if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  expect = chai.expect;
  DB = require('../lib');
}

describe('Test user and roles', function() {
  var emf, db;
  var RENEW_TIMEOUT = 2000;
  this.timeout(RENEW_TIMEOUT * 2);

  this.timeout(RENEW_TIMEOUT * 2);

  before(function() {
    emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: rootTokenStorage});
    return emf.createEntityManager().ready().then(function() {
      var userEntity = emf.metamodel.entity("User");
      if(!userEntity.getAttribute("email")) {
        userEntity.addAttribute(new DB.metamodel.SingularAttribute("email", emf.metamodel.baseType(String)));
        return emf.metamodel.save();
      }
    });
  });

  beforeEach(function() {
    db = emf.createEntityManager();
    return db.ready();
  });

  describe('user factory', function() {
    it('should have methods', function() {
      expect(db.User).be.ok;
      expect(db.User.register).be.ok;
      expect(db.User.login).be.ok;
      expect(db.User.logout).be.ok;
      expect(db.User.newPassword).be.ok;
    });

    it('should not share the tokenStorage with the emf', function() {
      expect(db.tokenStorage).not.equal(emf.tokenStorage);
    });

    it('should share the tokenStorage with the emf if createEm is true', function() {
      var db = emf.createEntityManager(true);
      expect(db.tokenStorage).equal(emf.tokenStorage);
    });

    it('should register and login a new user', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function(user) {
        expect(user).be.ok;
        expect(DB.binding.User.isInstance(user)).be.true;
        expect(user.id).be.ok;
        expect(user.version).be.ok;
        expect(user._metadata.isPersistent).be.true;
        expect(user._metadata.isDirty).be.false;
        expect(user.username).equals(login);
        expect(user.password).be.undefined;
        expect(user).equals(db.User.me);
        expect(db.token).be.ok;
      });
    });

    it('should not set token and me when loginOption is NO_LOGIN', function() {
      var user = new db.User({ username: makeLogin(), email: "test@mail.de" });
      db.User.register(user, 'secret', db.User.LoginOption.NO_LOGIN).then(function() {
        expect(db.me).not.ok;
        expect(db.token).not.ok;
      });
    });

    it('should register user from object', function() {
      var user = new db.User({ username: makeLogin(), email: "test@mail.de" });
      return db.User.register(user, 'secret').then(function(loaded) {
        expect(loaded.username).eqls(user.username);
        expect(loaded.email).eqls("test@mail.de");
      });
    });

    it('should fail to register if username is missing', function() {
      var user = { foobar: makeLogin() };
      return expect(db.User.register(user, 'secret')).be.rejected;
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
        expect(DB.binding.User.isInstance(user)).be.true;
        expect(user.id).be.ok;
        expect(user.version).be.ok;
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

    it('should logout user', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function() {
        expect(db.token).be.ok;
        expect(db.User.me).be.ok;
        return db.logout();
      }).then(function() {
        expect(db.token).be.null;
        expect(db.User.me).be.null;
      });
    });

    it('should renew user token', function() {
      var login = makeLogin();
      var oldToken;
      return db.User.register(login, 'secret').then(function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, RENEW_TIMEOUT);
        });
      }).then(function() {
        expect(db.token).be.ok;
        oldToken = db.token;
        return db.renew();
      }).then(function() {
        expect(db.token).not.eqls(oldToken);
      });
    });

    it('should change password', function() {
      var oldLogin = makeLogin();
      var oldToken;
      return db.User.register(oldLogin, "secret").then(function() {
        oldToken = db.token;
        return new Promise(function(resolve) {
          setTimeout(resolve, RENEW_TIMEOUT);
        });
      }).then(function() {
        return db.me.newPassword("secret", "newSecret");
      }).then(function() {
        expect(oldToken).not.eqls(db.token);
        return db.User.logout();
      }).then(function() {
        return db.User.login(oldLogin, "newSecret");
      }).then(function() {
        return db.User.logout();
      }).then(function() {
        return expect(db.User.login(oldLogin, "secret")).be.rejected;
      });
    });

    it('should be allowed to change password as root', function() {
      var oldLogin = makeLogin();
      var oldToken;
      return db.User.register(oldLogin, "secret").then(function() {
        oldToken = db.token;
        return new Promise(function(resolve) {
          setTimeout(resolve, RENEW_TIMEOUT);
        }).then(function() { return db.User.logout() });
      }).then(function() {
        return db.User.login("root", "root");
      }).then(function() {
        expect(db.me.username).eqls("root");
        return db.User.newPassword(oldLogin, "", "newSecret");
      }).then(function() {
        expect(db.me.username).eqls("root");
        return db.User.logout();
      }).then(function() {
        return expect(db.User.login(oldLogin, "newSecret")).be.fulfilled.then(function() { return db.User.logout() });
      }).then(function() {
        return expect(db.User.login(oldLogin, "secret")).be.rejected;
      });
    });

    it('should not be allowed to insert user', function() {
      var name = makeLogin();
      var newUser = db.User.fromJSON({
        username: name
      });

      return expect(newUser.save()).be.rejected;
    });

    it('should not be allowed to register with an empty password', function() {
      return expect(db.User.register(makeLogin(), "")).be.rejected;
    });
  });

  describe('on global DB', function() {
    before(function() {
      if (!DB.isReady)
        DB.connect(env.TEST_SERVER);

      return DB.ready().then(function() {
        return DB.logout();
      });
    });

    afterEach(function() {
      return DB.logout();
    });

    it('should remove token if password has been changed', function() {
      var login = makeLogin();
      return DB.User.register(login, 'secret').then(function() {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve();
          }, RENEW_TIMEOUT);
        });
      }).then(function() {
        return db.User.login(login, 'secret');
      }).then(function() {
        return db.me.newPassword('secret', 'newSecret');
      }).then(function() {
        expect(DB.tokenStorage.get(DB._connector.origin)).be.ok;
        return DB.renew();
      }).then(function() {
        expect(DB.tokenStorage.get(DB._connector.origin)).be.null;
        expect(DB.User.me).be.null;
        expect(DB.token).be.null;
      });
    });

    it('should remove cookie if token is invalid', function() {
      var login = makeLogin();
      return DB.User.register(login, 'secret').then(function() {
        var token = DB.tokenStorage.get(DB._connector.origin);
        expect(token).be.ok;
        DB.tokenStorage.update(DB._connector.origin, token.replace(/.{1}$/, token.substr(0, token.length) == '0'? '1': '0'));
        return DB.renew();
      }).then(function(user) {
        expect(user).be.null;
        expect(DB.tokenStorage.get(DB._connector.origin)).be.null;
        expect(DB.User.me).be.null;
        expect(DB.token).be.null;
      });
    });

    it('should not remove token if not global', function() {
      var login = makeLogin();
      var oldToken;
      return DB.User.register(login, 'secret').then(function() {
        return db.User.login(login, 'secret');
      }).then(function() {
        expect(DB.token).be.ok;
        oldToken = DB.token;
        db.token = db.token.replace(/.{1}$/, db.token.substr(0, db.token.length) == '0'? '1': '0');
        return db.renew();
      }).then(function(user) {
        expect(user).be.null;
        expect(DB.token).eqls(oldToken);
      });
    });

    it('should use global storage if tokenStorage is true', function() {
      var login = makeLogin();
      return DB.User.register(login, 'secret').then(function() {
        expect(DB.tokenStorage).eqls(DB.entityManagerFactory.tokenStorage);
        expect(DB.me).be.ok;
        expect(DB.token).be.ok;
        return DB.renew();
      });
    });

    it('should remove token by logout if tokenStorage is true', function() {
      var login = makeLogin();
      return DB.User.register(login, 'secret').then(function() {
        expect(DB.tokenStorage).eqls(DB.entityManagerFactory.tokenStorage);
        expect(DB.me).be.ok;
        expect(DB.token).be.ok;
        return DB.logout();
      }).then(function() {
        return expect(DB.renew()).become(null);
      });
    });

    it('should autologin on when tokenStorage is true', function() {
      var login = makeLogin();
      return DB.User.register(login, 'secret').then(function() {
        var db = new DB.EntityManagerFactory(env.TEST_SERVER).createEntityManager(true);
        return db.ready().then(function() {
          expect(db.me).be.ok;
          expect(db.token).be.ok;
        });
      });
    });

    it('should not autologin when tokenStorage is false', function() {
      var login = makeLogin();
      return DB.User.register(login, 'secret').then(function() {
        var db = new DB.EntityManagerFactory(env.TEST_SERVER).createEntityManager();
        return db.ready().then(function() {
          expect(db.me).be.not.ok;
          expect(db.token).be.not.ok;
        });
      });
    });

    if (typeof localStorage !== "undefined") {
      it('should save token in session storage when register loginOption is false', function() {
        var user = new DB.User({ username: makeLogin(), email: "test@mail.de" });
        return DB.User.register(user, 'secret', false).then(function(u) {
          expect(u.username).eqls(user.username);
          expect(u.email).eqls("test@mail.de");
          expect(localStorage.getItem('BAT:' + db._connector.origin)).be.not.ok;
          expect(sessionStorage.getItem('BAT:' + db._connector.origin)).be.ok;
        });
      });

      it('should save token in local storage when register loginOption is true', function() {
        var user = new DB.User({ username: makeLogin(), email: "test@mail.de" });
        return DB.User.register(user, 'secret', true).then(function(u) {
          expect(u.username).eqls(user.username);
          expect(u.email).eqls("test@mail.de");
          expect(localStorage.getItem('BAT:' + db._connector.origin)).be.ok;
          expect(sessionStorage.getItem('BAT:' + db._connector.origin)).be.not.ok;
        });
      });

      it('should save token in session storage when login loginOption is false', function() {
        var username =  makeLogin();
        var user = new DB.User({ username: username, email: "test@mail.de" });
        return DB.User.register(user, 'secret', db.User.LoginOption.NO_LOGIN).then(function() {
          return DB.User.login(username, 'secret', false);
        }).then(function(u) {
          expect(u.username).eqls(user.username);
          expect(u.email).eqls("test@mail.de");
          expect(localStorage.getItem('BAT:' + db._connector.origin)).be.not.ok;
          expect(sessionStorage.getItem('BAT:' + db._connector.origin)).be.ok;
        });
      });

      it('should save token in local storage when login loginOption is true', function() {
        var username =  makeLogin();
        var user = new DB.User({ username: username, email: "test@mail.de" });
        return DB.User.register(user, 'secret', db.User.LoginOption.NO_LOGIN).then(function() {
          return DB.User.login(username, 'secret', true);
        }).then(function(u) {
          expect(u.username).eqls(user.username);
          expect(u.email).eqls("test@mail.de");
          expect(localStorage.getItem('BAT:' + db._connector.origin)).be.ok;
          expect(sessionStorage.getItem('BAT:' + db._connector.origin)).be.not.ok;
        });
      });
    }
  });

  describe('roles', function() {
    var user1, user2, user3;

    beforeEach(function() {
      user1 = new db.User();
      user1.username = makeLogin();

      user2 = new db.User();
      user2.username = makeLogin();

      user3 = new db.User();
      user3.username = makeLogin();

      return db.User.register(user1, user1.username, db.User.LoginOption.NO_LOGIN).then(function(usr) {
        user1 = usr;
        return db.User.register(user2, user2.username, db.User.LoginOption.NO_LOGIN);
      }).then(function(usr) {
        user2 = usr;
        return db.User.register(user3, user3.username, db.User.LoginOption.NO_LOGIN);
      }).then(function(usr) {
        user3 = usr;
      });
    });

    it('should save and load', function() {
      var role = new db.Role();
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
      return db.User.register(login, 'secret').then(function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, RENEW_TIMEOUT);
        });
      }).then(function() {
        oldToken = db.token;
        var role = new db.Role();
        role.addUser(user1);
        return role.insert();
      }).then(function() {
        expect(oldToken).not.eqls(db.token);
      });
    });
  });
});