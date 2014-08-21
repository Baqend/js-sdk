var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Update the class schema
 * Modify the schema definition of the class by adding all missing fields
 * 
 * @class jspa.message.UpdateSchema
 * @extends jspa.message.Message
 */
exports.UpdateSchema = Message.inherit(/** @lends jspa.message.UpdateSchema.prototype */ {

  /**
   * @param bucket {String} The bucket name
   */
  initialize: function(bucket, body) {
    this.superCall('POST', '/db/schema/' + bucket + '', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});