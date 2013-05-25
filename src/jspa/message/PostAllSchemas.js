

jspa.message.PostAllSchemas = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @super jspa.message.Message
	 * @memberOf jspa.message.GetAllSchemas
	 * @param {jspa.metamodel.Metamodel}
	 */
	initialize: function(metamodel, model) {
		this.superCall('post', '/db/all_schemas');
		
		this.metamodel = metamodel;
		this.model = model;
	},
	
	doSend: function() {
		this.request.entity = this.model;
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