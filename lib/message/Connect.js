var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Connects a browser to this server
 * 
 * @class baqend.message.Connect
 * @extends baqend.message.Message
 */
exports.Connect = Message.inherit(/** @lends baqend.message.Connect.prototype */ {

  initialize: function() {
    this.superCall('GET', '/connect');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});