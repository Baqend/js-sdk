'use strict';

import * as message from "../message";
import { PushMessage } from "../util";
import { ManagedFactory } from "./ManagedFactory";
import { model } from "../model";
import { EntityFactory } from "./EntityFactory";

export class DeviceFactory extends EntityFactory<model.Device> {
  /**
   * Push message will be used to send a push notification to a set of devices
   *
   * @param {Set<Entity>|Array<Entity>} [devices] The Set of device references which
   * will receive this push notification.
   * @param {string=} message The message of the push notification.
   * @param {string=} subject The subject of the push notification.
   * @param {string=} sound The file reference of the sound file as a string. The device uses this file as the
   * notification sound.
   * @param {number=} badge The badge count.
   * @param {Object=} data The data object which can contain additional information.
   * @return {PushMessage}
   */
  public readonly PushMessage = PushMessage;

  /**
   * The current registered device, or <code>null</code> if the device is not registered
   * @type model.Device
   */
  get me() {
    return this.db.deviceMe;
  }

  /**
   * Returns true if the devices is already registered, otherwise false.
   * @type boolean
   */
  get isRegistered() {
    return this.db.isDeviceRegistered;
  }

  /**
   * Loads the Public VAPID Key which can be used to subscribe a Browser for Web Push notifications
   * @return {Promise<ArrayBuffer>} The public VAPID Web Push subscription key
   */
  loadWebPushKey() {
    const msg = new message.VAPIDPublicKey();
    msg.responseType('arraybuffer');
    return this.db.send(msg).then(response => response.entity);
  }

  /**
   * Register a new device with the given device token and OS.
   * @param {string} os The OS of the device (IOS/Android)
   * @param {string|Subscription} tokenOrSubscription The FCM device token, APNS device token or WebPush subscription
   * @param {Entity~doneCallback} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.Device>} The registered device
   *
   * @function
   * @name register
   * @memberOf DeviceFactory.prototype
   */

  /**
   * Register a new device with the given device token and OS.
   * @param {string} os The OS of the device (IOS/Android)
   * @param {string|PushSubscription} tokenOrSubscription The FCM device token, APNS device token or WebPush
   * subscription
   * @param {model.Device=} device An optional device entity to set custom field values
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.Device>} The registered device
   */
  register(os, tokenOrSubscription, device, doneCallback, failCallback) {
    if (device instanceof Function) {
      return this.register(os, tokenOrSubscription, null, device, doneCallback);
    }

    const subscription = typeof tokenOrSubscription === 'string' ? { token: tokenOrSubscription } : tokenOrSubscription;

    return this.db.registerDevice(os, subscription, device).then(doneCallback, failCallback);
  }

  /**
   * Uses the info from the given {PushMessage} message to send an push notification.
   * @param {PushMessage} pushMessage to send an push notification.
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  push(pushMessage, doneCallback, failCallback) {
    return this.db.pushDevice(pushMessage).then(doneCallback, failCallback);
  }
}
