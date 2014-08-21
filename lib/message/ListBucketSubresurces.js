var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * List all available subresources of an bucket resource
 * 
 * @class jspa.message.ListBucketSubresurces
 * @extends jspa.message.Message
 */
exports.ListBucketSubresurces = Message.inherit(/** @lends jspa.message.ListBucketSubresurces.prototype */ {

  /**
   * @param bucket {String} The bucket name
   */
  initialize: function(bucket) {
    this.superCall('GET', '/db/' + bucket + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});