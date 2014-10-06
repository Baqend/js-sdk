var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to remove token cookie
 * 
 * @class jspa.message.Logout
 * @extends jspa.message.Message
 */
exports.Logout = Message.inherit(/** @lends jspa.message.Logout.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db/_native.User/logout');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});