"use strict";

var Entity = require('../binding/Entity');


/**
 * @alias baqend.util.PushMessage
 */
class PushMessage {

  /**
   * Push message will be used to send a push notification to a set of devices
   *
   * @param {Set<baqend.binding.Entity>|List<baqend.binding.Entity>|Array=} devices The Set of device references which
   * will receive this push notification.
   * @param {String=} message The message of the push notification.
   * @param {String=} subject The subject of the push notification.
   * @param {String=} sound The file reference of the sound file as a string. The device uses this file as the
   * notification sound.
   * @param {Number=} badge The badge count.
   * @param {Object=} data The data object which can contain additional information.
   * @constructor
   */
  constructor(devices, message, subject, sound, badge, data) {
    /**
     * Set of devices
     * @type Set<baqend.binding.Entity>
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
     * @type String
     */
    this.message = message;

    /**
     * push notification subject
     * @type String
     */
    this.subject = subject;

    /**
     * push notification sound
     * @type String
     */
    this.sound = sound;

    /**
     * badge count
     * @type Number
     */
    this.badge = badge;

    /**
     * data object
     * @type Object
     */
    this.data = data;
  }

  /**
   * Adds a new object to the set of devices
   *
   * @param {baqend.binding.Entity} device will be added to the device set to receive the push notification
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