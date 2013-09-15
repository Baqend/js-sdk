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
	 * @param {String|Object} qlString
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
            var msg;

			if (!this.qlString) {
                msg = new jspa.message.GetAllOids(type, this.firstResult, this.maxResults);
			} else {
                if (!type) {
                    throw new PositionError('Only typed queries can be executed.');
                }

                var query = this.qlString;
                if (!String.isInstance(query))
                    query = JSON.stringify(query);

                msg = new jspa.message.GetBucketQuery(type, query, this.firstResult, this.maxResults);
            }

            return this.wait(this.send(msg)).then(function() {
                return this.createResultList(msg.oids);
            });
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Execute a SELECT query that returns a single result.
	 */
	getSingleResult: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			var type = this.resultClass? this.entityManager.metamodel.entity(this.resultClass): null;
			if (!this.qlString) {
                var msg = new jspa.message.GetAllOids(type, this.firstResult, 1);

                return this.wait(this.send(msg)).then(function(msg) {
					return this.createResultList(msg.oids);
				}).then(function(result) {
					return result.length? result[0]: null;
				});
			}
		}).then(doneCallback, failCallback);
	},
	
	createResultList: function(oids) {
		var list = new Array(oids.length);

        if (oids.length) {
            var pending = [];
            oids.forEach(function(el, index) {
                var promise = this.entityManager.find(el.oid || el).done(function(o) {
                    list[index] = o;
                });

                pending.push(promise);
            }, this);

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
	 * @param {String|Object} qlString
	 * @param {Function} resultClass
	 */
	initialize: function(entityManager, qlString, resultClass) {
		this.superCall(entityManager, qlString);
		this.resultClass = resultClass;
	}
});