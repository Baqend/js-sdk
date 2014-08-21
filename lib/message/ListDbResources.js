var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * List all subresources
 * 
 * @class jspa.message.ListDbResources
 * @extends jspa.message.Message
 */
exports.ListDbResources = Message.inherit(/** @lends jspa.message.ListDbResources.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});