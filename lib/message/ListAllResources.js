var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get the list of all available subresources
 * 
 * @class baqend.message.ListAllResources
 * @extends baqend.message.Message
 */
exports.ListAllResources = Message.inherit(/** @lends baqend.message.ListAllResources.prototype */ {

  initialize: function() {
    this.superCall('GET', '/');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});