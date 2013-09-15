/**
 * @class jspa.EntityTransaction
 */
jspa.EntityTransaction = jspa.util.QueueConnector.inherit({

	/**
	 * Indicate whether a resource transaction is in progress. 
	 * @returns {Boolean} indicating whether transaction is in progress 
 	 */
	isActive: {
		get: function() {
			return Boolean(this.tid);
		}
	},
	
	/**
	 * @constructor
	 * @param {jspa.EntityManager} entityManager
	 */
	initialize: function(entityManager) {
		this.superCall(entityManager.queue, entityManager.connector);
		
		this.entityManager = entityManager;
		
		this.tid = null;
		this.rollbackOnly = false;
		
		this.readSet = null;
		this.changeSet = null;
	},
	
	/**
	 * Start a resource transaction.
	 */
	begin: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			var result = this.send(new jspa.message.PostTransaction()).done(function(msg) {
				this.tid = msg.tid;

				this.rollbackOnly = false;
				this.readSet = {};
				this.changeSet = {};
			});
			
			return this.wait(result);
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Commit the current resource transaction, writing any unflushed changes to the database. 
	 */
	commit: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			if (this.getRollbackOnly()) {
				return this.rollback().then(function() {
					throw new jspa.error.RollbackError();
				});
			} else {
				return this.wait(this.entityManager.flush()).then(function() {
					var readSet = [];
					for (var identifier in this.readSet) {
						readSet.push({
							"oid": identifier,
							"version": this.readSet[identifier]
						});
					}
					
					var result = this.send(new jspa.message.PutTransactionCommitted(this.tid, readSet));
					
					return this.wait(result).then(function(msg) {
						this.tid = null;
						this.readSet = null;
						this.changeSet = null;
						
						var oids = msg.oids;
						for (var oid in oids) {
							var version = oids[oid];
							var entity = this.entityManager.entities[oid];
							
							if (entity) {
								var state = jspa.util.State.get(entity);
								if (version == 'DELETED' || state.isDeleted) {
									this.entityManager.removeReference(entity);
								} else {								
									state.setDatabaseValue(state.type.version, version);
								}
							}
						}
					});
				});
			}
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Determine whether the current resource transaction has been marked for rollback. 
	 * @returns {Boolean} indicating whether the transaction has been marked for rollback 
	 */
	getRollbackOnly: function() {
		return this.rollbackOnly;
	},
	
	/**
	 * Roll back the current resource transaction. 
	 */
	rollback: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			var result = this.send(new jspa.message.PutTransactionAborted(this.tid));
			
			this.wait(result).then(function() {
				this.tid = null;
				this.readSet = null;
				this.changeSet = null;
				return this.entityManager.clear();
			}, function() {
				return this.entityManager.clear();
			});
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Mark the current resource transaction so that the only possible outcome of the transaction is for the transaction to be rolled back. 
	 */
	setRollbackOnly: function(context, onSuccess) {
		return this.yield().done(function() {
			this.rollbackOnly = true;
		});
	},
	
	isRead: function(identifier) {
		return this.isActive && identifier in this.readSet;
	},
	
	setRead: function(identifier, version) {
		if (this.isActive && !this.isChanged(identifier)) {
			this.readSet[identifier] = version;
		}
	},
	
	isChanged: function(identifier) {
		return this.isActive && identifier in this.changeSet;
	},
	
	setChanged: function(identifier) {
		if (this.isActive) {
			delete this.readSet[identifier];
			this.changeSet[identifier] = true;
		}
	}
});