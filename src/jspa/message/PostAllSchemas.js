/**
 * @class jspa.message.PostAllSchemas
 * @extends jspa.message.Message
 */
jspa.message.PostAllSchemas = jspa.message.Message.inherit({
	/**
	 * @constructor
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
			var builder = new jspa.metamodel.ModelBuilder(this.metamodel);
			this.models = builder.buildModels(this.response.entity);
		} else {
			throw new jspa.error.CommunicationError(this);
		}
	}
});