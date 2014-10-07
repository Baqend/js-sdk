var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Remove all currently created schemas
 * 
 * @class baqend.message.DeleteAllSchemas
 * @extends baqend.message.Message
 */
exports.DeleteAllSchemas = Message.inherit(/** @lends baqend.message.DeleteAllSchemas.prototype */ {

  initialize: function() {
    this.superCall('DELETE', '/db/schema');
  },

  doReceive: function() {
    if (this.response.statusCode != 304 && this.response.statusCode != 204) {
      throw new CommunicationError(this);
    }
  }
});