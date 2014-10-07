var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * List all available bucket names
 * 
 * @class baqend.message.GetBucketNames
 * @extends baqend.message.Message
 */
exports.GetBucketNames = Message.inherit(/** @lends baqend.message.GetBucketNames.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db/all_buckets');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});