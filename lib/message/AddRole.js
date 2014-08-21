var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Method to add a role id to a user
 * 
 * @class jspa.message.AddRole
 * @extends jspa.message.Message
 */
exports.AddRole = Message.inherit(/** @lends jspa.message.AddRole.prototype */ {

  /**
   * @param oid {String} The unique user object identifier
   * @param operation {String} Operation to use
   */
  initialize: function(oid, operation, body) {
    this.superCall('POST', '/db/_native.User/' + oid + '/' + operation + '', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});