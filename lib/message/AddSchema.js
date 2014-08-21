var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Create new class schemas and patch existing class schemas
 * 
 * @class jspa.message.AddSchema
 * @extends jspa.message.Message
 */
exports.AddSchema = Message.inherit(/** @lends jspa.message.AddSchema.prototype */ {

  initialize: function(body) {
    this.superCall('POST', '/db/schema', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});