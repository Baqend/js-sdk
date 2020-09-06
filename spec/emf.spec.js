'use strict';

if (typeof module !== 'undefined') {
  require('./node');
}

describe('Test EntityManagerFactory', function () {
  var emf, model = [
    {
      class: '/db/TestClass',
      fields: {
        testValue: {
          name: 'testValue',
          type: '/db/Integer',
        },
      },
    },
  ];

  beforeEach(function () {
    emf = new DB.EntityManagerFactory();
  });

  it('should connect to destination', function () {
    expect(emf.isReady).be.false;
    emf.connect(env.TEST_SERVER);

    var em = emf.createEntityManager();
    return em.ready().then(function () {
      expect(em.isReady).be.true;
    });
  });

  it('should reject connect to invalid destination', function () {
    this.timeout(30000);

    expect(emf.isReady).be.false;

    var connectPromise = emf.connect('http://example.test/');
    var em = emf.createEntityManager();

    return Promise.all([
      connectPromise.then(function () {
        expect(true).be.false;
      }, function (e) {
        expect(e).instanceOf(Error);
        expect(emf.isReady).be.false;
      }),

      emf.ready().then(function () {
        expect(true).be.false;
      }, function (e) {
        expect(e).instanceOf(Error);
        expect(emf.isReady).be.false;
      }),

      em.ready().then(function () {
        expect(true).be.false;
      }, function (e) {
        expect(e).instanceOf(Error);
        expect(em.isReady).be.false;
      }),
    ]);
  });

  it('should create ems before and after connect', function () {
    var ready = false;

    var em1 = emf.createEntityManager();
    expect(em1.isReady).be.false;
    var ready1 = em1.ready().then(function () {
      expect(em1.isReady).be.true;
      expect(ready).be.true;
    });

    expect(emf.isReady).be.false;
    emf.connect(env.TEST_SERVER);

    var em2 = emf.createEntityManager();
    expect(em1.isReady).be.false;
    expect(em2.isReady).be.false;
    var ready2 = em2.ready().then(function () {
      expect(em2.isReady).be.true;
      expect(ready).be.true;
    });

    emf.ready().then(function () {
      ready = true;
    });

    return Promise.all([ready1, ready2]);
  });

  it('should create ems after connect', function () {
    emf.connect(env.TEST_SERVER);

    var ready = false;

    var em1 = emf.createEntityManager();
    expect(em1.isReady).be.false;
    var ready1 = em1.ready().then(function () {
      expect(em1.isReady).be.true;
      expect(ready).be.true;
    });

    var em2 = emf.createEntityManager();
    expect(em2.isReady).be.false;
    var ready2 = em2.ready().then(function () {
      expect(em2.isReady).be.true;
      expect(ready).be.true;
    });

    emf.ready().then(function () {
      ready = true;
    });

    return Promise.all([ready1, ready2]);
  });

  it('should create async em after connect', function () {
    emf.connect(env.TEST_SERVER);

    var ready = false;
    emf.ready().then(function () {
      ready = true;
    });

    var em1 = emf.createEntityManager();
    expect(em1.isReady).be.false;
    var ready1 = em1.ready().then(function () {
      expect(em1.isReady).be.true;
      expect(ready).be.true;
    });

    var ready2 = emf.ready().then(function () {
      var em2 = emf.createEntityManager();
      expect(em2.isReady).be.true;
      expect(ready).be.true;
    });

    return Promise.all([ready1, ready2]);
  });

  it('should create ems when immediately connected', function () {
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);

    var ready = false;

    var em1 = emf.createEntityManager();
    expect(em1.isReady).be.false;
    var ready1 = em1.ready().then(function () {
      expect(em1.isReady).be.true;
      expect(ready).be.true;
    });

    var em2 = emf.createEntityManager();
    expect(em2.isReady).be.false;
    var ready2 = em2.ready().then(function () {
      expect(em2.isReady).be.true;
      expect(ready).be.true;
    });

    emf.ready().then(function () {
      ready = true;
    });

    return Promise.all([ready1, ready2]);
  });

  it('should create async em when immediately connected', function () {
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);

    var ready = false;
    emf.ready().then(function () {
      ready = true;
    });

    var em1 = emf.createEntityManager();
    expect(em1.isReady).be.false;
    var ready1 = em1.ready().then(function () {
      expect(em1.isReady).be.true;
      expect(ready).be.true;
    });

    var ready2 = emf.ready().then(function () {
      var em2 = emf.createEntityManager();
      expect(em2.isReady).be.true;
      expect(ready).be.true;
    });

    return Promise.all([ready1, ready2]);
  });
});
