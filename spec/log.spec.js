'use strict';

var DB;
if (typeof module !== 'undefined') {
  require('./node');
  DB = require('../');
}

describe('Test logging', function () {
  this.timeout(4000);

  var sleepTime = 1000;

  var db, emf, rootDb;

  before(function () {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);

    return emf.createEntityManager().ready().then(function (em) {
      return em.User.login('root', 'root').then(function () {
        rootDb = em;
      });
    });
  });

  beforeEach(function () {
    db = emf.createEntityManager();
  });

  it('should contains all values', function () {
    var start = new Date();

    var msg = helper.randomize('my string');
    db.log(msg);

    return findLogByMessage(msg).then(function (entry) {
      expect(entry.date).within(start, new Date());
      expect(entry.message).equal(msg);
      expect(entry.level).equal('info');
      expect(entry.data).be.null;
      expect(entry.user).be.null;
    });
  });

  it('should substitute string in message', function () {
    var msg = helper.randomize('my string');
    db.log('test message %s', msg);

    return findLogByMessage('test message ' + msg).then(function (entry) {
      expect(entry.message).equal('test message ' + msg);
    });
  });

  it('should substitute number in message', function () {
    var str = helper.randomize('my string');
    db.log('test message %d and %s', 5, str);

    return findLogByMessage('test message 5 and ' + str).then(function (entry) {
      expect(entry.message).equal('test message 5 and ' + str);
    });
  });

  it('should substitute json in message', function () {
    var json = { str: helper.randomize('my string ') };
    db.log('test message %j', json);

    var msg = 'test message {"str":"' + json.str + '"}';
    return findLogByMessage(msg).then(function (entry) {
      expect(entry.message).equal(msg);
    });
  });

  it('should handle explicit log level', function () {
    var msg = helper.randomize('my string ');
    db.log('warn', msg);

    return findLogByMessage(msg).then(function (entry) {
      expect(entry.message).equal(msg);
      expect(entry.level).equal('warn');
    });
  });

  it('should ignore supressed log levels', function () {
    var msg = helper.randomize('my string ');
    db.log('debug', msg);

    return findLogByMessage(msg).then(function (entry) {
      expect(entry).be.null;
    });
  });

  it('should save additional data', function () {
    var msg = helper.randomize('my string ');
    db.log('info', msg, { value: 34, str: 'Test String' });

    return findLogByMessage(msg).then(function (entry) {
      expect(entry.message).equal(msg);
      expect(entry.data).eql({ value: 34, str: 'Test String' });
    });
  });

  it('should save additional array data', function () {
    var msg = helper.randomize('my string ');
    db.log('info', msg, [34, 'Test String']);

    return findLogByMessage(msg).then(function (entry) {
      expect(entry.message).equal(msg);
      expect(entry.data).eql({ data: [34, 'Test String'] });
    });
  });

  it('should save additional error data', function () {
    var msg = helper.randomize('my error message ');
    var error = new Error('Test error message');
    db.log('info', msg, error);

    return findLogByMessage(msg).then(function (entry) {
      expect(entry.message).equal(msg);
      expect(entry.data.name).equal(error.name);
      expect(entry.data.message).equal('Test error message');
      expect(entry.data.stack).equal(error.stack);
    });
  });

  it('should save logs without message', function () {
    db.log({ value: 'Test String' });

    return findLogByMessage('[no message]').then(function (entry) {
      expect(entry.message).equal('[no message]');
      expect(entry.data).eql({ value: 'Test String' });
    });
  });

  it('should allow different log levels', function () {
    var msg = helper.randomize('my string ');
    db.log.level = 'debug';
    db.log('debug', msg);

    return findLogByMessage(msg).then(function (entry) {
      expect(entry.message).equal(msg);
      expect(entry.level).equal('debug');
    });
  });

  it('should provide log level helpers', function () {
    var msg = helper.randomize('my string ');
    db.log.level = 'trace';

    db.log.trace(msg);
    db.log.debug(msg);
    db.log.info(msg);
    db.log.warn(msg);
    db.log.error(msg);

    return findLogsByMessage(msg).then(function (entries) {
      expect(entries).length(5);
      expect(entries.some(function (entry) { return entry.level === 'trace'; })).ok;
      expect(entries.some(function (entry) { return entry.level === 'debug'; })).ok;
      expect(entries.some(function (entry) { return entry.level === 'info'; })).ok;
      expect(entries.some(function (entry) { return entry.level === 'warn'; })).ok;
      expect(entries.some(function (entry) { return entry.level === 'error'; })).ok;
    });
  });

  it('should provide log level helpers', function () {
    var msg = helper.randomize('my string ');
    db.log.level = 'trace';

    db.log.trace(msg);
    db.log.debug(msg);
    db.log.info(msg);
    db.log.warn(msg);
    db.log.error(msg);

    return findLogsByMessage(msg).then(function (entries) {
      expect(entries).length(5);
      expect(entries.some(function (entry) { return entry.level === 'trace'; })).ok;
      expect(entries.some(function (entry) { return entry.level === 'debug'; })).ok;
      expect(entries.some(function (entry) { return entry.level === 'info'; })).ok;
      expect(entries.some(function (entry) { return entry.level === 'warn'; })).ok;
      expect(entries.some(function (entry) { return entry.level === 'error'; })).ok;
    });
  });

  it('should protected log access by anonymous', function () {
    var msg = helper.randomize('my string ');
    db.log('warn', msg);

    return expect(helper.sleep(sleepTime).then(function () {
      return db['logs.AppLog'].find().equal('message', msg).singleResult();
    })).rejectedWith(Error);
  });

  it('should queue logs while connecting', function () {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);

    var db = emf.createEntityManager();
    expect(db.isReady).be.false;

    var msg1 = helper.randomize('my string ');
    db.log.warn(msg1);

    var msg2 = helper.randomize('my string ');
    db.log.info(msg2);

    return db.ready().then(function (em) {
      return Promise.all([
        findLogByMessage(msg1).then(function (entry) {
          expect(entry.message).equal(msg1);
        }),
        findLogByMessage(msg2).then(function (entry) {
          expect(entry.message).equal(msg2);
        }),
      ]);
    });
  });

  it('should log additional parameters', function () {
    var msg = helper.randomize('my string');
    db.log('test message %s', msg, 'test1', 2, true);

    return findLogByMessage('test message ' + msg + ', test1, 2').then(function (entry) {
      expect(entry.message).equal('test message ' + msg + ', test1, 2');
      expect(entry.data).eql({ data: true });
    });
  });


  function findLogByMessage(msg) {
    return helper.sleep(sleepTime).then(function () {
      return rootDb['logs.AppLog'].find().equal('message', msg).singleResult();
    });
  }

  function findLogsByMessage(msg) {
    return helper.sleep(sleepTime).then(function () {
      return rootDb['logs.AppLog'].find().equal('message', msg).resultList();
    });
  }
});
