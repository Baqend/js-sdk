var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * List all available bucket names
 * 
 * @class jspa.message.GetBucketNames
 * @extends jspa.message.Message
 */
exports.GetBucketNames = Message.inherit(/** @lends jspa.message.GetBucketNames.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db/all_buckets');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});