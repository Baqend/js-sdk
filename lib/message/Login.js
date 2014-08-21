var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to login a user
 * 
 * @class jspa.message.Login
 * @extends jspa.message.Message
 */
exports.Login = Message.inherit(/** @lends jspa.message.Login.prototype */ {

  initialize: function(body) {
    this.superCall('POST', '/db/_native.User/login', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});