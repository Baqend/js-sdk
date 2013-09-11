/**
 * @class jspa.Query
 * @extends jspa.util.QueueConnector
 */
jspa.Query = jspa.util.QueueConnector.inherit({
    /**
     * @type Number
     */
	firstResult: 0,

    /**
     * @type Number
     */
	maxResults: Number.MAX_VALUE,
	
	/**
	 * @constructor
	 * @memberOf jspa.Query
	 * @param {jspa.EntityManager} entityManager
	 * @param {String} qlString
 	 */
	initialize: function(entityManager, qlString) {
		this.superCall(entityManager.queue, entityManager.connector);
		this.entityManager = entityManager;
		this.qlString = qlString;
	},
	
	/**
	 * Execute a SELECT query and return the query results as a List.
	 */
	getResultList: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			var type = this.resultClass? this.entityManager.metamodel.entity(this.resultClass): null;
			if (!this.qlString) {
				var result = this.send(new jspa.message.GetAllOids(type, this.firstResult, this.maxResults)).then(function(msg) {
					return this.createResultList(msg.oids);
				});
				
				return this.wait(result);
			}
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Execute a SELECT query that returns a single result.
	 */
	getSingleResult: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			var type = this.resultClass? this.entityManager.metamodel.entity(this.resultClass): null;
			if (!this.qlString) {
				var result = this.send(new jspa.message.GetAllOids(type, this.firstResult, 1)).then(function(msg) {
					return this.createResultList(msg.oids);
				});
				
				this.wait(result).then(function() {
					return result.length? result[0]: null;
				});
			}
		}).then(doneCallback, failCallback);
	},
	
	createResultList: function(oids) {
		var list = new Array(oids.length);
		
		var pending = [];
		oids.forEach(function(oid, index) {
			var entity = list[index] = this.entityManager.getReference(oid);
			var state = jspa.util.State.get(entity);
			
			if (!state.isLoaded) {
				var promise = this.send(new jspa.message.GetObject(state)).done(function(msg) {					
					if (msg.state.isDeleted) {
						this.entityManager.removeReference(msg.state.entity);
						list[index] = null;
					}
				}).fail(function(e) {
					console.log(e);
				});
				
				pending.push(promise);
			}	
		}, this);
		
		if (pending.length) {			
			return jspa.Promise.when(pending).then(function() {
				return [list];
			});
		} else {
			return [list];
		}
	}
});

/**
 * @class jspa.TypedQuery
 * @extends jspa.Query
 */
jspa.TypedQuery = jspa.Query.inherit({
	/**
	 * @constructor
	 * @param {jspa.EntityManager} entityManager
	 * @param {String} qlString
	 * @param {Function} resultClass
	 */
	initialize: function(entityManager, qlString, resultClass) {
		this.superCall(entityManager, qlString);
		this.resultClass = resultClass;
	}
});