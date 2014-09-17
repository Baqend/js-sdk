var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Executes a basic ad-hoc query
 * Returns a list of matching object ids.
 * 
 * @class jspa.message.QueryByExampel
 * @extends jspa.message.Message
 */
exports.QueryByExampel = Message.inherit(/** @lends jspa.message.QueryByExampel.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   * @param query {DbQuery} The query
   * @param start {number} The offset to start from
   * @param count {number} The number of objects to list
   */
  initialize: function(bucket, query, start, count) {
    this.superCall('GET', '/db/' + bucket + '?' + query + '&' + start + '&' + count + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});