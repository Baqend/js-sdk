var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get all available class schemas
 * 
 * @class baqend.message.GetAllSchemas
 * @extends baqend.message.Message
 */
exports.GetAllSchemas = Message.inherit(/** @lends baqend.message.GetAllSchemas.prototype */ {

  initialize: function() {
    this.superCall('GET', '/db/schema');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});