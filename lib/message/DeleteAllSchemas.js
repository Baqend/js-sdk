var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Remove all currently created schemas
 * 
 * @class jspa.message.DeleteAllSchemas
 * @extends jspa.message.Message
 */
exports.DeleteAllSchemas = Message.inherit(/** @lends jspa.message.DeleteAllSchemas.prototype */ {

  initialize: function() {
    this.superCall('DELETE', '/db/schema');
  },

  doReceive: function() {
    if (this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});