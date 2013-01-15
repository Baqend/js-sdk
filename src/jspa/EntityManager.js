jspa.EntityManager = jspa.util.QueueConnector.inherit(util.EventTarget, {
	
	/**
	 * Determine whether the entity manager is open. 
	 * @returns {Boolean} true until the entity manager has been closed
	 */
	isOpen: {
		get: function() {
			return this.queue.isPrevented;
		}
	},
	
	/**
	 * @constructor
	 * @memberOf jspa.EntityManager
	 * @param {jspa.EntityManagerFactory} entityManagerFactory
	 */
	initialize: function(entityManagerFactory) {
		this.superCall(new jspa.util.Queue(), entityManagerFactory.connector);
		this.entities = {};
		
		this.newOidCounter = 0;
		
		this.entityManagerFactory = entityManagerFactory;
		this.metamodel = entityManagerFactory.metamodel;
		this.transaction = new jspa.EntityTransaction(this);
		
		this.parent = entityManagerFactory;
	},
	
	/**
	 * Get an instance, whose state may be lazily fetched. If the requested instance does not exist 
	 * in the database, the EntityNotFoundError is thrown when the instance state is first accessed. 
	 * The application should not expect that the instance state will be available upon detachment, 
	 * unless it was accessed by the application while the entity manager was open.
	 * 
	 * @param {Function} entityClass
	 * @param {String} oid
	 */
	getReference: function(entityClass, oid) {
		var identifier, model;
		if (entityClass.isInstanceOf(String)) {
			identifier = entityClass;
			model = this.metamodel.entity(identifier.substring(0, identifier.lastIndexOf('/')));
		} else {
			model = this.metamodel.entity(entityClass);
			identifier = model.identifier + '/' + oid;
		}
		
		var entity = this.entities[identifier];
		if (!entity) {
			entity = model.create();
			model.id.setValue(entity, identifier);
			this.replaceReference(null, entity);
		}
		
		return entity;
	},
	
	/**
	 * Create an instance of Query or TypedQuery for executing a query language statement. 
	 * if the optional resultClass argument is provided, the select list of the query must contain
	 * only a single item, which must be assignable to the type specified by the resultClass argument.
	 * 
	 * @param qlString - a query string
	 * @param resultClass - the optional type of the query result
	 */
	createQuery: function(qlString, resultClass) {
		if (resultClass) {
			return new jspa.TypedQuery(this, qlString, resultClass);
		} else {
			return new jspa.Query(this, qlString);
		}
	},
	
	/**
	 * Clear the persistence context, causing all managed entities to become detached. 
	 * Changes made to entities that have not been flushed to the database will not be persisted. 
	 */
	clear: function(context, onSuccess, onError) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {			
			for (var identifier in this.entities) {
				this.removeReference(this.entities[identifier]);
			}
			result.trigger('success');
		});
		return result;
	},
	
	/**
	 * Close an application-managed entity manager. After the close method has been invoked, 
	 * all methods on the EntityManager instance and any Query and TypedQuery objects obtained from it 
	 * will throw the IllegalStateError except for getTransaction, and isOpen (which will return false). 
	 * If this method is called when the entity manager is associated with an active transaction, 
	 * the persistence context remains managed until the transaction completes. 
	 */
	close: function() {
		this.clear();
		this.yield(function() {	
			this.queue.stop();
		});
	},
	
	/**
	 * Check if the instance is a managed entity instance belonging to the current persistence context. 
	 * @param {Object} entity - entity instance 
	 * @returns {Boolean} boolean indicating if entity is in persistence context
	 */
	contains: function(entity) {
		var state = entity.__jspaState__;
		if (!state)
			return false;
			
		var identifier = state.model.id.getValue(entity);
		return identifier && !state.isDeleted && this.entities[identifier] === entity;
	},
	
	/**
	 * Remove the given entity from the persistence context, causing a managed entity to become detached. 
	 * Unflushed changes made to the entity if any (including removal of the entity), 
	 * will not be synchronized to the database. Entities which previously referenced the detached entity will continue to reference it. 
	 * @param entity - entity instance 
	 */
	detach: function(entity, context, onSuccess, onError) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {			
			this.removeReference(entity);
			result.trigger('success', entity);
		});
		return result;
	},
	
	/**
	 * Find by object ID. Search for an entity of the specified oid. 
	 * If the entity instance is contained in the persistence context, it is returned from there.
	 * @param {Function} entityClass - entity class
	 * @param {String} oid - Object ID
	 * @param {Object} context -
	 * @param {Function} a callback the found entity instance or null if the entity does not exist 
	 */
	find: function(entityClass, oid, context, onSuccess, onError) {
		if (entityClass.isInstanceOf(String)) {
			onError = onSuccess;
			onSuccess = context;
			context = oid;
		}
		
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			var entity = this.getReference(entityClass, oid);
			var state = entity.__jspaState__;
			
			if (state.isLoaded) {
				result.trigger('success', entity);
			} else {
				var tid = 0, identifier = state.model.id.getValue(entity);
				if (this.transaction.isChanged(identifier))
					tid = this.transaction.tid;
				
				this.send(new jspa.message.GetObject(state, tid), function(e) {
					if (state.isDeleted) {
						this.removeReference(entity);
						entity = null;
					}
					
					result.trigger('success', entity);
				}, function(e) {
					result.trigger(e);
				});
			}			
		});
		
		return result;
	},
	
	findBlocked: function(entityClass, oid) {
		var state, model;
		if (entityClass.isInstanceOf(jspa.util.State)) {
			state = entityClass;
			model = state.model;
		} else {
			var entity = this.getReference(entityClass, oid);
			model = this.metamodel.entity(entity.constructor);
			state = model.state.getValue(entity);
		}
		
		if (!state.isLoaded) {
			var tid = 0, identifier = model.id.getValue(state.entity);
			if (this.transaction.isChanged(identifier))
				tid = this.transaction.tid;
			
			this.sendBlocked(new jspa.message.GetObject(state, tid));

			if (state.isDeleted) {
				this.removeReference(state.entity);
				throw new jspa.error.EntityNotFoundError(model.id.getValue(state.entity));
			}
		}
		
		return state.entity;
	},
	
	/**
	 * Synchronize the persistence context to the underlying database. 
	 * @param context
	 * @param callback
	 */
	flush: function(context, onSuccess, onError) {
		var errors = new jspa.error.BulkPersistentError();
		var self = this;
		
		this.yield(function() {			
			for (var identifier in this.entities) {
				var entity = this.entities[identifier];
				var state = entity.__jspaState__;
				
				if (state.isDirty) {
					var msg = null;
					if (state.isTemporary) {
						msg = new jspa.message.PostObject(state);
						msg.temporaryIdentifier = model.id.getValue(entity);
						msg.on('receive', function(e) {
							var state = e.target.state;
							var identifier = state.model.id.getValue(state.entity);
							self.transaction.setChanged(identifier);
							
							self.replaceReference(e.target.temporaryIdentifier, state.entity);
						});
						msg.on('error', function(e) {
							errors.add(e);
						});
					} else if (state.isDeleted) {
						msg = new jspa.message.DeleteObject(state);
						msg.on('receive', function(e) {
							var state = e.target.state;
							var identifier = state.model.id.getValue(state.entity);
							self.transaction.setChanged(identifier);
							
							if (!self.transaction.isActive)
								self.removeReference(state.entity);
						});
						msg.on('error', function(e) {
							errors.add(e);
						});
					} else {
						msg = new jspa.message.PutObject(state);
						msg.on('receive', function(e) {
							var state = e.target.state;
							if (e.target.state.isDeleted) {
								self.removeReference(state.entity);
							} else {
								var identifier = state.model.id.getValue(state.entity);
								self.transaction.setChanged(identifier);
							}				
						});
						msg.on('error', function(e) {
							errors.add(e);
						});
					}
						
					this.send(msg);
				}
			}
		});
				
		this.yield(function() {
			if (!this.transaction.isActive && !errors.causes.length) {
				//update all objects which have referenced a temporary object
				for (var identifier in this.entities) {
					var entity = this.entities[identifier];
					var state = entity.__jspaState__;
					
					if (state.isDirty) {
						var msg = new jspa.message.PutObject(state);
						msg.on('receive', function(e) {
							if (e.target.state.isDeleted) {
								self.removeReference(e.target.state.entity);
							}
						});
						msg.on('error', function(e) {
							errors.add(e);
						});
						this.send(msg);
					}
				}
			}
		});
		
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			if (errors.length) {
				result.trigger(new jspa.error.BulkPersistentError(errors));
			} else {
				result.trigger('success');
			}
		});
		return result;
	},
	
	/**
	 * Merge the state of the given entity into the current persistence context. 
	 * @param entity - entity instance 
	 * @param context - the context where the this variable in the called callback points to
	 * @param callback(entity) callback the managed instance that the state was merged to 
	 */
	merge: function(entity, context, onSuccess, onError) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			var model = this.metamodel.entity(entity.constructor);
			var identifier = model.id.getValue(entity);
			if (identifier) {
				this.find(identifier, this, function(e, persistentEntity) {
					if (persistentEntity && persistentEntity.constructor == entity.constructor) {
						var model = this.metamodel.entity(persistentEntity.constructor);
						for (var iter = model.attributes(); iter.hasNext; ) {
							var attribute = iter.next();
							
							attribute.setValue(persistentEntity, attribute.getValue(entity));							
						}

						result.trigger('success', persistentEntity);
					} else {
						result.trigger(new jspa.error.EntityNotFoundError(identifier));
					}
				}, function(e) {
					result.trigger(e);
				});
			} else {
				result.trigger(new jspa.error.IllegalEntityError(entity));
			}
		});
		
		return result;
	},
	
	/**
	 * Make an instance managed and persistent. 
	 * @param entity - entity instance 
	 * @param context
	 * @param callback
	 */
	persist: function(entity, context, onSuccess, onError) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			try {				
				this.addReference(entity);
				result.trigger('success', entity);
			} catch (e) {
				result.trigger(e);
			}
		});
		return result;
	},
	
	/**
	 * Refresh the state of the instance from the database, overwriting changes made to the entity, if any. 
	 * @param entity - entity instance 
	 * @param context
	 * @param callback(entity) The refreshed entity will passed to the callback or <code>null</code> if 
	 * 	the entity no longer exists in the database
	 */
	refresh: function(entity, context, onSuccess, onError) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			if (!this.contains(entity)) {
				result.trigger(new jspa.error.IllegalEntityError(entity));
			} else {
				var model = this.metamodel.entity(entity.constructor);
				var state = model.state.getValue(entity);
				
				if (state.isTemporary) {				
					result.trigger(new jspa.error.IllegalEntityError(entity));
				} else {
					var tid = 0, identifier = model.id.getValue(entity);
					if (this.transaction.isChanged(identifier))
						tid = this.transaction.tid;
					
					this.send(new jspa.message.GetObject(state, tid), function() {
						if (state.isDeleted) {
							this.removeReference(entity);	
							result.trigger(new jspa.error.EntityNotFoundError(identifier));
						} else {							
							result.trigger('success');
						}
					}, function(e) {
						result.trigger(e);
					});
				}
			}
		});
		
		return result;
	},
	
	/**
	 * Remove the entity instance. 
	 * @param entity - entity instance 
	 * @param context
	 * @param callback
	 */
	remove: function(entity, context, onSuccess, onError) {
		var result = new jspa.Result(this, context, onSuccess, onError);
		this.yield(function() {
			var state = entity.__jspaState__;
			if (state) {					
				if (this.contains(entity)) {
					if (state.isTemporary) {					
						this.removeReference(entity);
					} else {					
						state.setDeleted();
					}
				}
			} else {
				var model = this.metamodel.entity(entity.constructor);
				if (model) {
					var identity = model.id.getValue(entity);
					if (identity)
						result.trigger(new jspa.error.EntityExistsError(identity));
				} else {
					result.trigger(new jspa.error.IllegalEntityError(entity));
				}
			}
			
			result.trigger('success');
		});
		return result;
	},
	
	addReference: function(entity) {
		var state = entity.__jspaState__;

		var model;
		if (!this.contains(entity)) {
			if (state && state.isDeleted) {
				state.setPersistent();
			} else {
				model = this.metamodel.entity(entity.constructor);
				if (!model)
					throw new jspa.error.IllegalEntityError(entity);
				
				var identity = model.id.getValue(entity);
				if (identity)
					throw new jspa.error.EntityExistsException(identity);
				
				var temporaryIdentifier = '/temporary/' + model.identifier.substring(4);
				temporaryIdentifier += '/' + (++this.newOidCounter);
				
				model.id.setValue(entity, temporaryIdentifier);
				
				state = this.replaceReference(null, entity);
				state.setTemporary();
			}
		}
			
		model = state.model;
		
		for (var iter = model.attributes(); iter.hasNext; ) {			
			var attribute = iter.next();
			var value = attribute.getValue(entity);
			if (attribute.isAssociation) {
				value = attribute.type.castValue(value);
				if (value)
					this.addReference(value);
			}
		}
	},
	
	replaceReference: function(oldIdentifier, entity) {
		if (oldIdentifier in this.entities) {
			delete this.entities[oldIdentifier];
		}
		
		var state = entity.__jspaState__;
		if (!state) {
			var model = this.metamodel.entity(entity.constructor);
			state = new jspa.util.State(this, model, entity);
		}
		
		this.entities[state.model.id.getValue(entity)] = entity;
		
		return state;
	},
	
	removeReference: function(entity) {
		var state = entity.__jspaState__;
		if (!state)
			throw new jspa.error.IllegalEntityError(entity);
		
		entity.__jspaState__ = null;
		delete this.entities[state.model.id.getValue(entity)];
	}
});