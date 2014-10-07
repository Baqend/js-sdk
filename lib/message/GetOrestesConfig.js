var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get the current Orestes config
 * 
 * @class baqend.message.GetOrestesConfig
 * @extends baqend.message.Message
 */
exports.GetOrestesConfig = Message.inherit(/** @lends baqend.message.GetOrestesConfig.prototype */ {

  initialize: function() {
    this.superCall('GET', '/config');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});