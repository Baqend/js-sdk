var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to validate a user token
 * 
 * @class baqend.message.ValidateUser
 * @extends baqend.message.Message
 */
exports.ValidateUser = Message.inherit(/** @lends baqend.message.ValidateUser.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db/_native.User/validate');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});