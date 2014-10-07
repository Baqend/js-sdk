var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get object
 * Returns the specified object. Each object has one unique identifier and therefore only one location.
 * 
 * @class baqend.message.GetObject
 * @extends baqend.message.Message
 */
exports.GetObject = Message.inherit(/** @lends baqend.message.GetObject.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   * @param oid {String} The unique object identifier
   */
  initialize: function(bucket, oid) {
    this.superCall('GET', '/db/' + bucket + '/' + oid + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 304 && this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});