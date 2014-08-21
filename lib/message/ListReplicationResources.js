var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * get List all subresources
 * 
 * @class jspa.message.ListReplicationResources
 * @extends jspa.message.Message
 */
exports.ListReplicationResources = Message.inherit(/** @lends jspa.message.ListReplicationResources.prototype */ {

  initialize: function() {
    this.superCall('GET', '/replication');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});