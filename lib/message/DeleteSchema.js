var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Delete the class schema
 * Delete the schema definition of the class
 * 
 * @class jspa.message.DeleteSchema
 * @extends jspa.message.Message
 */
exports.DeleteSchema = Message.inherit(/** @lends jspa.message.DeleteSchema.prototype */ {

  /**
   * @param bucket {String} The bucket name
   */
  initialize: function(bucket) {
    this.superCall('DELETE', '/db/schema/' + bucket + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});