var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Delete the class schema
 * Delete the schema definition of the class
 * 
 * @class baqend.message.DeleteSchema
 * @extends baqend.message.Message
 */
exports.DeleteSchema = Message.inherit(/** @lends baqend.message.DeleteSchema.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   */
  initialize: function(bucket) {
    this.superCall('DELETE', '/db/schema/' + bucket + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 304 && this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});