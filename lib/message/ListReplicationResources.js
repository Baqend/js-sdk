var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * get List all subresources
 * 
 * @class baqend.message.ListReplicationResources
 * @extends baqend.message.Message
 */
exports.ListReplicationResources = Message.inherit(/** @lends baqend.message.ListReplicationResources.prototype */ {

  initialize: function() {
    this.superCall('GET', '/replication');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});