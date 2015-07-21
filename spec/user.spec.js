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

  before(function() {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    return emf.metamodel.init().then(function(metamodel) {
      var userEntity = metamodel.entity("User");
      if(!userEntity.getAttribute("email")) {
        userEntity.addAttribute(new DB.metamodel.SingularAttribute("email", metamodel.baseType(String)));
        return saveMetamodel(metamodel);
      }
    });
  });

  beforeEach(function() {
    db = emf.createEntityManager();
  });

  describe('user factory', function() {
    it('should have methods', function() {
      expect(db.User).be.ok;
      expect(db.User.register).be.ok;
      expect(db.User.login).be.ok;
      expect(db.User.logout).be.ok;
      expect(db.User.newPassword).be.ok;
    });

    it('should register and login a new user', function() {
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function(user) {
        expect(user).be.ok;
        expect(DB.binding.User.isInstance(user)).be.true;
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

    it('should not set token and me', function() {
      var user = db.User({ username: makeLogin(), email: "test@mail.de" });
      return db.User.logout().then(function() {
        return db.User.register(user, 'secret', false);
      }).then(function() {
        expect(db.me).not.ok;
        expect(db.token).not.ok;
      });
    });

    it('should register user from object', function() {
      var user = db.User({ username: makeLogin(), email: "test@mail.de" });
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

    it('should logout user', function() {
      expect(db.isGlobal).be.false;
      var login = makeLogin();
      return db.User.register(login, 'secret').then(function() {
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
      return db.User.register(login, 'secret').then(function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, 1500);
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
          setTimeout(resolve, 1100);
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
          setTimeout(resolve, 1100);
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

    it('should change password of inserted user', function() {
      var name = makeLogin();
      var newUser = db.User.fromJSON({
        username: name
      });
      var oldToken;
      return db.User.login('root', 'root', function() {
        oldToken = db.token;
        return newUser.save();
      }).then(function() {
        return db.User.newPassword(name, "", "newPassword").then(function() {return db.User.logout();});
      }).then(function() {
        return expect(db.User.login(name, "newPassword")).be.fulfilled;
      }).then(function() {
        expect(db.me.username).eqls(name);
        expect(db.token).not.eqls(oldToken);
      });
    });

    it('should not be allowed to login on inserted user', function() {
      var name = makeLogin();
      var newUser = db.User.fromJSON({
        username: name
      });
      var oldToken;
      return db.User.login('root', 'root', function() {
        oldToken = db.token;
        return newUser.save().then(function() { return db.User.logout(); });
      }).then(function() {
        return expect(db.User.login(name, "")).be.rejected;
      });
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

    if(typeof global != "undefined") {
      it('should remove cookie if password has been changed', function() {
        var login = makeLogin();
        return DB.User.register(login, 'secret').then(function() {
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve();
            }, 1100);
          });
        }).then(function() {
          return db.User.login(login, 'secret');
        }).then(function() {
          return db.me.newPassword('secret', 'newSecret');
        }).then(function() {
          expect(DB._connector.cookie).be.ok;
          return DB.renew();
        }).then(function() {
          expect(DB._connector.cookie).be.null;
        });
      });

      it('should remove cookie if token is invalid', function() {
        var login = makeLogin();
        return DB.User.register(login, 'secret').then(function() {
          expect(DB._connector.cookie).be.ok;
          DB._connector.cookie = DB._connector.cookie.replace(/.{1}$/, DB._connector.cookie.substr(0, DB._connector.cookie.length) == '0'? '1': '0');
          return DB.renew();
        }).then(function(user) {
          expect(user).be.null;
          expect(DB._connector.cookie).be.null;
        });
      });

      it('should not remove cookie if not global', function() {
        var login = makeLogin();
        var oldCookie;
        return DB.User.register(login, 'secret').then(function() {
          return db.User.login(login, 'secret');
        }).then(function() {
          expect(DB._connector.cookie).be.ok;
          oldCookie = DB._connector.cookie;
          db.token = db.token.replace(/.{1}$/, db.token.substr(0, db.token.length) == '0'? '1': '0');
          return db.renew();
        }).then(function(user) {
          expect(user).be.null;
          expect(DB._connector.cookie).eqls(oldCookie);
        });
      });

    }

    it('should use cookie if global', function() {
      var login = makeLogin();
      return DB.User.register(login, 'secret').then(function() {
        expect(DB.isGlobal).be.true;
        expect(DB.me).be.ok;
        expect(DB.token).be.ok;
        return DB.renew();
      });
    });

    it('should remove cookie if global', function() {
      var login = makeLogin();
      return DB.User.register(login, 'secret').then(function() {
        expect(DB.isGlobal).be.true;
        expect(DB.me).be.ok;
        expect(DB.token).be.ok;
        return DB.logout();
      }).then(function() {
        return expect(DB.renew()).become(null);
      });
    });

    it('should autologin on global instances', function() {
      var login = makeLogin();
      return DB.User.register(login, 'secret').then(function() {
        var db = DB.entityManagerFactory.createEntityManager(true);
        return db.ready().then(function() {
          expect(db.me).be.ok;
          expect(db.token).be.ok;
        });
      });
    });

    it('should not autologin on global instances', function() {
      var db = DB.entityManagerFactory.createEntityManager(true);
      return db.ready().then(function() {
        expect(db.me).be.not.ok;
        expect(db.token).be.not.ok;
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
      return db.User.register(login, 'secret').then(function() {
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