var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to login a user
 * 
 * @class baqend.message.Login
 * @extends baqend.message.Message
 */
exports.Login = Message.inherit(/** @lends baqend.message.Login.prototype */ {

  initialize: function(body) {
    this.superCall('POST', '/db/_native.User/login', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});