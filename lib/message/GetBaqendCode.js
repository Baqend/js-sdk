var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get the code for an specific class script
 * Returns the specified baqend script code
 * 
 * @class jspa.message.GetBaqendCode
 * @extends jspa.message.Message
 */
exports.GetBaqendCode = Message.inherit(/** @lends jspa.message.GetBaqendCode.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   * @param type {String} The handler type of the script
   */
  initialize: function(bucket, type) {
    this.superCall('GET', '/db/code/' + bucket + '/' + type + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});