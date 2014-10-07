var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * Get the class schema
 * Returns the schema definition of the class
 * The class definition contains a link to its parent class and all persistable fields with there types of the class
 * 
 * @class baqend.message.GetSchema
 * @extends baqend.message.Message
 */
exports.GetSchema = Message.inherit(/** @lends baqend.message.GetSchema.prototype */ {

  /**
   * @param bucket {Bucket} The bucket name
   */
  initialize: function(bucket) {
    this.superCall('GET', '/db/schema/' + bucket + '');
  },

  doReceive: function() {
    if (this.response.statusCode != 200) {
      throw new CommunicationError(this);
    }
  }
});