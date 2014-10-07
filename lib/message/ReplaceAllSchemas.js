var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Replace all currently created schemas with the new ones
 * 
 * @class baqend.message.ReplaceAllSchemas
 * @extends baqend.message.Message
 */
exports.ReplaceAllSchemas = Message.inherit(/** @lends baqend.message.ReplaceAllSchemas.prototype */ {

  initialize: function(body) {
    this.superCall('PUT', '/db/schema', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});