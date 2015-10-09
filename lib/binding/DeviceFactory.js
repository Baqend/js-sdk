var EntityFactory = require('./EntityFactory');

/**
 * @class baqend.binding.DeviceFactory
 * @extends baqend.binding.EntityFactory
 */
var DeviceFactory = {};
Object.cloneOwnProperties(DeviceFactory, EntityFactory);
Object.defineProperty(DeviceFactory, 'isRegistered', {
  /**
   * Returns true if the devices is already registered, otherwise false.
   * @returns {boolean} Status of the device registration
   */
  get: function() {
    return this._db.isDeviceRegistered;
  }
});

Object.extend(DeviceFactory, /** @lends baqend.binding.DeviceFactory */ {

  /** @lends baqend.binding.DeviceFactory */
  PushMessage: require('../util/PushMessage'),

  /**
   * Register a new device with the given device token and OS.
   * @param {String} os The OS of the device (IOS/Android)
   * @param {String} token The GCM or APNS device token
   * @param {baqend.binding.Entity=} device A optional device entity to set custom field values
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>} The created user object, for the new registered user.
   */
  register: function(os, token, device, doneCallback, failCallback) {
    if (Function.isInstance(device)) {
      failCallback = doneCallback;
      doneCallback = device;
      device = null;
    }

    return this._db.registerDevice(os, token, device).then(doneCallback, failCallback);
  },

  /**
   * Uses the info from the given {baqend.util.PushMessage} message to send an push notification.
   * @param {baqend.util.PushMessage} pushMessage to send an push notification.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise}
   */
  push: function(pushMessage, doneCallback, failCallback) {
    return this._db.pushDevice(pushMessage).then(doneCallback, failCallback);
  }
});

module.exports = DeviceFactory;