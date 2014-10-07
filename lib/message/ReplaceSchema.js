var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Replace the class schema
 * Replace the schema definition of the class
 * 
 * @class baqend.message.ReplaceSchema
 * @extends baqend.message.Message
 */
exports.ReplaceSchema = Message.inherit(/** @lends baqend.message.ReplaceSchema.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   */
  initialize: function(bucket, body) {
    this.superCall('PUT', '/db/schema/' + bucket + '', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});