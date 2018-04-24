"use strict";

var Entity = require('../binding/Entity');


/**
 * @alias util.PushMessage
 */
class PushMessage {
  /**
   * Push message will be used to send a push notification to a set of devices
   *
   * @param {Set<binding.Entity>|Array<binding.Entity>} [devices] The Set of device references which
   * will receive this push notification.
   * @param {string=} message The message of the push notification.
   * @param {string=} subject The subject of the push notification.
   * @param {Object=} options The options object which can contain additional information as well as additional data
   * @param {string=} options.icon The icon of the push message
   * @param {string= | number=} options.badge The badge for iOS or Web Push devices
   * @param {number=} options.iOSbadge The number for iOS and Android devices which will occur on the top right of the icon
   * @param {string=} options.webBadge The web badge is the small monochrome icon which will occur on small devices (web push only)
   * @param {string=} options.image An image of the push message (web push only)
   * @param {Object=} options.actions Actions that the user can invoke and interact with (web push only)
   * @param {string=} options.dir Defines which direction the text should be displayed (web push only)
   * @param {string=} options.sound The sound of an incoming push message (web push only)
   * @param {string=} options.tag The tag of the push message where messages are going to be collected (web push only)
   * @param {boolean=} options.renotify The renotify option makes new notifications vibrate and play a sound (web push only)
   * @param {boolean=} options.requireInteraction The requireInteraction option lets stay the push message until the user interacts with it (web push only)
   * @param {boolean=} options.silent The silent option shows a new notification but prevents default behavior (web push only)
   * @param {Object=} options.data The data object which can contain additional information.
   */
  constructor(devices, message, subject, sound, badge, data) {
    let options = new Object();

    if (sound instanceof Object) {
      options = sound;

      if (typeof options.badge === 'string') {
        options.webBadge = options.badge;
      } else if (typeof options.badge === 'number') {
        options.iOSbadge = options.badge;
      }
    } else {
      options = {badge, sound, data};
    }

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

    Object.assign(this, options);
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