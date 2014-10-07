var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * List all available subresources of an bucket resource
 * 
 * @class baqend.message.ListBucketSubresurces
 * @extends baqend.message.Message
 */
exports.ListBucketSubresurces = Message.inherit(/** @lends baqend.message.ListBucketSubresurces.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
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