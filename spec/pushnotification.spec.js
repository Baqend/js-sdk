if (typeof module !== 'undefined') {
  require('./node');
}

describe('Test Push Notifications', function () {
  var emf, db, lock;

  var TEST_GCM_DEVICE = 'APA91bFBRJGMI2OkQxhV3peP4ncZOIxGJBJ8s0tkKyWvzQErpZmuSzMzm6ugz3rOauMQ1CRui0bBsEQvuN0W8X1wTP547C6MSNcErnNYXyvc1F5eKZCs-GAtE_NcESolea2AM6_cRe9R';
  var TEST_GCM_APIKEY = 'AAAAiHTmunA:APA91bF91CeP1L9QjhrxI2VTQpcf2L39CZY1zBragj4KwUiuXgZYfu4IKtT_S5he1sIHINkunGWpQEo1bsHLbWdTrKUW2Op7ykUBn9JCMKjYrgjUxwPbRyFudxd-ouz3TuYynKQa8xX0';

  before(async function () {
    this.timeout(40000);

    var retires = 0;
    emf = new DB.EntityManagerFactory({
      host: env.TEST_SERVER,
      tokenStorage: await helper.rootTokenStorage,
      staleness: 0,
    });

    await emf.ready();

    if (!emf.metamodel.entity('Lock')) {
      var Lock = new DB.metamodel.EntityType('Lock', emf.metamodel.entity(Object));
      emf.metamodel.addType(Lock);
      await emf.metamodel.save(Lock);
    }

    db = emf.createEntityManager();
    lock = new db.Lock({ id: 'push' });
    await createLock();

    var msg = new DB.message.GCMAKey();
    msg.entity(TEST_GCM_APIKEY, 'text');
    await emf.send(msg);

    try {
      await db.Device.loadWebPushKey();
    } catch {
      await emf.send(new DB.message.VAPIDKeys());
    }

    function createLock() {
      return lock.insert()
        .catch(function (e) {
          retires += 1;
          if (retires > 60) {
            throw e;
          }
          return helper.sleep(500)
            .then(createLock);
        });
    }
  });

  after(function () {
    return lock.delete();
  });

  beforeEach(function () {
    db = emf.createEntityManager();
    return db.ready();
  });

  it('should register device', function () {
    return db.Device.register('Android', TEST_GCM_DEVICE);
  });

  it('should save registration in cookie', function () {
    if (helper.isWebKit) {
      // TODO: we are currently using 3rd party cookies to store the device registration state
      // TODO: which is not supported by Webkit anymore
      return this.skip();
    }

    var deviceId;
    return db.Device.register('Android', TEST_GCM_DEVICE).then(function (device) {
      deviceId = device.id;
      return new DB.EntityManagerFactory({ host: env.TEST_SERVER, staleness: 0 }).createEntityManager(true).ready();
    }).then(function (newDB) {
      expect(newDB.isDeviceRegistered).be.true;
      expect(newDB.Device.isRegistered).be.true;
      expect(newDB.Device.me).be.ok;
      expect(newDB.Device.me.id).eql(deviceId);
    });
  });

  it('should push message', function () {
    return db.login('root', 'root').then(function () {
      return db.Device.register('Android', TEST_GCM_DEVICE);
    }).then(function () {
      return db.Device.find().equal('deviceOs', 'Android').resultList();
    }).then(function (result) {
      expect(result).length.at.least(1);
      var msg = new db.Device.PushMessage(result, 'Message', 'Subject');
      msg.sound = 'default';
      msg.badge = 5;
      msg.data = {
        test: 'test',
      };
      return db.Device.push(msg);
    });
  });

  it('should create correct json from push message', function () {
    return db.Device.register('Android', TEST_GCM_DEVICE)
      .then(function (device) {
        var msg1 = new db.Device.PushMessage();
        msg1.addDevice(device);
        msg1.message = 'TestMSG';
        msg1.subject = 'TestSubject';
        msg1.badge = 5;
        msg1.data = {
          test: 'test',
        };
        msg1.sound = 'test';
        var msg2 = new db.Device.PushMessage(device, 'TestMSG', 'TestSubject', 'test', 5, { test: 'test' });
        expect(msg2.toJSON()).eql(msg1.toJSON());
      });
  });

  it('should not be allowed to insert device', async function () {
    var device = new db.Device();
    try {
      await device.save();
      expect.fail();
    } catch (e) {
      expect(e.message).include('are not allowed');
    }
  });

  it('should remove cookie if device cannot be found', async function () {
    if (helper.isWebKit) {
      // TODO: we are currently using 3rd party cookies to store the device registration state
      // TODO: which is not supported by Webkit anymore
      return this.skip();
    }

    await db.Device.register('Android', TEST_GCM_DEVICE);
    const newDB= await new DB.EntityManagerFactory({ host: env.TEST_SERVER, staleness: 0 })
      .createEntityManager(true)
      .ready();
    expect(newDB.isDeviceRegistered).be.true;
    expect(newDB.Device.isRegistered).be.true;
    expect(newDB.Device.me).be.ok;

    await newDB.Device.me.delete({ force: true });
    DB.connector.Connector.connections = {};
    const newDB2 = await new DB.EntityManagerFactory({ host: env.TEST_SERVER, staleness: 0 })
      .createEntityManager(true)
      .ready();

    expect(newDB2.isDeviceRegistered).be.false;
    expect(newDB2.Device.isRegistered).be.false;
    expect(newDB2.Device.me).be.null;
  });

  if (typeof ArrayBuffer === 'undefined') {
    return;
  }

  it('should provide the WebPush key as an ArrayBuffer array', function () {
    return db.Device.loadWebPushKey().then(function (webPushKey) {
      expect(webPushKey).be.ok;
      expect(webPushKey).instanceOf(ArrayBuffer);
    });
  });
});
