'use strict';

import { Entity } from "../binding/Entity";
import { model } from "../model";

/**
 * PushMessages are used to send a push notification to a set of devices
 */
export class PushMessage {
  /**
   * Set of devices
   */
  readonly devices: Set<model.Device>;
  /**
   * Push notification message
   */
  readonly message: string;
  /**
   * Push notification subject
   */
  readonly subject: string;

  /**
   * Push message will be used to send a push notification to a set of devices
   *
   * @param {Iterable<Entity>} [devices] The Set of device references which
   * will receive this push notification.
   * @param {string=} message The message of the push notification.
   * @param {string=} subject The subject of the push notification.
   * @param {string=|object=} [options] The options object which can contain additional information and data
   * @param {string=} options.icon The icon of the push message
   * @param {string|number} [options.badge] The badge for iOS or Web Push devices
   * @param {number=} options.nativeBadge The number for iOS and Android devices which will occur on the top right of
   * the icon
   * @param {string=} options.webBadge The web badge is the small monochrome icon which will occur on small devices
   * (web push only)
   * @param {string=} options.image An image of the push message (web push only)
   * @param {Object=} options.actions Actions that the user can invoke and interact with (web push only)
   * @param {string=} options.dir Defines which direction the text should be displayed (web push only)
   * @param {string=} options.sound The sound of an incoming push message (web push only)
   * @param {string=} options.tag The tag of the push message where messages are going to be collected (web push only)
   * @param {Array.<number>=} options.vibrate The vibrate property specifies a vibration pattern for the device's
   * vibration
   * @param {boolean=} options.renotify The renotify option makes new notifications vibrate and play a sound
   * (web push only)
   * @param {boolean=} options.requireInteraction The requireInteraction option lets stay the push message until the
   * user interacts with it (web push only)
   * @param {boolean=} [options.silent] The silent option shows a new notification but prevents default behavior
   * (web push only)
   * @param {*} [options.data] The data object which can contain additional information.
   * @param {string|number} [badge] The badge for iOS or Web Push devices
   * @param {*} [data] The data object which can contain additional information.
   */
  constructor(devices, message, subject, options, badge, data) {
    const opts = typeof options === 'string' ? { sound: options, badge, data } : (options || {});

    this.devices = PushMessage.initDevices(devices);
    this.message = message;
    this.subject = subject;

    Object.assign(this, opts);
  }

  /**
   * Instantiates a set of devices from the given parameter
   * @param devices
   * @return
   */
  private static initDevices(devices?: Entity|Set<Entity>|Array<Entity>|Iterable<Entity>): Set<model.Device> {
    if (devices instanceof Set) {
      return devices;
    }

    if (devices instanceof Entity) {
      return new Set([devices]);
    }

    if (!devices || devices[Symbol.iterator]) {
      return new Set(devices);
    }

    throw new Error('Only Sets, Lists and Arrays can be used as devices.');
  }

  /**
   * Adds a new object to the set of devices
   * @param {Entity} device will be added to the device set to receive the push notification
   * @return {void}
   */
  addDevice(device) {
    this.devices.add(device);
  }

  /**
   * Converts the push message to JSON
   * @return {json}
   */
  toJSON() {
    if (!this.devices || !this.devices.size) {
      throw new Error('Set of devices is empty.');
    }

    return Object.assign({}, this, {
      devices: Array.from(this.devices, device => device.id),
    });
  }
}
