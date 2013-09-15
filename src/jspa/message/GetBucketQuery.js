/**
 * @class jspa.message.GetBucketQuery
 * @extends jspa.message.Message
 */
jspa.message.GetBucketQuery = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {jspa.metamodel.EntityType} type
     * @param {String} query
     * @param {number} start
     * @param {number} count
	 */
	initialize: function(type, query, start, count) {
		this.superCall('get', this.createUri(type, query, start, count));
	},

    /**
     * @param {jspa.metamodel.EntityType} type
     * @param {String} query
     * @param {number} start
     * @param {number} count
     */
	createUri: function(type, query, start, count) {
		var uri = type.identifier;

        uri += '?query=' + encodeURI(query);

		if (start > 0)
			uri += '?start=' + start;
		
		if (count < Number.MAX_VALUE)
			uri += '?count=' + count;
		
		return uri;
	},
	
	doReceive: function() {
		if (this.response.statusCode == 200)
			this.oids = this.response.entity;
		else
			throw new jspa.error.CommunicationError(this);
	}
});