var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get the API specification part of the Orestes-Server
 * 
 * @class jspa.message.ListApiSpecification
 * @extends jspa.message.Message
 */
exports.ListApiSpecification = Message.inherit(/** @lends jspa.message.ListApiSpecification.prototype */ {

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