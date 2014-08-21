var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get object
 * Returns the specified object. Each object has one unique identifier and therefore only one location.
 * 
 * @class jspa.message.GetObject
 * @extends jspa.message.Message
 */
exports.GetObject = Message.inherit(/** @lends jspa.message.GetObject.prototype */ {

  /**
   * @param bucket {String} The bucket name
   * @param oid {String} The unique object identifier
   */
  initialize: function(bucket, oid) {
    this.superCall('GET', '/db/' + bucket + '/' + oid + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 200 && this.response.statusCode != 404) {
      throw new CommunicationError(this);
    }
  }
});