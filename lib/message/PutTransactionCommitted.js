var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;
var RollbackError = require('../error').RollbackError;

/**
 * @class jspa.message.PutTransactionCommitted
 * @extends jspa.message.Message
 */
exports.PutTransactionCommitted = PutTransactionCommitted = Message.inherit(
    /**
     * @lends jspa.message.PutTransactionCommitted.prototype
     */
    {
      /**
       * @param {String} tid
       * @param {Object} readSet
       */
      initialize: function (tid, readSet) {
        this.superCall('put', '/transaction/' + tid + '/committed', readSet);
      },

      doReceive: function () {
        switch (this.response.statusCode) {
          case 200:
            this.oids = this.response.entity;
            break;
          case 412:
            throw new RollbackError();
          default:
            throw new CommunicationError(this);
        }
      }
    });