"use strict";

var Entity = require('../binding/Entity');


/**
 * @alias util.PushMessage
 */
class PushMessage {

  /**
   * Push message will be used to send a push notification to a set of devices
   *
   * @param {Set<binding.Entity>|Array<binding.Entity>=} devices The Set of device references which
   * will receive this push notification.
   * @param {string=} message The message of the push notification.
   * @param {string=} subject The subject of the push notification.
   * @param {string=} sound The file reference of the sound file as a string. The device uses this file as the
   * notification sound.
   * @param {number=} badge The badge count.
   * @param {Object=} data The data object which can contain additional information.
   */
  constructor(devices, message, subject, sound, badge, data) {
    /**
     * Set of devices
     * @type Set<binding.Entity>
     */
    this.devices = null;

    if (devices instanceof Set) {
      this.devices = devices;
    } else if(!devices || devices[Symbol.iterator]) {
      this.devices = new Set(devices);
    } else if (devices instanceof Entity) {
      this.devices = new Set();
      this.devices.add(devices);
    } else {
      throw new Error("Only Sets, Lists and Arrays can be used as devices.")
    }

    /**
     * push notification message
     * @type string
     */
    this.message = message;

    /**
     * push notification subject
     * @type string
     */
    this.subject = subject;

    /**
     * push notification sound
     * @type string
     */
    this.sound = sound;

    /**
     * badge count
     * @type number
     */
    this.badge = badge;

    /**
     * data object
     * @type json
     */
    this.data = data;
  }

  /**
   * Adds a new object to the set of devices
   *
   * @param {binding.Entity} device will be added to the device set to receive the push notification
   */
  addDevice(device) {
    if(!this.devices) {
      this.devices = new Set();
    }

    this.devices.add(device);
  }

  toJSON() {
    if(!this.devices || !this.devices.size)
      throw new Error("Set of devices is empty.");

    return Object.assign({}, this, {
      devices: Array.from(this.devices, function(device) {
        return device.id;
      })
    });
  }
}

module.exports = PushMessage;