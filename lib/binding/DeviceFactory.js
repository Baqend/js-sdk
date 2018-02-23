'use strict';

const EntityFactory = require('./EntityFactory');

/**
 * @class binding.DeviceFactory
 * @extends binding.EntityFactory<model.Device>
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {model.Device} The new managed instance
 */
const DeviceFactory = EntityFactory.extend(/** @lends binding.DeviceFactory.prototype */ {

  /**
   * Returns true if the devices is already registered, otherwise false.
   * @returns {boolean} Status of the device registration
   */
  get isRegistered() {
    return this.db.isDeviceRegistered;
  },

  /**
   * Register a new device with the given device token and OS.
   * @param {string} os The OS of the device (IOS/Android)
   * @param {string} token The GCM or APNS device token
   * @param {model.Device=} device A optional device entity to set custom field values
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  register(os, token, device, doneCallback, failCallback) {
    if (device instanceof Function) {
      failCallback = doneCallback;
      doneCallback = device;
      device = null;
    }

    return this.db.registerDevice(os, token, device).then(doneCallback, failCallback);
  },

  /**
   * Uses the info from the given {util.PushMessage} message to send an push notification.
   * @param {util.PushMessage} pushMessage to send an push notification.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  push(pushMessage, doneCallback, failCallback) {
    return this.db.pushDevice(pushMessage).then(doneCallback, failCallback);
  },
});

DeviceFactory.PushMessage = require('../util/PushMessage');

module.exports = DeviceFactory;
