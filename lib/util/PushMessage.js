var Set = require('../collection').Set;
var List = require('../collection').List;
var Metadata = require('./Metadata');
var Entity = require('../binding/Entity');


/**
 * @class baqend.util.PushMessage
 */
var PushMessage = Object.inherit(/** @lends baqend.util.PushMessage.prototype */ {

  /**
   * Set of devices
   * @type Set<baqend.binding.Entity>
   */
  devices: null,

  /**
   * push notification message
   * @type String
   */
  message: null,

  /**
   * push notification subject
   * @type String
   */
  subject: null,

  /**
   * push notification sound
   * @type String
   */
  sound: null,

  /**
   * badge count
   * @type Number
   */
  badge: 0,

  /**
   * data object
   * @type Object
   */
  data: null,

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
  constructor: function PushMessage(devices, message, subject, sound, badge, data) {
    if(Array.isInstance(devices) || List.isInstance(devices) || !devices) {
      this.devices = new Set(devices);
    } else if(Entity.isInstance(devices)) {
      this.devices = new Set();
      this.devices.add(devices);
    } else if(!Set.isInstance(devices)) {
      throw new Error("Only Sets, Lists and Arrays can be used as devices.")
    }

    this.message = message;
    this.subject = subject;
    this.sound = sound;
    this.badge = badge;
    this.data = data;
  },


  /**
   * Adds a new object to the set of devices
   *
   * @param {baqend.binding.Entity} device will be added to the device set to receive the push notification
   */
  addDevice: function(device) {
    if(!this.devices) {
      this.devices = new Set();
    } else if(Array.isInstance(this.devices)) {
      this.devices = new Set(this.devices);
    }

    this.devices.add(device);
  },

  toJSON: function() {
    if(Array.isInstance(this.devices) || List.isInstance(this.devices))
      this.devices = new Set(this.devices);

    if(!this.devices || !this.devices.size)
      throw new Error("Set of devices is empty.");

    return Object.extend(Object.extend({}, this), {
      devices: this.devices.map(function(device) {
        return Metadata.get(device).ref;
      })
    });
  }
});

module.exports = PushMessage;