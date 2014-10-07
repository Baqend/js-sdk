var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get the API specification part of the Orestes-Server
 * 
 * @class baqend.message.ListApiSpecification
 * @extends baqend.message.Message
 */
exports.ListApiSpecification = Message.inherit(/** @lends baqend.message.ListApiSpecification.prototype */ {

  /**
   * @param part {String} The specification part name
   */
  initialize: function(part) {
    this.superCall('GET', '/spec/' + part + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});