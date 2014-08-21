var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get the list of all available subresources
 * 
 * @class jspa.message.ListAllResources
 * @extends jspa.message.Message
 */
exports.ListAllResources = Message.inherit(/** @lends jspa.message.ListAllResources.prototype */ {

  initialize: function() {
    this.superCall('GET', '/');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});