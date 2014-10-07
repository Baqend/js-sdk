var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Update the object
 * Executes the partial updates on the object.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class baqend.message.UpdatePartially
 * @extends baqend.message.Message
 */
exports.UpdatePartially = Message.inherit(/** @lends baqend.message.UpdatePartially.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   * @param oid {String} The unique object identifier
   */
  initialize: function(bucket, oid, body) {
    this.superCall('POST', '/db/' + bucket + '/' + oid + '', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});