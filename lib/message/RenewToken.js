var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to renew a user token
 * 
 * @class baqend.message.RenewToken
 * @extends baqend.message.Message
 */
exports.RenewToken = Message.inherit(/** @lends baqend.message.RenewToken.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db/_native.User/renew');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});