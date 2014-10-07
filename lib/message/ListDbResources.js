var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * List all subresources
 * 
 * @class baqend.message.ListDbResources
 * @extends baqend.message.Message
 */
exports.ListDbResources = Message.inherit(/** @lends baqend.message.ListDbResources.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});