var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;
var ModelBuilder = require('../metamodel').ModelBuilder;

/**
 * @class jspa.message.PostAllSchemas
 * @extends jspa.message.Message
 */
exports.PostAllSchemas = PostAllSchemas = Message.inherit(
    /**
     * @lends jspa.message.PostAllSchemas.prototype
     */
    {
	/**
	 * @param {jspa.metamodel.Metamodel} metamodel
   * @param {String} types
	 */
	initialize: function(metamodel, types) {
		this.superCall('post', '/db/all_schemas');
		
		this.metamodel = metamodel;
		this.types = types;
	},
	
	doSend: function() {
		this.request.entity = this.types;
	},
	
	doReceive: function() {
		if (this.response.statusCode == 200) {
			var builder = new ModelBuilder(this.metamodel);
			this.models = builder.buildModels(this.response.entity);
		} else {
			throw new CommunicationError(this);
		}
	}
});