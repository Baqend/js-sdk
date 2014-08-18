/**
 * @class jspa.util.QueueConnector
 */
exports.QueueConnector = QueueConnector = Object.inherit(/** @lends jspa.util.QueueConnector.prototype */ {
  /**
   * @param {jspa.util.Queue} queue
   * @param {jspa.connector.Connector} connector
   */
  initialize: function (queue, connector) {
    this.connector = connector;
  },

  /**
   * @param {jspa.message.Message} message Sends the given message
   * @return {Q.Promise<jspa.message.Message>} A promise that will be resolved if the message was successfully send
   */
  send: function (message) {
    return this.connector.send(this, message);
  }
});