var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Create object
 * Create the given Object.
 * The object will be created and gets a unique oid.
 * 
 * @class baqend.message.CreateObject
 * @extends baqend.message.Message
 */
exports.CreateObject = Message.inherit(/** @lends baqend.message.CreateObject.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   */
  initialize: function(bucket, body) {
    this.superCall('POST', '/db/' + bucket + '', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 201 && this.response.statusCode != 202) {
      throw new CommunicationError(this);
    }
  }
});