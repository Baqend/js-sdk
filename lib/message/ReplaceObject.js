var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Replace object
 * Replace the current object with the updated one.
 * To update an object an explicit version must be provided in the Etag-Header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class baqend.message.ReplaceObject
 * @extends baqend.message.Message
 */
exports.ReplaceObject = Message.inherit(/** @lends baqend.message.ReplaceObject.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   * @param oid {String} The unique object identifier
   */
  initialize: function(bucket, oid, body) {
    this.superCall('PUT', '/db/' + bucket + '/' + oid + '', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200 && this.response.statusCode != 202) {
      throw new CommunicationError(this);
    }
  }
});