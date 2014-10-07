var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Create new class schemas and update existing class schemas
 * 
 * @class baqend.message.UpdateAllSchemas
 * @extends baqend.message.Message
 */
exports.UpdateAllSchemas = Message.inherit(/** @lends baqend.message.UpdateAllSchemas.prototype */ {

  initialize: function(body) {
    this.superCall('POST', '/db/schema', body);
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});