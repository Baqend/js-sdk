var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Update the object field
 * Executes the partial update on a object field.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class jspa.message.UpdateField
 * @extends jspa.message.Message
 */
exports.UpdateField = Message.inherit(/** @lends jspa.message.UpdateField.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   * @param field {String} The field name
   * @param oid {String} The unique object identifier
   */
  initialize: function(bucket, field, oid, body) {
    this.superCall('POST', '/db/' + bucket + '/' + oid + '/' + field + '', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});