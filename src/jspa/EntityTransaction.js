jspa.EntityTransaction = jspa.util.QueueConnector.inherit(util.EventTarget, {

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
	 * @memberOf jspa.EntityTransaction
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
	begin: function(context, onSuccess, onError) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			this.send(new jspa.message.PostTransaction(), function(e) {
				this.tid = e.target.tid;

				this.rollbackOnly = false;
				this.readSet = {};
				this.changeSet = {};
				
				result.trigger('success');
			}, function(e) {
				result.trigger(e);
			});
		});
		return result;
	},
	
	/**
	 * Commit the current resource transaction, writing any unflushed changes to the database. 
	 */
	commit: function(context, onSuccess, onError) {
		this.entityManager.flush(this);
		
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			if (this.getRollbackOnly()) {
				this.rollback(function() {
					result.trigger(new jspa.error.RollbackError());
				}, function(e) {
					result.trigger(e);
				});
			} else {
				this.send(new jspa.message.PutTransactionCommited(this.tid, this.readSet), function(e) {
					this.tid = null;
					this.readSet = null;
					this.changeSet = null;
					
					var oids = e.target.oids;
					for (oid in oids) {
						var version = oids[oid];
						var entity = this.entityManager.entities[oid];
						
						if (entity) {
							var state = entity.__jspaState__;
							if (version == 'DELETED' || state.isDeleted) {
								self.entityManager.removeReference(entity);
							} else {								
								state.setDatabaseValue(state.model.version, version);
							}
						}
					}
					
					result.trigger('success');
				}, function(e) {
					this.entityManager.clear();
					result.trigger(e);
				});
			}
		});
		
		return result;
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
	rollback: function(context, onSuccess, onError) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			this.send(new jspa.message.PutTransactionAborted(this.tid), function() {
				this.tid = null;
				this.readSet = null;
				this.changeSet = null;
				this.entityManager.clear();
				result.trigger('success');
			}, function(e) {
				this.entityManager.clear();
				result.trigger(e);
			});
		});
		
		return result;
	},
	
	/**
	 * Mark the current resource transaction so that the only possible outcome of the transaction is for the transaction to be rolled back. 
	 */
	setRollbackOnly: function(context, onSuccess) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			this.rollbackOnly = true;
		});
		return result;
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