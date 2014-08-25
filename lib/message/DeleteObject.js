var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Deletes the object
 * Deletes the object from the underling database. If the object was already deleted the
 * request will be ignored.
 * To delete an object an explicit version must be provided in the Etag-Header.
 * If the version is not equal to the current object version the deletion will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the delete will always be applied.
 * 
 * @class jspa.message.DeleteObject
 * @extends jspa.message.Message
 */
exports.DeleteObject = Message.inherit(/** @lends jspa.message.DeleteObject.prototype */ {

  /**
   * @param bucket {String} The bucket name
   * @param oid {String} The unique object identifier
   */
  initialize: function(bucket, oid, body) {
    this.superCall('DELETE', '/db/' + bucket + '/' + oid + '', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 202 && this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});