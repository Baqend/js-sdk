var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to register a user
 * 
 * @class baqend.message.Register
 * @extends baqend.message.Message
 */
exports.Register = Message.inherit(/** @lends baqend.message.Register.prototype */ {

  initialize: function(body) {
    this.superCall('POST', '/db/_native.User/register', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});