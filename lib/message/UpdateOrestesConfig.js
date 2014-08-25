var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Updates the current Orestes config
 * 
 * @class jspa.message.UpdateOrestesConfig
 * @extends jspa.message.Message
 */
exports.UpdateOrestesConfig = Message.inherit(/** @lends jspa.message.UpdateOrestesConfig.prototype */ {

  initialize: function(body) {
    this.superCall('PUT', '/config', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 202 && this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});