var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to validate a user token
 * 
 * @class jspa.message.ValidateUser
 * @extends jspa.message.Message
 */
exports.ValidateUser = Message.inherit(/** @lends jspa.message.ValidateUser.prototype */ {

  initialize: function(body) {
    this.superCall('POST', '/db/_native.User/validate', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});