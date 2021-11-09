import { Entity } from '../binding';
import type * as model from '../model';
import type { Json, JsonMap } from '../util';

export interface PushMessageOptions {
  /**
   * The icon of the push message
   */
  icon?: string;
  /**
   * The badge for iOS or Web Push devices
   */
  badge?: string | number;
  /**
   * The number for iOS and Android devices which will occur on the top right of
   * the icon
   */
  nativeBadge?: number;
  /**
   * The web badge is the small monochrome icon which will occur on small devices
   * (web push only)
   */
  webBadge?: string;
  /**
   * An image of the push message (web push only)
   */
  image?: string;
  /**
   * Actions that the user can invoke and interact with (web push only)
   */
  actions?: JsonMap;
  /**
   * Defines which direction the text should be displayed (web push only)
   */
  dir?: string;
  /**
   * The sound of an incoming push message (web push only)
   */
  sound?: string;
  /**
   * The tag of the push message where messages are going to be collected (web push only)
   */
  tag?: string;
  /**
   * The vibrate property specifies a vibration pattern for the device's
   * vibration
   */
  vibrate?: number[];
  /**
   * The renotify option makes new notifications vibrate and play a sound
   * (web push only)
   */
  renotify?: boolean;
  /**
   * The requireInteraction option lets stay the push message until the
   * user interacts with it (web push only)
   */
  requireInteraction?: boolean;
  /**
   * The silent option shows a new notification but prevents default behavior
   * (web push only)
   */
  silent?: boolean;
  /**
   * The data object which can contain additional information.
   */
  data?: Json;
}

// Extends all push message options
export interface PushMessage extends PushMessageOptions {}

/**
 * PushMessages are used to send a push notification to a set of devices
 */
export class PushMessage {
  /**
   * Set of devices
   */
  public devices: Set<model.Device>;

  /**
   * Push notification message
   */
  public message?: string;

  /**
   * Push notification subject
   */
  public subject?: string;

  /**
   * Push message will be used to send a push notification to a set of devices
   *
   * @param [devices] The Set of device references which
   * will receive this push notification.
   * @param message The message of the push notification.
   * @param subject The subject of the push notification.
   * @param [options] The options object which can contain additional information and data
   * @param [badge] The badge for iOS or Web Push devices
   * @param [data] The data object which can contain additional information.
   */
  constructor(devices: model.Device | Set<model.Device> | Iterable<model.Device>, message?: string, subject?: string,
    options?: string | PushMessageOptions, badge?: string | number, data?: Json) {
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
  private static initDevices(devices?: model.Device | Set<model.Device> | Iterable<model.Device>): Set<model.Device> {
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
   * @param device will be added to the device set to receive the push notification
   * @return
   */
  addDevice(device: model.Device): void {
    this.devices.add(device);
  }

  /**
   * Converts the push message to JSON
   * @return
   */
  toJSON(): JsonMap {
    if (!this.devices || !this.devices.size) {
      throw new Error('Set of devices is empty.');
    }

    return Object.assign({} as JsonMap, this, {
      devices: Array.from(this.devices, (device) => device.id),
    });
  }
}
