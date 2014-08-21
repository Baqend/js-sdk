var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to renew a user token
 * 
 * @class jspa.message.RenewToken
 * @extends jspa.message.Message
 */
exports.RenewToken = Message.inherit(/** @lends jspa.message.RenewToken.prototype */ {

  initialize: function(body) {
    this.superCall('POST', '/db/_native.User/renew', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});