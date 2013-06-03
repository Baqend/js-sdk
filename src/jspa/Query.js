jspa.Query = jspa.util.QueueConnector.inherit(util.EventTarget, {
	firstResult: 0,
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
		
		this.parent = entityManager;
	},
	
	/**
	 * Execute a SELECT query and return the query results as a List.
	 */
	getResultList: function(context, onSuccess, onError) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			var type = this.resultClass? this.entityManager.metamodel.entity(this.resultClass): null;
			if (!this.qlString) {
				this.send(new jspa.message.GetAllOids(type, this.firstResult, this.maxResults), function(e) {
					this.createResultList(e.target.oids, result);
				}, function(e) {
					result.trigger(e);
				});
			}
		});
		
		return result;
	},
	
	/**
	 * Execute a SELECT query that returns a single result.
	 */
	getSingleResult: function(context, callback) {
		
	},
	
	createResultList: function(oids, result) {
		var self = this;
		var list = new Array(oids.length);
		
		for (var i = 0, oid; oid = oids[i]; ++i) {
			var entity = list[i] = this.entityManager.getReference(oid);
			var state = entity.__jspaState__;
			
			if (!state.isLoaded) {
				var msg = new jspa.message.GetObject(state);
				msg.on('receive', function(e) {
					if (e.target.state.isDeleted) {
						self.entityManager.removeReference(e.target.state.entity);
					}
				});
				this.send(msg);
			}	
		}
		
		this.yield(function() {
			result.trigger('success', list);
		});
	}
});

jspa.TypedQuery = jspa.Query.inherit({
	/**
	 * @constructor
	 * @super jspa.Query
	 * @memberOf jspa.TypedQuery
	 * @param {jspa.EntityManager} entityManager
	 * @param {String} qlString
	 * @param {Function} resultClass
	 */
	initialize: function(entityManager, qlString, resultClass) {
		this.superCall(entityManager, qlString);
		this.resultClass = resultClass;
	}
});