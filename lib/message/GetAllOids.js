var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * @class jspa.message.GetAllOids
 * @extends jspa.message.Message
 */
exports.GetAllOids = GetAllOids = Message.inherit(
    /**
     * @lends jspa.message.GetAllOids.prototype
     */
    {
      /**
       * @param {EntityType} type
       * @param {number} start
       * @param {number} count
       */
      initialize: function (type, start, count) {
        this.superCall('get', this.createUri(type, start, count));
      },

      /**
       * @param {EntityType} type
       * @param {number} start
       * @param {number} count
       * @return {String}
       */
      createUri: function (type, start, count) {
        var uri = (type ? type.identifier : '/db') + '/all_oids';

        if (start > 0)
          uri += ';start=' + start;

        if (count < Number.MAX_VALUE)
          uri += ';count=' + count;

        return uri;
      },

      doReceive: function () {
        if (this.response.statusCode == 200)
          this.oids = this.response.entity;
        else
          throw new CommunicationError(this);
      }
    });