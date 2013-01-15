
jspa.message.GetAllSchemas = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @super jspa.message.Message
	 * @memberOf jspa.message.GetAllSchemas
	 * @param {jspa.metamodel.Metamodel}
	 */
	initialize: function(metamodel) {
		this.superCall('get', '/db/all_schemas');
		
		this.metamodel = metamodel;
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
