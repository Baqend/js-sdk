var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to remove token cookie
 * 
 * @class baqend.message.Logout
 * @extends baqend.message.Message
 */
exports.Logout = Message.inherit(/** @lends baqend.message.Logout.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db/_native.User/logout');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});