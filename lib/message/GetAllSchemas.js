var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get all available class schemas
 * 
 * @class jspa.message.GetAllSchemas
 * @extends jspa.message.Message
 */
exports.GetAllSchemas = Message.inherit(/** @lends jspa.message.GetAllSchemas.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db/schema');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});