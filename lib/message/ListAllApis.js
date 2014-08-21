var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * List all API specification parts of the Orestes-Server
 * 
 * @class jspa.message.ListAllApis
 * @extends jspa.message.Message
 */
exports.ListAllApis = Message.inherit(/** @lends jspa.message.ListAllApis.prototype */ {

  initialize: function() {
    this.superCall('GET', '/spec');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});