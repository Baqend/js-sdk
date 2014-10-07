var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Updates the current Orestes config
 * 
 * @class baqend.message.UpdateOrestesConfig
 * @extends baqend.message.Message
 */
exports.UpdateOrestesConfig = Message.inherit(/** @lends baqend.message.UpdateOrestesConfig.prototype */ {

  initialize: function(body) {
    this.superCall('PUT', '/config', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 202 && this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});