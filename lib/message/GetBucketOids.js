var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * List all bucket elements
 * List all elements of the bucket
 * 
 * @class jspa.message.GetBucketOids
 * @extends jspa.message.Message
 */
exports.GetBucketOids = Message.inherit(/** @lends jspa.message.GetBucketOids.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   * @param start {number} The offset from where to start from
   * @param count {number} The number of objects to enlist
   */
  initialize: function(bucket, start, count) {
    this.superCall('GET', '/db/' + bucket + '/all_oids;' + start + ';' + count + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});