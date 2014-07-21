var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;
var ModelBuilder = require('../metamodel').ModelBuilder;

/**
 * @class jspa.message.GetAllSchemas
 * @extends jspa.message.Message
 */
exports.GetAllSchemas = GetAllSchemas = Message.inherit(
    /**
     * @lends jspa.message.GetAllSchemas.prototype
     */
    {
	/**
	 * @param {jspa.metamodel.Metamodel} metamodel
	 */
	initialize: function(metamodel) {
		this.superCall('get', '/db/all_schemas');

		this.metamodel = metamodel;
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
