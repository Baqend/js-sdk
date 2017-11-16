"use strict";

var message = require('./message');
var error = require('./error');

/**
 * @alias EntityTransaction
 */
class EntityTransaction {

	/**
	 * Indicate whether a resource transaction is in progress. 
	 * @returns {boolean} indicating whether transaction is in progress 
 	 */
	get isActive() {
    return Boolean(this.tid);
	}
	
	/**
	 * @param {EntityManager} entityManager
	 */
	constructor(entityManager) {
		this.connector = entityManager.connector;
		this.entityManager = entityManager;
		
		this.tid = null;
		this.rollbackOnly = false;
		
		this.readSet = null;
		this.changeSet = null;
	}
	
	/**
	 * Start a resource transaction.
	 */
	begin(doneCallback, failCallback) {
		return this.yield().then(function() {
			var result = this.send(new message.PostTransaction()).done(function(msg) {
				this.tid = msg.tid;

				this.rollbackOnly = false;
				this.readSet = {};
				this.changeSet = {};
			});
			
			return this.wait(result);
		}).then(doneCallback, failCallback);
	}
	
	/**
	 * Commit the current resource transaction, writing any unflushed changes to the database. 
	 */
	commit(doneCallback, failCallback) {
		return this.yield().then(function() {
			if (this.getRollbackOnly()) {
				return this.rollback().then(function() {
					throw new error.RollbackError();
				});
			} else {
				return this.wait(this.entityManager.flush()).then(function() {
					var readSet = [];
					for (var ref in this.readSet) {
						readSet.push({
							"oid": ref,
							"version": this.readSet[ref]
						});
					}
					
					var result = this.send(new message.PutTransactionCommitted(this.tid, readSet));
					
					return this.wait(result).then(function(msg) {
						this.tid = null;
						this.readSet = null;
						this.changeSet = null;
						
						var oids = msg.oids;
						for (var oid in oids) {
							var version = oids[oid];
							var entity = this.entityManager.entities[oid];
							
							if (entity) {
								var state = util.Metadata.get(entity);
								if (version == 'DELETED' || state.isDeleted) {
									this.entityManager.removeReference(entity);
								} else {								
									state.setJsonValue(state.type.version, version);
								}
							}
						}
					});
				});
			}
		}).then(doneCallback, failCallback);
	}
	
	/**
	 * Determine whether the current resource transaction has been marked for rollback. 
	 * @returns {boolean} indicating whether the transaction has been marked for rollback 
	 */
	getRollbackOnly() {
		return this.rollbackOnly;
	}
	
	/**
	 * Roll back the current resource transaction. 
	 */
	rollback(doneCallback, failCallback) {
		return this.yield().then(function() {
			var result = this.send(new message.PutTransactionAborted(this.tid));
			
			this.wait(result).then(function() {
				this.tid = null;
				this.readSet = null;
				this.changeSet = null;
				return this.entityManager.clear();
			}, function() {
				return this.entityManager.clear();
			});
		}).then(doneCallback, failCallback);
	}
	
	/**
	 * Mark the current resource transaction so that the only possible outcome of the transaction is for the transaction to be rolled back. 
	 */
	setRollbackOnly(context, onSuccess) {
		return this.yield().done(function() {
			this.rollbackOnly = true;
		});
	}
	
	isRead(identifier) {
		return this.isActive && identifier in this.readSet;
	}
	
	setRead(identifier, version) {
		if (this.isActive && !this.isChanged(identifier)) {
			this.readSet[identifier] = version;
		}
	}
	
	isChanged(identifier) {
		return this.isActive && identifier in this.changeSet;
	}
	
	setChanged(identifier) {
		if (this.isActive) {
			delete this.readSet[identifier];
			this.changeSet[identifier] = true;
		}
	}
}

module.exports = EntityTransaction;