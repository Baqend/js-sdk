'use strict';

var DB;
if (typeof module !== 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Permissions', function () {
  var emf, role1, user1, role2, user2;

  before(function () {
    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage });
    return emf.createEntityManager().ready().then(function (db) {
      role1 = db.Role.ref('/db/Role/1');
      user1 = db.User.ref('/db/User/1');
      role2 = db.Role.ref('/db/Role/2');
      user2 = db.User.ref('/db/User/2');
    });
  });

  it('is created empty', function () {
    var permission = new DB.util.Permission();
    expect(permission.rules).to.eql({});
  });

  it('is clearable', function () {
    var permission = new DB.util.Permission();
    expect(permission.rules).to.eql({});

    permission.rules = { '*': 'deny' };
    expect(permission.rules).to.eql({ '*': 'deny' });

    permission.clear();
    expect(permission.rules).to.eql({});
  });

  it('allows everything by default', function () {
    var permission = new DB.util.Permission();
    expect(permission.rules).to.eql({});
    expect(permission.isAccessAllowed(role1)).to.be.true;
    expect(permission.isAccessAllowed(user1)).to.be.true;
    expect(permission.isAccessAllowed(role2)).to.be.true;
    expect(permission.isAccessAllowed(user2)).to.be.true;
    expect(permission.isAccessDenied(role1)).to.be.false;
    expect(permission.isAccessDenied(user1)).to.be.false;
    expect(permission.isAccessDenied(role2)).to.be.false;
    expect(permission.isAccessDenied(user2)).to.be.false;
  });

  it('allows single users or roles', function () {
    var permission = new DB.util.Permission();
    expect(permission.rules).to.eql({});
    expect(permission.isAccessAllowed(role1)).to.be.true;
    expect(permission.isAccessAllowed(user1)).to.be.true;
    expect(permission.isAccessAllowed(role2)).to.be.true;
    expect(permission.isAccessAllowed(user2)).to.be.true;
    expect(permission.isAccessDenied(role1)).to.be.false;
    expect(permission.isAccessDenied(user1)).to.be.false;
    expect(permission.isAccessDenied(role2)).to.be.false;
    expect(permission.isAccessDenied(user2)).to.be.false;

    expect(permission.isAllowed(role1)).to.be.false;
    permission.allowAccess(role1);
    expect(permission.rules).to.eql({ '/db/Role/1': 'allow' });
    expect(permission.isAllowed(role1)).to.be.true;
    expect(permission.isAccessAllowed(role1)).to.be.true;
    expect(permission.isAccessAllowed(user1)).to.be.false;
    expect(permission.isAccessAllowed(role2)).to.be.false;
    expect(permission.isAccessAllowed(user2)).to.be.false;
    expect(permission.isAccessDenied(role1)).to.be.false;
    expect(permission.isAccessDenied(user1)).to.be.true;
    expect(permission.isAccessDenied(role2)).to.be.true;
    expect(permission.isAccessDenied(user2)).to.be.true;
  });

  it('denies single users or roles', function () {
    var permission = new DB.util.Permission();
    expect(permission.rules).to.eql({});
    expect(permission.isAccessAllowed(role1)).to.be.true;
    expect(permission.isAccessAllowed(user1)).to.be.true;
    expect(permission.isAccessAllowed(role2)).to.be.true;
    expect(permission.isAccessAllowed(user2)).to.be.true;
    expect(permission.isAccessDenied(role1)).to.be.false;
    expect(permission.isAccessDenied(user1)).to.be.false;
    expect(permission.isAccessDenied(role2)).to.be.false;
    expect(permission.isAccessDenied(user2)).to.be.false;

    expect(permission.isDenied(role1)).to.be.false;
    permission.denyAccess(role1);
    expect(permission.rules).to.eql({ '/db/Role/1': 'deny' });
    expect(permission.isDenied(role1)).to.be.true;
    expect(permission.isAccessAllowed(role1)).to.be.false;
    expect(permission.isAccessAllowed(user1)).to.be.true;
    expect(permission.isAccessAllowed(role2)).to.be.true;
    expect(permission.isAccessAllowed(user2)).to.be.true;
    expect(permission.isAccessDenied(role1)).to.be.true;
    expect(permission.isAccessDenied(user1)).to.be.false;
    expect(permission.isAccessDenied(role2)).to.be.false;
    expect(permission.isAccessDenied(user2)).to.be.false;
  });
});
