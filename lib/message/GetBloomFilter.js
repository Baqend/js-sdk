var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Returns all changed objects
 * 
 * @class jspa.message.GetBloomFilter
 * @extends jspa.message.Message
 */
exports.GetBloomFilter = Message.inherit(/** @lends jspa.message.GetBloomFilter.prototype */ {

  initialize: function() {
    this.superCall('GET', '/replication/bloomfilter');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});