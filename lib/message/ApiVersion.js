var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get the API version of the Orestes-Server
 * 
 * @class baqend.message.ApiVersion
 * @extends baqend.message.Message
 */
exports.ApiVersion = Message.inherit(/** @lends baqend.message.ApiVersion.prototype */ {

  initialize: function() {
    this.superCall('GET', '/version');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});