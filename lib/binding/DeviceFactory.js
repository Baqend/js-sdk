"use strict";

var EntityFactory = require('./EntityFactory');

/**
 * @class binding.DeviceFactory
 * @extends binding.EntityFactory<model.Device>
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {model.Device} The new managed instance
 */
var DeviceFactory = EntityFactory.extend(/** @lends binding.DeviceFactory.prototype */ {
  /**
   * The current registered device, or <code>null</code> if the device is not registered
   * @type model.Device
   */
  get me() {
    return this._db.deviceMe;
  },

  /**
   * Returns true if the devices is already registered, otherwise false.
   * @type boolean
   */
  get isRegistered() {
    return this._db.isDeviceRegistered;
  },

  /**
   * Register a new device with the given device token and OS.
   * @param {string} os The OS of the device (IOS/Android)
   * @param {string | Object} subscription The GCM or APNS device token
   * @param {model.Device=} device A optional device entity to set custom field values
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.Device>} The registered device
   */
  register(os, subscription, device, doneCallback, failCallback) {
    if (device instanceof Function) {
      failCallback = doneCallback;
      doneCallback = device;
      device = null;
    }
    console.log(subscription);

    if (typeof subscription === 'string') {
      subscription = { token: subscription };
    }

    return this._db.registerDevice(os, subscription, device).then(doneCallback, failCallback);
  },

  /**
   * Uses the info from the given {util.PushMessage} message to send an push notification.
   * @param {util.PushMessage} pushMessage to send an push notification.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<any>}
   */
  push(pushMessage, doneCallback, failCallback) {
    return this._db.pushDevice(pushMessage).then(doneCallback, failCallback);
  }

  /**
   * Push message will be used to send a push notification to a set of devices
   *
   * @param {Set<binding.Entity>|Array<binding.Entity>} [devices] The Set of device references which
   * will receive this push notification.
   * @param {string=} message The message of the push notification.
   * @param {string=} subject The subject of the push notification.
   * @param {string=} sound The file reference of the sound file as a string. The device uses this file as the
   * notification sound.
   * @param {number=} badge The badge count.
   * @param {Object=} data The data object which can contain additional information.
   *
   * @function
   * @name PushMessage
   * @memberOf binding.DeviceFactory.prototype
   * @return {util.PushMessage}
   */
});

DeviceFactory.PushMessage = require('../util/PushMessage');

module.exports = DeviceFactory;