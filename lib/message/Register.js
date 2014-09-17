var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to register a user
 * 
 * @class jspa.message.Register
 * @extends jspa.message.Message
 */
exports.Register = Message.inherit(/** @lends jspa.message.Register.prototype */ {

  initialize: function(body) {
    this.superCall('POST', '/db/_native.User/register', body);

    this.response.headers['Orestes-Authorization-Token'] = null;
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});