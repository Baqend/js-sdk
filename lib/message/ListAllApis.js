var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * List all API specification parts of the Orestes-Server
 * 
 * @class baqend.message.ListAllApis
 * @extends baqend.message.Message
 */
exports.ListAllApis = Message.inherit(/** @lends baqend.message.ListAllApis.prototype */ {

  initialize: function() {
    this.superCall('GET', '/spec');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});