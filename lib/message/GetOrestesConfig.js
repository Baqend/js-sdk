var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get the current Orestes config
 * 
 * @class jspa.message.GetOrestesConfig
 * @extends jspa.message.Message
 */
exports.GetOrestesConfig = Message.inherit(/** @lends jspa.message.GetOrestesConfig.prototype */ {

  initialize: function() {
    this.superCall('GET', '/config');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});