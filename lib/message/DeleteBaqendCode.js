var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Delete the code for an specific class script
 * Delete the specified baqend script code
 * 
 * @class jspa.message.DeleteBaqendCode
 * @extends jspa.message.Message
 */
exports.DeleteBaqendCode = Message.inherit(/** @lends jspa.message.DeleteBaqendCode.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   * @param type {String} The handler type of the script
   */
  initialize: function(bucket, type) {
    this.superCall('DELETE', '/db/code/' + bucket + '/' + type + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});