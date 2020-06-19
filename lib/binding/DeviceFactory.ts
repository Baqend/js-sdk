'use strict';

import * as message from "../message";
import { PushMessage } from "../intersection";
import { model } from "../model";
import { EntityFactory } from "./EntityFactory";

export class DeviceFactory extends EntityFactory<model.Device> {
  /**
   * Push message will be used to send a push notification to a set of devices
   */
  public get PushMessage() {
    return PushMessage;
  }

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
   * @return The public VAPID Web Push subscription key
   */
  loadWebPushKey(): Promise<ArrayBuffer> {
    const msg = new message.VAPIDPublicKey();
    msg.responseType('arraybuffer');
    return this.db.send(msg).then(response => response.entity);
  }

  /**
   * Register a new device with the given device token and OS.
   * @param os The OS of the device (IOS/Android)
   * @param tokenOrSubscription The FCM device token, APNS device token or WebPush subscription
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return The registered device
   */
  register(os: string, tokenOrSubscription: string | PushSubscription, doneCallback?, failCallback?): Promise<model.Device>;

  /**
   * Register a new device with the given device token and OS.
   * @param os The OS of the device (IOS/Android)
   * @param tokenOrSubscription The FCM device token, APNS device token or WebPush
   * subscription
   * @param device An optional device entity to set custom field values
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return The registered device
   */
  register(os: string, tokenOrSubscription: string | PushSubscription, device: model.Device | null, doneCallback?, failCallback?): Promise<model.Device>;

  register(os: string, tokenOrSubscription: string | PushSubscription, device: model.Device | Function | null, doneCallback?, failCallback?): Promise<model.Device> {
    if (device instanceof Function) {
      return this.register(os, tokenOrSubscription, null, device, doneCallback);
    }

    const subscription = typeof tokenOrSubscription === 'string' ? { token: tokenOrSubscription } : tokenOrSubscription;

    return this.db.registerDevice(os, subscription, device).then(doneCallback, failCallback);
  }

  /**
   * Uses the info from the given {@link PushMessage} message to send an push notification.
   * @param pushMessage to send an push notification.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return
   */
  push(pushMessage: PushMessage, doneCallback?, failCallback?): Promise<void> {
    return this.db.pushDevice(pushMessage).then(doneCallback, failCallback);
  }
}
