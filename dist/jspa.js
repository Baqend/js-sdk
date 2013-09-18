if (!Object.inherit)
	require('../lib/jahcode.js');

var jspa = {
	error: {},
	connector: {},
	metamodel: {},
	message: {},
	util: {},
	binding: {},
	collection: {}
};

if (typeof module !== 'undefined')
	module.exports = jspa;
	
jspa.StopIteration = Error.inherit({
    initialize: function() {
        this.superCall('No such element.');
    }
});

jspa.Iterator = Trait.inherit({
    extend: {
        conv: function(obj) {
            if (obj) {
                if (obj.items && Function.isInstance(obj.items)) {
                    return obj.items();
                } else if (Array.isInstance(obj)) {
                    return new jspa.IndexIterator(obj.length, function(index) {
                        return [index, obj[index]];
                    });
                } else {
                    return new jspa.PropertyIterator(obj);
                }
            }
        }
    },

    StopIteration: new jspa.StopIteration(),
    hasNext: false,

    iterator: function() {
        return this;
    },

    next: function() {
        throw this.StopIteration;
    }
});

jspa.IndexIterator = Object.inherit(jspa.Iterator, {
    initialize: function(length, accessor) {
        this.length = length;
        this.index = 0;

        this.hasNext = this.index < this.length;

        if (accessor)
            this.accessor = accessor;
    },
    next: function() {
        if (!this.hasNext)
            throw this.StopIteration;

        var value = this.accessor(this.index);
        this.hasNext = ++this.index < this.length;

        return value;
    }
});

jspa.PropertyIterator = jspa.IndexIterator.inherit({
    initialize: function(obj) {
        this.obj = obj;
        this.names = Object.getOwnPropertyNames(obj);
    },
    accessor: function(index) {
        if (this.names.length >= index)
            throw this.StopIteration;

        var name = this.names[index];
        return [name, this.object[name]];
    }
});

jspa.Iterable = Trait.inherit({
    forEach: function(callback, thisArg) {
        if (!callback || !Function.isInstance(callback)) {
            throw new TypeError(callback + ' is not a function');
        }

        for (var iter = jspa.Iterator(this); iter.hasNext; ) {
            var item = iter.next();

            callback.call(thisArg, item[1], item[0], this);
        }
    },

    every: function(callback, thisArg) {
        if (!callback || !Function.isInstance(callback)) {
            throw new TypeError(callback + ' is not a function');
        }

        for (var iter = jspa.Iterator(this); iter.hasNext; ) {
            var item = iter.next();

            if (!callback.call(thisArg, item[1], item[0], this))
                return false;
        }

        return true;
    },

    some: function(callback, thisArg) {
        if (!Function.isInstance(callback)) {
            throw new TypeError(callback + ' is not a function');
        }

        for (var iter = jspa.Iterator(this); iter.hasNext; ) {
            var item = iter.next();

            if (callback.call(thisArg, item[1], item[0], this))
                return true;
        }

        return false;
    },

    filter: function(callback, thisArg) {
        if (!Function.isInstance(callback)) {
            throw new TypeError(callback + ' is not a function');
        }

        var result = new this.constructor();
        for (var iter = jspa.Iterator(this); iter.hasNext; ) {
            var item = iter.next();

            if (callback.call(thisArg, item[1], item[0], this)) {
                if (result.set) {
                    result.set(item[0], item[1]);
                } else {
                    result.add(item[1]);
                }
            }
        }

        return result;
    },

    map: function(callback, thisArg) {
        if (!Function.isInstance(callback)) {
            throw new TypeError(callback + ' is not a function');
        }

        var result = new this.constructor();
        for (var iter = jspa.Iterator(this); iter.hasNext; ) {
            var item = iter.next();

            item = callback.call(thisArg, item[1], item[0], this);
            if (result.set) {
                result.set(item[0], item[1]);
            } else {
                result.add(item[1]);
            }
        }

        return result;
    },

    reduce: function(callback, previousValue) {
        if (!Function.isInstance(callback)) {
            throw new TypeError(callback + ' is not a function');
        }

        var iter = jspa.Iterator(this);
        if (arguments.length == 1) {
            previousValue = iter.next()[1];
        }

        while (iter.hasNext) {
            item = iter.next();

            previousValue = callback.call(null, previousValue, item[1], item[0], this);
        }

        return previousValue;
    }
});

jspa.Collection = Object.inherit(jspa.Iterable, {
    extend: {
        conv: function(items) {
            if (items) {
                if (Array.isInstance(items)) {
                    var col = new this();
                    for (var i = 0, len = items.length; i < len; ++i) {
                        col.add(items[i]);
                    }

                    return col;
                } else if (jspa.Collection.isInstance(items)) {
                    return new this(items);
                }
            }

            return null;
        }
    },

    size: 0,
    seq: [],

    initialize: function(collection) {
        this.seq = [];
        this.size = 0;
        if (collection) {
            for (var iter = collection.iterator(); iter.hasNext; ) {
                this.add(iter.next());
            }
        }
    },

    has: function(element) {
        return this.seq.indexOf(element) != -1;
    },

    add: function(element) {
        this.seq[this.size++] = element;
    },

    remove: function(element) {
        var index = this.seq.indexOf(element);
        if (index > -1) {
            this.seq.splice(index, 1);
            this.size--;
        }
    },

    items: function() {
        var seq = this.seq;
        return new jspa.IndexIterator(this.size, function(index) {
            return [index, seq[index]];
        });
    },

    iterator: function() {
        var seq = this.seq;
        return new jspa.IndexIterator(this.size, function(index) {
            return seq[index];
        });
    },

    toString: function() {
        return this.seq.toString();
    },

    toJSON: function() {
        return this.seq;
    }
});

jspa.List = jspa.Collection.inherit({
    extend: {
        conv: jspa.Collection.conv
    },

    get: function(index) {
        if (index < 0) {
            index = this.size + index;
        }

        if (index >= 0 && index < this.size) {
            return this.seq[index];
        }
    },

    set: function(index, value) {
        if (index < 0) {
            index = this.size + index;
        }

        if (index < 0) {
            this.seq.unshift(value);
            this.size++;
        } else if (index >= this.size) {
            this.seq.push(value);
            this.size++;
        } else {
            this.seq[index] = value;
        }

    },

    indexOf: function(value) {
        return this.seq.indexOf(value);
    },

    lastIndexOf: function(value) {
        return this.seq.lastIndexOf(value);
    }
});

jspa.Set = jspa.Collection.inherit({
    extend: {
        conv: jspa.Collection.conv
    },

    add: function(value) {
        var index = this.seq.indexOf(value);
        if (index < 0) {
            this.seq[this.size++] = value;
        }
    }
});

jspa.Map = jspa.Collection.inherit({
    extend: {
        conv: function(items) {
            if (items) {
                if (Array.isInstance(items)) {
                    var map = new this();
                    for (var i = 0, item; item = items[i]; ++i) {
                        if ('key' in item && 'value' in item) {
                            map.set(item['key'], item['value']);
                        } else {
                            break;
                        }
                    }

                    if (map.size == items.length)
                        return map;
                } else if (jspa.Collection.isInstance(items)) {
                    return new this(items);
                }
            }

            return null;
        }
    },

    initialize: function(collection) {
        this.vals = [];

        if (jspa.Map.isInstance(collection)) {
            this.superCall();
            for (var iter = collection.items(); iter.hasNext; ) {
                var item = iter.next();
                this.set(item[0], item[1]);
            }
        } else {
            this.superCall(collection);
        }
    },

    get: function(key) {
        var index = this.seq.indexOf(key);
        if (index > -1) {
            return this.vals[index];
        }
    },

    add: function(key) {
        this.set(key);
    },

    set: function(key, value) {
        var index = this.seq.indexOf(key);
        if (index < 0) {
            index = this.seq.length;
            this.seq[index] = key;
            this.size++;
        }

        this.vals[index] = value;
    },

    remove: function(key) {
        var index = this.seq.indexOf(key);
        if (index > -1) {
            this.seq.splice(index, 1);
            this.vals.splice(index, 1);
            this.size--;
        }
    },

    items: function() {
        var map = this;
        return new jspa.IndexIterator(this.size, function(index) {
            return [map.seq[index], map.vals[index]];
        });
    },

    keys: function() {
        return this.iterator();
    },

    values: function() {
        var map = this;
        return new jspa.IndexIterator(this.size, function(index) {
            return map.seq[index];
        });
    },

    toString: function() {
        var str = '';
        for (var i = 0, len = this.size; i < len; ++i) {
            if (str != '')
                str += ', ';

            str += this.seq[i];
            str += ': ';
            str += this.vals[i];
        }
        return '[' + str + ']';
    },

    toJSON: function() {
        var map = [];
        for (var i = 0, len = this.size; i < len; ++i) {
            map.push({
                key: this.seq[i],
                value: this.vals[i]
            });
        }
        return map;
    }
});
/**
 * @class jspa.Promise
 */
jspa.Promise = Object.inherit(Bind, {
	extend : {
		/**
		 * Provides a way to execute callback functions based on one or more
		 * objects, usually Deferred objects that represent asynchronous events.
		 * 
		 * @param {...jspa.Promise} args The promises to aggregate
		 * 
		 * @returns {jspa.Promise} an aggregated promise
		 */
		when : function(args) {
			var a = args && args.length !== undefined? args: arguments;
			var count = a.length;
			var aggrDeferred = new jspa.Deferred();
			var data = new Array(count);

			Array.prototype.forEach.call(a, function(promise, index) {
				promise.done(function(arg) {
					data[index] = arguments.length <= 1 ? arg: Array.prototype.slice.call(arguments);
					
					if (!--count) {
						aggrDeferred.resolveWith(this, data);
					}
				}).fail(function() {
					aggrDeferred.rejectWith(this, arguments);
				});
			});

			return aggrDeferred.promise();
		}
	},

    /**
     * @constructor
     * @param {jspa.Deferred} deferred
     */
	initialize : function(deferred) {
		this.deferred = deferred;
	},

	/**
	 * Determine the current state of a Deferred object.
	 */
	state : {
		get : function() {
			return this.deferred._state;
		}
	},

    /**
     * Return this object.
     *
     * @return {jspa.Promise}
     */
    promise: function() {
        return this;
    },

	/**
	 * Add handlers to be called when the Deferred object is either resolved or
	 * rejected.
	 * 
	 * @param {Function} callback
	 */
	always : function(callback) {
		this.done(callback);
		this.fail(callback);
		return this.promise();
	},

	/**
	 * Add handlers to be called when the Deferred object is resolved.
	 * 
	 * @param {Function} callback
	 */
	done : function(callback) {
		if (callback) {			
			if (this.state == 'pending') {
				this.deferred.doneCallbacks.push(callback);
			} else if (this.state == 'resolved') {
				this.deferred.call(callback);
			}
		}

		return this.promise();
	},

	/**
	 * Add handlers to be called when the Deferred object is rejected.
	 * 
	 * @param {Function} callback
	 */
	fail : function(callback) {
		if (callback) {			
			if (this.state == 'pending') {
				this.deferred.failCallbacks.push(callback);
			} else if (this.state == 'rejected') {
				this.deferred.call(callback);
			}
		}

		return this.promise();
	},

	/**
	 * Add handlers to be called when the Deferred object is resolved, rejected,
	 * or still in progress.
     *
     * @param {Function=} doneFilter
     * @param {Function=} failFilter
     * @returns {jspa.Promise}
	 */
	then : function(doneFilter, failFilter) {
        if (doneFilter || failFilter) {
            var newDeferred = new jspa.Deferred();

            this.done(this.filter(newDeferred, doneFilter, 'resolve'));
            this.fail(this.filter(newDeferred, failFilter, 'reject'));

            return newDeferred.promise();
        } else {
            return this.promise();
        }
	},

	filter : function(newDeferred, filter, defaultAction) {
		var promise = this.promise();
		
		return function() {
			var context = this == promise? newDeferred.promise(): this;
			
			if (filter) {
				var returned;
				try {
					returned = filter.apply(this, arguments);
				} catch (e) {
					newDeferred.rejectWith(context, [e]);
					return;
				}

				if (returned !== undefined) {
					if (returned && returned.promise) {
						returned.promise().done(function() {
							return newDeferred.resolveWith(this, arguments);
						}).fail(function() {
							return newDeferred.rejectWith(this, arguments);
						});
					} else {
						newDeferred.resolveWith(context, returned.length !== undefined? returned: [returned]);
					}

					return;
				}
			}

			newDeferred[defaultAction + 'With'](context, arguments);
		};
	}
});

jspa.Deferred = jspa.Promise.inherit({
	_promise : null,
	_state : 'pending',

	thisArg : null,
	args : null,

	initialize : function() {
		this.superCall(this);

		this.doneCallbacks = [];
		this.failCallbacks = [];
	},

	/**
	 * Return a Deferred’s Promise object.
	 * 
	 * @return {jspa.Promise}
	 */
	promise: function() {
        if (!this._promise)
            this._promise = new jspa.Promise(this);

        return this._promise;
	},

	/**
	 * Reject a Deferred object and call any failCallbacks with the given args.
	 */
	reject : function() {
		this.rejectWith(undefined, Array.prototype.slice.call(arguments));
	},

	/**
	 * Reject a Deferred object and call any failCallbacks with the given
	 * context and args.
	 */
	rejectWith : function(context, args) {
		context = context || this.promise();
		
		if (this.state == 'pending') {
			this._state = 'rejected';
			this.thisArg = context;
			this.args = args;

			if (!this.call(this.failCallbacks))
                jspa.EntityManagerFactory.onError.apply(jspa.EntityManagerFactory, args)

			this.doneCallbacks = null;
			this.failCallbacks = null;
		}
	},

	/**
	 * Resolve a Deferred object and call any doneCallbacks with the given args.
	 */
	resolve : function() {
		this.resolveWith(undefined, Array.prototype.slice.call(arguments));
	},

	/**
	 * Resolve a Deferred object and call any doneCallbacks with the given
	 * context and args.
	 */
	resolveWith : function(context, args) {
		context = context || this.promise();
		
		if (this.state == 'pending') {
			this._state = 'resolved';
			this.thisArg = context;
			this.args = args;

			this.call(this.doneCallbacks);

			this.doneCallbacks = null;
			this.failCallbacks = null;
		}
	},

	call : function(callbacks) {
		callbacks = Array.isInstance(callbacks) ? callbacks: [ callbacks ];

		for ( var i = 0, callback; callback = callbacks[i]; ++i) {
			callback.apply(this.thisArg, this.args);
		}

        return i > 0;
	}
});/**
 * @class jspa.util.QueueConnector
 */
jspa.util.QueueConnector = Object.inherit({
	/**
	 * @constructor
     * @param {jspa.util.Queue} queue
     * @param {jspa.connector.Connector} connector
	 */
	initialize: function(queue, connector) {
		this.queue = queue;
		this.connector = connector;
	},

    /**
     * @param {jspa.message.Message} message
     * @return {jspa.Promise}
     */
	send: function(message) {
		return this.connector.send(this, message);
	},

    /**
     * @param {jspa.message.Message} message
     * @return {jspa.message.Message}
     */
	sendBlocked: function(message) {
		this.connector.send(this, message, true);

		return message;
	},

    /**
     * @param {jspa.Promise} promise
     * @param {Function=} doneCallback
     * @param {Function=} failCallback
     * @return {jspa.Promise}
     */
	wait: function(promise, doneCallback, failCallback) {
		return this.queue.wait(this, promise)
            .then(doneCallback, failCallback);
	},

    /**
     * @param {Function=} doneCallback
     * @return {jspa.Promise}
     */
	yield: function(doneCallback) {
		return this.queue.wait(this).then(doneCallback);
	}
});/**
 * @class jspa.EntityManager
 */
jspa.EntityManager = jspa.util.QueueConnector.inherit({
	
	/**
	 * Determine whether the entity manager is open. 
	 * @type {Boolean} true until the entity manager has been closed
	 */
	isOpen: {
		get: function() {
			return this.queue.isPrevented;
		}
	},
	
	/**
	 * @constructor
	 * @param {jspa.EntityManagerFactory} entityManagerFactory
	 */
	initialize: function(entityManagerFactory) {
		this.superCall(new jspa.util.Queue(), entityManagerFactory.connector);
		this.entities = {};

		this.newOidCounter = 0;
		
		this.entityManagerFactory = entityManagerFactory;
		this.metamodel = entityManagerFactory.metamodel;
		this.transaction = new jspa.EntityTransaction(this);
	},
	
	/**
	 * Get an instance, whose state may be lazily fetched. If the requested instance does not exist 
	 * in the database, the EntityNotFoundError is thrown when the instance state is first accessed. 
	 * The application should not expect that the instance state will be available upon detachment, 
	 * unless it was accessed by the application while the entity manager was open.
	 * 
	 * @param {(Function|String)} entityClass
	 * @param {String=} oid
	 */
	getReference: function(entityClass, oid) {
		var identifier, type;
		if (String.isInstance(entityClass)) {
            if (String.isInstance(oid)) {
                entityClass += '/' + oid;
            }

			identifier = entityClass;
			type = this.metamodel.entity(identifier.substring(0, identifier.lastIndexOf('/')));
		} else {
			type = this.metamodel.entity(entityClass);
			identifier = type.identifier + '/' + oid;
		}
		
		var entity = this.entities[identifier];
		if (!entity) {
			entity = type.create();
			this.replaceReference(null, identifier, entity);
		}
		
		return entity;
	},
	
	/**
	 * Create an instance of Query or TypedQuery for executing a query language statement. 
	 * if the optional resultClass argument is provided, the select list of the query must contain
	 * only a single item, which must be assignable to the type specified by the resultClass argument.
	 * 
	 * @param {String|Object} qlString - a query string
	 * @param {String|Function=} resultClass - the optional type of the query result
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
	clear: function(doneCallback, failCallback) {
		return this.yield().then(function() {			
			for (var identifier in this.entities) {
				this.removeReference(this.entities[identifier]);
			}
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Close an application-managed entity manager. After the close method has been invoked, 
	 * all methods on the EntityManager instance and any Query and TypedQuery objects obtained from it 
	 * will throw the IllegalStateError except for transaction, and isOpen (which will return false).
	 * If this method is called when the entity manager is associated with an active transaction, 
	 * the persistence context remains managed until the transaction completes. 
	 */
	close: function(doneCallback, failCallback) {
		var result = this.clear(doneCallback, failCallback);
		this.queue.stop();
		return result;
	},
	
	/**
	 * Check if the instance is a managed entity instance belonging to the current persistence context. 
	 * @param {Object} entity - entity instance 
	 * @returns {Boolean} boolean indicating if entity is in persistence context
	 */
	contains: function(entity) {
		var state = jspa.util.State.get(entity);
		if (!state)
			return false;
			
		var identifier = state.type.id.getValue(entity);
		return identifier && !state.isDeleted && this.entities[identifier] === entity;
	},
	
	/**
	 * Remove the given entity from the persistence context, causing a managed entity to become detached. 
	 * Unflushed changes made to the entity if any (including removal of the entity), 
	 * will not be synchronized to the database. Entities which previously referenced the detached entity will continue to reference it. 
	 * @param {Object} entity - entity instance
	 */
	detach: function(entity, doneCallback, failCallback) {
		return this.yield().then(function() {			
			this.removeReference(entity);
			return entity;
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Find by object ID. Search for an entity of the specified oid. 
	 * If the entity instance is contained in the persistence context, it is returned from there.
	 * @param {(Function|String)} entityClass - entity class
	 * @param {String=} oid - Object ID
     * @param {Function=} doneCallback
     * @param {function=} failCallback
	 */
	find: function(entityClass, oid, doneCallback, failCallback) {
		return this.yield().then(function() {
			var entity = this.getReference(entityClass, oid);
			var state = jspa.util.State.get(entity);
			
			if (state.isLoaded) {
				return entity;
			} else {
				var tid = 0, identifier = state.type.id.getValue(entity);
				if (this.transaction.isChanged(identifier))
					tid = this.transaction.tid;
				
				var result = this.send(new jspa.message.GetObject(state, tid)).then(function() {
					if (state.isDeleted) {
						this.removeReference(entity);
						entity = null;
					}
					
					return entity;
				});
				
				return this.wait(result);
			}			
		}).then(doneCallback, failCallback);
	},
	
	findBlocked: function(entityClass, oid) {
		var state, type;
		if (jspa.util.State.isInstance(entityClass)) {
			state = entityClass;
			type = state.type;
		} else {
			var entity = this.getReference(entityClass, oid);
			type = this.metamodel.entity(entity.constructor);
			state = jspa.util.State.get(entity);
		}
		
		if (!state.isLoaded) {
			var tid = 0, identifier = type.id.getValue(state.entity);
			if (this.transaction.isChanged(identifier))
				tid = this.transaction.tid;
			
			this.sendBlocked(new jspa.message.GetObject(state, tid));

			if (state.isDeleted) {
				this.removeReference(state.entity);
				throw new jspa.error.EntityNotFoundError(type.id.getValue(state.entity));
			}
		}
		
		return state.entity;
	},
	
	/**
	 * Synchronize the persistence context to the underlying database.
     *
     * @returns {jspa.Promise}
	 */
	flush: function(doneCallback, failCallback) {
		var result = this.yield().then(function() {	
			var promises = [];
			
			for (var identifier in this.entities) {
				var entity = this.entities[identifier];
				var state = jspa.util.State.get(entity);
				
				if (state.isDirty) {
					var promise;
					if (state.isTemporary) {
						var msg = new jspa.message.PostObject(state);
						msg.temporaryIdentifier = state.type.id.getValue(entity);
						
						promise = this.send(msg).done(function(msg) {
							var state = msg.state;
							var id = state.type.id.getValue(state.entity);
							
							this.transaction.setChanged(id);
							this.replaceReference(msg.temporaryIdentifier, id, state.entity);
						});
					} else if (state.isDeleted) {
						promise = this.send(new jspa.message.DeleteObject(state)).done(function(msg) {
							var state = msg.state;
							var id = state.type.id.getValue(state.entity);
							this.transaction.setChanged(id);
							
							if (!this.transaction.isActive)
								this.removeReference(state.entity);
						});
					} else {
						promise = this.send(new jspa.message.PutObject(state)).done(function(msg) {
							var state = msg.state;
							if (msg.state.isDeleted) {
								this.removeReference(state.entity);
							} else {
								var id = state.type.id.getValue(state.entity);
								this.transaction.setChanged(id);
							}				
						});
					}
					
					promises.push(promise);
				}
			}
			
			if (promises.length)
				return jspa.Promise.when(promises);
		}).then(function() {
			if (!this.transaction.isActive) {
				var promises = [];
				
				//update all objects which have referenced a temporary object
				for (var identifier in this.entities) {
					var entity = this.entities[identifier];
					var state = jspa.util.State.get(entity);
					
					if (state.isDirty) {
						var promise = this.send(new jspa.message.PutObject(state)).done(function(msg) {
							if (msg.state.isDeleted) {
								this.removeReference(msg.state.entity);
							}
						});
						
						promises.push(promise);
					}
				}
				
				if (promises.length)
					return jspa.Promise.when(promises);
			}
		});
		
		return this.wait(result).then(doneCallback, failCallback);
	},
	
	/**
	 * Merge the state of the given entity into the current persistence context. 
	 *
	 * @param {*} entity - entity instance
	 * @return {jspa.Promise} the promise will be called with the managed instance that the state was merged to
	 */
	merge: function(entity, doneCallback, failCallback) {
		return this.yield().then(function() {
			var type = this.metamodel.entity(entity.constructor);
			var identifier = type.id.getValue(entity);
			if (identifier) {
				return this.find(identifier).then(function(persistentEntity) {
					if (persistentEntity && persistentEntity.constructor == entity.constructor) {
						var type = this.metamodel.entity(persistentEntity.constructor);
						for (var iter = type.attributes(); iter.hasNext; ) {
							var attribute = iter.next();
							
							attribute.setValue(persistentEntity, attribute.getValue(entity));							
						}

						return persistentEntity;
					} else {
						throw new jspa.error.EntityNotFoundError(identifier);
					}
				});
			} else {
				throw new jspa.error.IllegalEntityError(entity);
			}
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Make an instance managed and persistent. 
	 * @param {Object} entity - entity instance
	 */
	persist: function(entity, doneCallback, failCallback) {
		return this.yield().then(function() {	
			this.addReference(entity);
			return entity;
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Refresh the state of the instance from the database, overwriting changes made to the entity, if any. 
	 * @param {Object} entity - entity instance
	 */
	refresh: function(entity, doneCallback, failCallback) {
		return this.yield().then(function() {
			if (!this.contains(entity)) {
				throw new jspa.error.IllegalEntityError(entity);
			} else {
				var state = jspa.util.State.get(entity);
				
				if (state.isTemporary) {				
					throw new jspa.error.IllegalEntityError(entity);
				} else {
					var tid = 0, identifier = state.type.id.getValue(entity);
					if (this.transaction.isChanged(identifier))
						tid = this.transaction.tid;

                    state.isDirty = false; // allow incoming changes to overwrite local changes
					var result = this.send(new jspa.message.GetObject(state, tid)).then(function() {
						if (state.isDeleted) {
							this.removeReference(entity);	
							throw new jspa.error.EntityNotFoundError(identifier);
						}
					});
					
					return this.wait(result);
				}
			}
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Remove the entity instance. 
	 * @param {Object} entity - entity instance
	 */
	remove: function(entity, doneCallback, failCallback) {
		return this.yield().then(function() {
			var state = jspa.util.State.get(entity);
			if (state) {					
				if (this.contains(entity)) {
					if (state.isTemporary) {					
						this.removeReference(entity);
					} else {					
						state.setDeleted();
					}
				}
			} else {
				var type = this.metamodel.entity(entity.constructor);
				if (type) {
					var identity = type.id.getValue(entity);
					if (identity) {						
						throw new jspa.error.EntityExistsError(identity);
					}
				} else {
					throw new jspa.error.IllegalEntityError(entity);
				}
			}
		}).then(doneCallback, failCallback);
	},
	
	addReference: function(entity) {
		var state = jspa.util.State.get(entity);

		var type;
		if (!this.contains(entity)) {
			if (state && state.isDeleted) {
				state.setPersistent();
			} else {
				type = this.metamodel.entity(entity.constructor);
				if (!type)
					throw new jspa.error.IllegalEntityError(entity);
				
				var identity = type.id.getValue(entity);
				if (identity)
					throw new jspa.error.EntityExistsError(identity);
				
				var temporaryIdentifier = '/temporary/' + type.identifier.substring(4);
				temporaryIdentifier += '/' + (++this.newOidCounter);

				state = this.replaceReference(null, temporaryIdentifier, entity);
				state.setTemporary();
			}
		}
			
		type = state.type;
		
		for (var iter = type.attributes(); iter.hasNext; ) {	
			var attribute = iter.next();		
			if (attribute.isAssociation) {
				var value = attribute.getValue(entity);
				if (value) {
					this.addReference(value);
				}
			}
		}
	},
	
	replaceReference: function(oldIdentifier, newIdentifier, entity) {
		if (oldIdentifier in this.entities) {
			delete this.entities[oldIdentifier];
		}
		
		var state = jspa.util.State.get(entity);
		if (!state) {
			var type = this.metamodel.entity(entity.constructor);
			state = new jspa.util.State(this, type, entity);
		}

        state.type.id.setValue(entity, newIdentifier);
		
		this.entities[newIdentifier] = entity;
		
		return state;
	},
	
	removeReference: function(entity) {
		var state = jspa.util.State.get(entity);
		if (!state)
			throw new jspa.error.IllegalEntityError(entity);
		
		state.remove();

		delete this.entities[state.type.id.getValue(entity)];
	}
});/**
 * @class jspa.EntityManagerFactory
 */
jspa.EntityManagerFactory = Object.inherit({
	extend: {
        /**
         * @param {Error} e
         */
		onError: function(e) {	
			console.error(e);
            //throw e;
		}
	},
	
	isDefining: false,
	
	/**
	 * @constructor
	 * @param {String} host 
	 * @param {Number} [port]  
	 */
	initialize: function(host, port) { 
		this.connector = jspa.connector.Connector.create(host, port);
		this.metamodel = new jspa.metamodel.Metamodel();
		this.persistenceUnitUtil = new jspa.PersistenceUnitUtil(this.metamodel);
		
		this.pendingQueues = [];
		
		var msg = new jspa.message.GetAllSchemas(this.metamodel);
		this.connector.send(this, msg).then(function(msg) {
			return this.ready(msg.models);
		}).done(function() {
			for (var i = 0, queue; queue = this.pendingQueues[i]; ++i) {
				queue.start();
			}
			
			this.pendingQueues = null;
		}).fail(function(e) {
			jspa.EntityManagerFactory.onError(e);
		});
	},
	
	ready: function(models) {
		if (this.newModel) {
			var toStore = this.newModel.filter(function(el, i){
				return !(el["class"] in models);
			});
			this.newModel = null;
			
			if(toStore.length > 0) {
				var msg = new jspa.message.PostAllSchemas(this.metamodel, toStore);
				return this.connector.send(this, msg).then(function(msg) {
					this.ready(msg.models);
				});
			}
		}
		
		for (var identifier in models) {
            var type = models[identifier];
            this.metamodel.addType(type);
		}
	},
	
	/**
	 * Create a new application-managed EntityManager. This method returns a new EntityManager 
	 * instance each time it is invoked. The isOpen method will return true on the returned instance.
	 * 
	 * @returns {jspa.EntityManager} entity manager instance
	 */
	createEntityManager: function() {
		var entityManager = new jspa.EntityManager(this);
		
		if (this.pendingQueues) {
			var queue = entityManager.queue;
			queue.wait();
			this.pendingQueues.push(queue);
		}
		
		return entityManager;
	},
	
	define: function(model) {
		this.newModel = model;
	}
});/**
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
});/**
 * @class jspa.PersistenceUnitUtil
 */
jspa.PersistenceUnitUtil = Object.inherit({
	
	/**
	 * @constructor
	 * @param {jspa.metamodel.Metamodel} metamodel
	 */
	initialize: function(metamodel) {
		this.metamodel = metamodel;
	},
	
	/**
	 * Return the id of the entity. A generated id is not guaranteed to be available until after the database 
	 * insert has occurred. Returns null if the entity does not yet have an id.
	 * 
	 * @param {Object} entity
	 * @param {jspa.util.State} entity
	 */
	getIdentifier: function(entity) {
		var type = this.metamodel.entity(classOf(entity));
		var identifier = type.id.getValue(entity);
		if (identifier && identifier.indexOf('/temporary/') != 0) {
			return identifier.substring(identifier.lastIndexOf('/') + 1);
		}
		return null;
	},
	
	/**
	 * Determine the load state of an entity belonging to the persistence unit. This method can be used to 
	 * determine the load state of an entity passed as a reference.
	 * 
	 * @param {Object} entity - entity instance whose load state is to be determined
	 * @param {String=} attributeName - optional name of attribute whose load state is to be determined
	 * @returns {Boolean} false if entity's state has not been loaded or if the attribute state has not been loaded, else true
	 */
	isLoaded: function(entity, attributeName) {
		var state = jspa.util.State.get(entity);
		if (!state) {
			return true;
		} else if (!state.isLoaded) {
			return false;
		} else {
			if (!attributeName) {
				return true;
			} else {
				var attribute = state.type.getAttribute(attributeName);
				if (attribute.isAssociation) {
					var value = attribute.getValue(entity);
					return !value || this.isLoaded(value);
				} else {
					return true;
				}
			}
		}
	}
});/**
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
});/**
 * @class jspa.binding.Accessor
 */
jspa.binding.Accessor = Object.inherit({
	/**
	 * @param {Object} object
	 * @param {jspa.metamodel.Attribute} attribute
	 * @returns {*}
	 */
	getValue: function(object, attribute) {
		return object[attribute.name];
	},
	 
	/**
	 * @param {Object} object
	 * @param {jspa.metamodel.Attribute} attribute
	 * @param {*} value
	 */
	setValue: function(object, attribute, value) {
		object[attribute.name] = value;
	}
});/**
 * @class jspa.binding.ClassUtil
 */
jspa.binding.ClassUtil = Object.inherit({
	extend: {
		classLoaders: [],
		
		initialize: function() {
			this.addClassLoader(this.proxyLoader);
			this.addClassLoader(this.globalLoader);
			this.addClassLoader(this.moduleLoader);
		},
		
		loadClass: function(model) {
			var el = /\/db\/(([\w\.]*)\.)?(\w*)/.exec(model.identifier);

			var namespace = el[1];
			var className = el[3];
			
			for (var i = this.classLoaders.length - 1, loader; loader = this.classLoaders[i]; --i) {
				try {
					return loader(model, namespace, className);
				} catch (e) {}
			}
			
			throw new TypeError('The class for ' + model.identifier + ' was not found!');
		},
		
		addClassLoader: function(classLoader) {
			this.classLoaders.push(classLoader);
		},
		
		removeClassLoader: function(classLoader) {
			var index = this.classLoaders.indexOf(classLoader);
			if (index != -1) {
				this.classLoaders.splice(index, 1);
			}
		},
		
		globalLoader: function(model, namespace, className) {
			var context = typeof window != 'undefined'? window: global;
			
			var n = context;
            if (namespace) {
                var fragments = namespace.split('.');
                for (var i = 0, fragment; n && (fragment = fragments[i]); ++i) {
                    n = n[fragment];
                }
            }
			
			var cls = n && n[className] /* || context[className] */; // name clash with dom classes
			
			if (cls) {
				return cls;
			} else {
				throw new TypeError('The class was not found in the global context.');
			}
		},
		
		moduleLoader: function(model, namespace, name) {
			var mod = module;
			while (mod = mod.parent) {
				if (name in mod) {
					return name[mod];
				}
			}
			
			throw new TypeError('The class was not found in the parent modules.');
		},
		
		proxyLoader: function(model) {
            if (model.isEntity) {
                console.log('Initialize proxy class for entity ' + model.identifier + '.');
                return model.supertype.typeConstructor.inherit({});
            } else if (model.isEmbeddable) {
                console.log('Initialize proxy class for embeddable ' + model.identifier + '.');
                return Object.inherit({});
            } else {
                throw new TypeError('No proxy class can be initialized.');
            }
		}
	},
	
	/**
	 * @param {Function} typeConstructor
	 * @returns {String}
	 */
	getIdentifier: function(typeConstructor) {
		return typeConstructor.__jspaId__;
	},
	
	/**
	 * @param {Function}
	 * @param {String} identifier
	 */
	setIdentifier: function(typeConstructor, identifier) {
		typeConstructor.__jspaId__ = identifier;
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} type
	 * @returns {Object}
	 */
	create: function(type) {
		return Object.create(type.typeConstructor.prototype);
	},
	
	/**
	 * @param {String} model
	 * @returns {Function}
	 */
	loadClass: function(model) {
		return jspa.binding.ClassUtil.loadClass(model);
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} type
	 * @param {Function} typeConstructor
	 */
	enhance: function(type, typeConstructor) {
        Object.defineProperty(typeConstructor.prototype, '_objectInfo', {
            value: {
                'class': type.identifier
            },
            writable: true,
            enumerable: false
        });

		for (var name in type.declaredAttributes) {
            var attribute = type.declaredAttributes[name];
			this.enhanceProperty(type, attribute, typeConstructor);
		}
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} type
	 * @param {jspa.metamodel.Attribute} attribute
	 * @param {Function} typeConstructor
	 */
	enhanceProperty: function(type, attribute, typeConstructor) {
		var name = '_' + attribute.name;
		Object.defineProperty(typeConstructor.prototype, attribute.name, {
			get: function() {
				jspa.util.State.readAccess(this);
				return this[name];
			},
			set: function(value) {
				jspa.util.State.writeAccess(this);
				this[name] = value;
			},
            configurable: true,
            enumerable: true
		});
	}
});

jspa.collection.Collection = Trait.inherit({

    size: {
        get: function() {
            jspa.util.State.readAccess(this);
            return this._size;
        },
        set: function(value) {
            this._size = value;
        }
    },

    has: function(element) {
        jspa.util.State.readAccess(this);
        return this.superCall(element);
    },

    add: function(element) {
        jspa.util.State.writeAccess(this);
        this.superCall(element);
    },

    remove: function(element) {
        jspa.util.State.writeAccess(this);
        this.superCall(element);
    },

    items: function() {
        jspa.util.State.readAccess(this);
        return this.superCall();
    },

    iterator: function() {
        jspa.util.State.readAccess(this);
        return this.superCall();
    },

    toString: function() {
        jspa.util.State.readAccess(this);
        return this.superCall();
    },

    toJSON: function() {
        jspa.util.State.readAccess(this);
        return this.superCall();
    }
});jspa.collection.List = jspa.collection.Collection.inherit({
	get: function(index) {
		jspa.util.State.readAccess(this);
		return this.superCall(index);
	},
	
	set: function(index, value) {
		jspa.util.State.writeAccess(this);
		this.superCall(index, value);
	},
	
	indexOf: function(value) {
		jspa.util.State.readAccess(this);
		return this.superCall(value);
	},
	
	lastIndexOf: function(value) {
		jspa.util.State.readAccess(this);
		return this.superCall(value);
	}
});jspa.collection.Map = jspa.collection.Collection.inherit({
	hasKey: function(key) {
		jspa.util.State.readAccess(this);
		return this.superCall(key);
	},
	
	hasValue: function(value) {
		jspa.util.State.readAccess(this);
		return this.superCall(value);
	},
	
	get: function(key) {
		jspa.util.State.readAccess(this);
		return this.superCall(key);
	},
	
	set: function(key, value) {
		jspa.util.State.writeAccess(this);
		this.superCall(key, value);
	},
	
	removeKey: function(key) {
		jspa.util.State.writeAccess(this);
		this.superCall(key);
	},
	
	removeValue: function(value) {
		jspa.util.State.writeAccess(this);
		this.superCall(value);
	},
	
	keys: function() {
		jspa.util.State.readAccess(this);
		return this.superCall();
	}
});
jspa.collection.Set = jspa.collection.Collection.inherit({
});/**
 * @class jspa.connector.Connector
 */
jspa.connector.Connector = Object.inherit({
	extend: {
        /**
         * @param {String} host
         * @param {Number} port
         * @return {jspa.connector.Connector}
         */
		create: function(host, port) {
			if (!host && typeof window !== 'undefined') {
				host = window.location.hostname;
				port = window.location.port;
			}
			
			if (host.indexOf('/') != -1) {
				var matches = /^http:\/\/([^\/:]*)(:(\d*))?\/?$/.exec(host);
				if (matches) {
					host = matches[1];
					port = matches[3];
				} else {
					throw new Error('The connection uri host ' + host + ' seems not to be valid');
				}
			}
			
			if (!port)
				port = 80;
			
			for (var name in jspa.connector) {
				var connector = jspa.connector[name];
				if (connector.isUsable && connector.isUsable(host, port)) {
					return new connector(host, port);
				}
			}
			
			throw new Error('No connector is usable for the requested connection');
		}
	},
	
	/**
	 * @constructor
	 * @param {String} host
	 * @param {Integer} port
	 */
	initialize: function(host, port) {
		this.host = host;
		this.port = port;
	},

	/**
     * @param {*} context
	 * @param {jspa.message.Message} message
     * @param {Boolean} sync
     * @returns {jspa.Promise}
	 */
	send: function(context, message, sync) {
		if (!sync) {			
			message.deferred = new jspa.Deferred();
			message.context = context;
		}
		
		try {
			message.doSend();
			this.doSend(message);
		} catch (e) {
			e = jspa.error.PersistentError(e);

			if (!message.deferred) {
				throw e;
			} else {				
				message.deferred.rejectWith(context, [e]);
			}
		}
		
		if (message.deferred)
			return message.deferred.promise();
	},

    /**
     * @param {jspa.message.Message} message
     */
	receive: function(message) {
		try {
			message.doReceive();
		} catch (e) {
			e = jspa.error.PersistentError(e);

			if (!message.deferred) {
				throw e;
			} else {				
				message.deferred.rejectWith(message.context, [e]);
			}
		}
		
		if (message.deferred) {			
			message.deferred.resolveWith(message.context, [message]);
		}
	},

    /**
     * @param {jspa.message.Message} message
     */
	doSend: function(message) {
		throw new Error('Connector.doSend() not implemented');
	},
	
	/**
	 * @param {jspa.message.Message} message
	 */
	prepareRequestEntity: function(message) {
		if (message.request.entity) {
			message.request.headers['Content-Type'] = 'application/json;charset=utf-8';
			return JSON.stringify(message.request.entity);
		} else {
			return null;
		}
	},

    /**
     * @param {jspa.message.Message} message
     * @param {Object} data
     */
	prepareResponseEntity: function(message, data) {
		var entity = null;
		if (data && data.length > 0) {
			entity = JSON.parse(data);
		}
		
		message.response.entity = entity;
	}
});/**
 * @class jspa.connector.NodeConnector
 * @extends jspa.connector.Connector
 */
jspa.connector.NodeConnector = jspa.connector.Connector.inherit({
	extend: {
		isUsable: function(host, port) {
			if (!this.prototype.http) {
				try {
					var http = require('http');
					if (http.ClientRequest) {
						this.prototype.http = http;
					} 
				} catch (e) {};
			}
			return Boolean(this.prototype.http);
		}
	},
	
	/**
	 * @param {jspa.message.Message} message
	 */
	doSend: function(message) {
		if (!message.deferred)
			throw new Error('Blocking IO is not supported');
		
		message.request.host = this.host;
		message.request.port = this.port;
		
		var self = this;
		var entity = this.prepareRequestEntity(message);
		
		if (entity)
			message.request.headers['Transfer-Encoding'] = 'chunked';
		
		var req = this.http.request(message.request, function(res) {
			var data = '';
			
			res.setEncoding('utf-8');
			res.on('data', function(chunk) {
				data += chunk;
			});
			res.on('end', function() {
				message.response.statusCode = res.statusCode;
				message.response.headers = res.headers;
				self.prepareResponseEntity(message, data);
				self.receive(message);
			});
		});

		req.on('error', function() {
			self.receive(message);
		});
		
		if (entity)
			req.write(entity, 'utf8');
		
		req.end();
	}
});/**
 * @class jspa.error.PersistentError
 * @extends Error
 */
jspa.error.PersistentError = Error.inherit({
	cause: null,
	
	extend: {
		conv: function(e) {
			if (Error.isInstance(e)) {
				return new this(null, e);
			}
		}
	},

    /**
     * @constructor
     * @param {String} message
     * @param {Error} cause
     */
	initialize: function(message, cause) {
		this.superCall(message? message: 'An unexpected persistent error occured. ' + cause? cause.message: '');
		
		if (cause) {
			this.cause = cause;
            this.stack += 'Caused By: ' + cause.message + ' ' + cause.stack;
		}
	}
});/**
 * @class jspa.error.CommunicationError
 * @extends jspa.error.PersistentError
 */
jspa.error.CommunicationError = jspa.error.PersistentError.inherit({
	initialize: function(httpMessage) {
		var state = (httpMessage.response.statusCode == 0? 'Request': 'Response');
		this.superCall('Communication failed by handling the ' + state + ' for ' + 
				httpMessage.request.method + ' ' + httpMessage.request.path);

		var cause = httpMessage.response.entity;
		
		if (cause)
			this.stack += cause.message || 'CommunicationError';
		
		while (cause) {			
			this.stack += 'Serverside Caused by ' + cause.className + ' ' + cause.message + '\n';
			
			var stackTrace = cause.stackTrace;
			for (var i = 0; i < stackTrace.length; ++i) {
				var el = stackTrace[i];

				this.stack += '  at ' + el.className + '.' + el.methodName;
				this.stack += ' (' + el.fileName + ':' + el.lineNumber + ')\n';
			}
			
			cause = cause.cause;
		}	
	}
});/**
 * @class jspa.connector.XMLHttpConnector
 * @extends jspa.connector.Connector
 */
jspa.connector.XMLHttpConnector = jspa.connector.Connector.inherit({
	extend: {
		isUsable: function(host, port) {
			return typeof XMLHttpRequest != 'undefined';
		}
	},
	
	/**
	 * @param {jspa.message.Message} message
	 */
	doSend: function(message) {
		var xhr = new XMLHttpRequest();
		
		var url = 'http://' + this.host + ':' + this.port + message.request.path;
		//console.log(message.request.method + ' ' + url);

		if (message.deferred)			
			xhr.onreadystatechange = this.readyStateChange.bind(this, xhr, message);
		
		xhr.open(message.request.method, url, !!message.deferred);

		var entity = this.prepareRequestEntity(message);
		var headers = message.request.headers;
		for (var name in headers)
			xhr.setRequestHeader(name, headers[name]);

		xhr.send(entity);
		
		if (!message.deferred)
			this.doReceive(xhr, message);
	},
	
	readyStateChange: function(xhr, message) {
		if (xhr.readyState == 4) {
			this.doReceive(xhr, message);
		}
	},
	
	doReceive: function(xhr, message) {
		message.response.statusCode = xhr.status;
		
		var headers = message.response.headers;
		for (var name in headers)
			headers[name] = xhr.getResponseHeader(name);
		
		this.prepareResponseEntity(message, xhr.responseText);
		this.receive(message);
	}
});/**
 * @class jspa.error.EntityExistsError
 * @extends jspa.error.PersistentError
 */
jspa.error.EntityExistsError = jspa.error.PersistentError.inherit({
    /**
     * @constructor
     * @param {String} identity
     */
    initialize: function(identity) {
		this.superCall('Entity ' + identity + ' exists already');
		
		this.identity = identity;
	}
});/**
 * @class jspa.error.IllegalEntityError
 * @extends jspa.error.PersistentError
 */
jspa.error.IllegalEntityError = jspa.error.PersistentError.inherit({
    /**
     * @constructor
     * @param {*} entity
     */
    initialize: function(entity) {
		this.superCall('Entity ' + entity + ' is not a valid entity');
		
		this.entity = entity;
	}
});/**
 * @class jspa.error.EntityNotFoundError
 * @extends jspa.error.PersistentError
 */
jspa.error.EntityNotFoundError = jspa.error.PersistentError.inherit({
    /**
     * @constructor
     * @param {String} identity
     */
    initialize: function(identity) {
		this.superCall('Entity ' + identity + ' is not found');
		
		this.identity = identity;
	}
});/**
 * @class jspa.error.RollbackError
 * @extends jspa.error.PersistentError
 */
jspa.error.RollbackError = jspa.error.PersistentError.inherit({
    /**
     * @constructor
     * @param {Error} cause
     */
    initialize: function(cause) {
		this.superCall('The transaction has been rollbacked', cause);
	}
});
/**
 * @class jspa.message.Message
 */
jspa.message.Message = Object.inherit({

    /**
     * @type {jspa.Deferred}
     */
    deferred: null,

	/**
	 * @constructor
     * @param {String} method
	 * @param {String} path
     * @param {Object} requestEntity
	 */
	initialize: function(method, path, requestEntity) {
		this.request = {
			method: method,
			path: path,
			headers: {
				'accept': 'application/json'
			},
			entity: requestEntity? requestEntity: null
		};
		
		this.response = {
			statusCode: 0,
			headers: {},
			entity: null
		};
	},
	
	doSend: function() {},
	
	doReceive: function() {}
});/**
 * @class jspa.message.DeleteObject
 * @extends jspa.message.Message
 */
jspa.message.DeleteObject = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {jspa.Transaction} transaction
	 * @param {jspa.util.State} state
	 */
	initialize: function(state) {
		this.superCall('delete', state.getIdentifier());

		this.state = state;
	},
	
	doSend: function() {
		this.request.entity = this.state.getDatabaseObjectInfo();
		
		var version = this.state.getVersion();
		if (version) {
			Object.extend(this.request.headers, {
				'if-match': version == '*'? version: '"' + version + '"'
			});
		}
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 202:
			case 204:
			case 404:
				this.state.setDeleted();
				break;
			default:
				throw new jspa.error.CommunicationError(this);
		}
	}
});/**
 * @class jspa.message.GetAllOids
 * @extends jspa.message.Message
 */
jspa.message.GetAllOids = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {jspa.metamodel.EntityType} type
     * @param {number} start
     * @param {number} count
	 */
	initialize: function(type, start, count) {
		this.superCall('get', this.createUri(type, start, count));
	},

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} type
     * @param {number} start
     * @param {number} count
     */
	createUri: function(type, start, count) {
		var uri = (type? type.identifier: '/db') + '/all_oids';
		
		if (start > 0)
			uri += ';start=' + start;
		
		if (count < Number.MAX_VALUE)
			uri += ';count=' + count;
		
		return uri;
	},
	
	doReceive: function() {
		if (this.response.statusCode == 200)
			this.oids = this.response.entity;
		else
			throw new jspa.error.CommunicationError(this);
	}
});/**
 * @class jspa.message.GetAllSchemas
 * @extends jspa.message.Message
 */
jspa.message.GetAllSchemas = jspa.message.Message.inherit({
	/**
	 * @constructor
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
/**
 * @class jspa.message.GetObject
 * @extends jspa.message.Message
 */
jspa.message.GetObject = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {jspa.util.State} state
	 * @param {String} tid
	 */
	initialize: function(state, tid) {
		var id = state.getIdentifier();
		
		if (tid) {
			id = id.replace('/db/', '/transaction/' + tid + '/dbview/');
		}
		
		this.superCall('get', id);
		
		this.state = state;
	},
	
	doSend: function() {
		var version = this.state.getVersion();
		if (version) {			
			Object.extend(this.request.headers, {
				'cache-control': 'max-age=0, no-cache',
				'pragma': 'no-cache'
			});
			
			// we can revalidate if the object is not dirty
			if (!this.state.isDirty) {
				this.request.headers['if-none-match'] = version == '*'? version: '"' + version + '"';
			}
		}
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 304:			
				break;
			case 200:
				this.state.setDatabaseObject(this.response.entity);
				this.state.setPersistent();
				break;
			case 404:
				this.state.setDeleted();
				break;
			default:
				throw new jspa.error.CommunicationError(this);
		}
	}
});/**
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

        uri += '?query=' + encodeURIComponent(query);

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
});/**
 * @class jspa.message.PostAllSchemas
 * @extends jspa.message.Message
 */
jspa.message.PostAllSchemas = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {jspa.metamodel.Metamodel} metamodel
     * @param {String} types
	 */
	initialize: function(metamodel, types) {
		this.superCall('post', '/db/all_schemas');
		
		this.metamodel = metamodel;
		this.types = types;
	},
	
	doSend: function() {
		this.request.entity = this.types;
	},
	
	doReceive: function() {
		if (this.response.statusCode == 200) {
			var builder = new jspa.metamodel.ModelBuilder(this.metamodel);
			this.models = builder.buildModels(this.response.entity);
		} else {
			throw new jspa.error.CommunicationError(this);
		}
	}
});/**
 * @class jspa.message.PostObject
 * @extends jspa.message.Message
 */
jspa.message.PostObject = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {jspa.util.State} state
	 */
	initialize: function(state) {
		this.superCall('post', state.type.identifier);
		
		this.state = state;
	},
	
	doSend: function() {
		this.request.entity = this.state.getDatabaseObject();
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 201:
			case 202:
				this.state.setDatabaseObject(this.response.entity);
				this.state.setPersistent();
				break;
			case 404:
				this.state.setDeleted();
				break;
			default:
				throw new jspa.error.CommunicationError(this);
		}
	}
});
/**
 * @class jspa.message.PostTransaction
 * @extends jspa.message.Message
 */
jspa.message.PostTransaction = jspa.message.Message.inherit({
	/**
	 * @constructor
	 */
	initialize: function() {
		this.superCall('post', '/transaction');
		
		Object.extend(this.response.headers, {
			'location': null
		});
	},
	
	doReceive: function() {
		if (this.response.statusCode == 201) {
			this.tid = this.response.headers['location'].split('/transaction/').pop();
		} else
			throw new jspa.error.CommunicationError(this);
	}
});/**
 * @extends jspa.message.Message
 * @class jspa.message.PutObject
 */
jspa.message.PutObject = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {jspa.util.State} state
	 */
	initialize: function(state) {
		this.superCall('put', state.getIdentifier());
		
		this.state = state;
	},
	
	doSend: function() {
		var version = this.state.getVersion();
		
		Object.extend(this.request.headers, {
			'if-match': !version || version == '*'? '*': '"' + version + '"'
		});
		
		this.request.entity = this.state.getDatabaseObject();
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 200:
				this.state.setDatabaseObject(this.response.entity);
				//mark as persistent in next case
			case 202:
				this.state.setPersistent();
				break;
			case 404: 
				this.state.setDeleted();
				break;
			default:
				throw new jspa.error.CommunicationError(this);
		}
	}
});/**
 * @class jspa.message.PutTransactionAborted
 * @extends jspa.message.Message
 */
jspa.message.PutTransactionAborted = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {String} tid
	 */
	initialize: function(tid) {
		this.superCall('put', '/transaction/' + tid + '/aborted');
	},
	
	doReceive: function() {
		if (this.response.statusCode != 202)
			throw new jspa.error.CommunicationError(this);
	}
});/**
 * @class jspa.metamodel.Attribute
 */
jspa.metamodel.Attribute = Object.inherit({

	extend: {
		PersistentAttributeType: {
			BASIC: 0,
			ELEMENT_COLLECTION: 1,
			EMBEDDED: 2,
			MANY_TO_MANY: 3,
			MANY_TO_ONE: 4,
			ONE_TO_MANY: 5,
			ONE_TO_ONE: 6
		}
	},
	
	/**
	 * @type Boolean
	 */
	isAssociation: {
		get: function() {
			return this.persistentAttributeType > jspa.metamodel.Attribute.PersistentAttributeType.EMBEDDED;
		}
	},
	
	/**
	 * @type {Boolean}
	 */
	isCollection: {
		get: function() {
			return this.persistentAttributeType == jspa.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
		}
	},

	/**
	 * @type {Boolean}
	 */
	isId: false,

	/**
	 * @type {Boolean}
	 */
	isVersion: false,
	
	/**
	 * @constructor
	 * @param {jspa.metamodel.EntityType} declaringType
	 * @param {String} name
	 */
	initialize: function(declaringType, name) {
		this.accessor = new jspa.binding.Accessor();
		this.declaringType = declaringType;
		this.name = name;
	},
	
	/**
	 * @param {Object} entity
	 * @returns {*}
	 */
	getValue: function(entity) {
        if (this.isId || this.isVersion)
            return entity._objectInfo[this.name];

        return this.accessor.getValue(entity, this);
	},
	
	/**
	 * @param {Object} entity
	 * @param {*} value
	 */
	setValue: function(entity, value) {
        if (this.isId || this.isVersion) {
            entity._objectInfo[this.name] = value;
        } else {
            this.accessor.setValue(entity, this, value);
        }
	}
});/**
 * @class jspa.message.PutTransactionTidCommitted
 * @extends jspa.message.Message
 */
jspa.message.PutTransactionCommitted = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {String} tid
     * @param {Object} readSet
	 */
	initialize: function(tid, readSet) {
		this.superCall('put', '/transaction/' + tid + '/committed', readSet);
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 200:
				this.oids = this.response.entity;
				break;
			case 412:
				throw new jspa.error.RollbackError();
			default:
				throw new jspa.error.CommunicationError(this);
		}
	}
});/**
 * @class jspa.metamodel.Type
 */
jspa.metamodel.Type = Object.inherit({
	extend: {
		PersistenceType: {
			BASIC: 0,
			EMBEDDABLE: 1,
			ENTITY: 2,
			MAPPED_SUPERCLASS: 3
		}
	},

    /**
     * @type {Boolean}
     */
	isBasic: {
		get: function() {
			return this.persistenceType == jspa.metamodel.Type.PersistenceType.BASIC;
		}
	},

    /**
     * @type {Boolean}
     */
	isEmbeddable: {
		get: function() {
			return this.persistenceType == jspa.metamodel.Type.PersistenceType.EMBEDDABLE;
		}
	},

    /**
     * @type {Boolean}
     */
	isEntity: {
		get: function() {
			return this.persistenceType == jspa.metamodel.Type.PersistenceType.ENTITY;
		}
	},

    /**
     * @type {Boolean}
     */
	isMappedSuperclass: {
		get: function() {
			return this.persistenceType == jspa.metamodel.Type.PersistenceType.MAPPED_SUPERCLASS;
		}
	},

    /**
     * @type Number
     */
    persistenceType: -1,
	
	/**
	 * @constructor
	 * @memberOf jspa.metamodel.Type
	 * @param {String} identifier
	 * @param {Function} typeConstructor
	 */
	initialize: function(identifier, typeConstructor) {
		this.identifier = identifier;
		this.typeConstructor = typeConstructor;
	},

    /**
     * @param {jspa.binding.ClassUtil} classUtil
     */
	init: function(classUtil) {
		this.classUtil = classUtil;

		if (!this.classUtil.getIdentifier(this.typeConstructor))
			this.classUtil.setIdentifier(this.typeConstructor, this.identifier);
	},
	
	/**
	 * @returns {Object}
	 */
	create: function() {
		return this.classUtil.create(this);
	},
	
	/**
	 * @param {jspa.util.State} state
	 * @param {Object} value
	 * @returns {*}
	 */
	toDatabaseValue: function(state, value) {},
	
	/**
	 * @param {jspa.util.State} state
     * @param {Object} currentValue
	 * @param {*} value
	 * @returns {*}
	 */
	fromDatabaseValue: function(state, currentValue, value) {}
});/**
 * @class jspa.metamodel.BasicType
 * @extends jspa.metamodel.Type
 */
jspa.metamodel.BasicType = jspa.metamodel.Type.inherit({
	persistenceType: jspa.metamodel.Type.PersistenceType.BASIC,
	
	isCollection: false,
	
	/**
	 * @constructor
	 * @param {String} identifier
	 * @param {Function} typeConstructor
	 */
	initialize: function(identifier, typeConstructor) {
		if (identifier.indexOf('/') == -1)
			identifier = '/db/_native.' + identifier;

		this.superCall(identifier, typeConstructor);
	},

    /**
     * @param {jspa.util.State} state
     * @param {Object} currentValue
     * @returns {Object}
     */
    toDatabaseValue: function(state, currentValue) {
        if (currentValue === null || currentValue === undefined) {
            return null;
        }

        return this.typeConstructor.asInstance(currentValue);
    },

    /**
     * @param {jspa.util.State} state
     * @param {*} currentValue
     * @param {*} value
     * @returns {*}
     */
    fromDatabaseValue: function(state, currentValue, value) {
        if (value === null || value === undefined) {
            return null;
        }

        return this.typeConstructor.asInstance(value);
    }
});/**
 * @class jspa.metamodel.PluralAttribute
 * @extends jspa.metamodel.Attribute
 */
jspa.metamodel.PluralAttribute = jspa.metamodel.Attribute.inherit({
	extend: {
        /**
         * @readonly
         * @enum {number}
         */
        CollectionType: {
			COLLECTION: 0,
			LIST: 1,
			MAP: 2,
			SET: 3
		}
	},
	
	persistentAttributeType: jspa.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION,
	
	/**
	 * @constructor
	 * @param {jspa.metamodel.EntityType} declaringType
	 * @param {String} name
	 * @param {Function} typeConstructor
	 * @param {jspa.metamodel.Type} elementType
	 */
	initialize: function(declaringType, name, typeConstructor, elementType) {
		this.superCall(declaringType, name);

		this.typeConstructor = typeConstructor;
		this.elementType = elementType;
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @return {Object}
     */
	getDatabaseValue: function(state, obj) {
		var value = this.getValue(obj);
		
		if (value) {
            // convert normal collections to tracked collections
			if (!this.trackedConstructor.isInstance(value)) {
				value = new this.trackedConstructor(value);

                Object.defineProperty(value, '__jspaEntity__', {
                    value: state.entity
                });

				this.setValue(obj, value);
			}
			
			var json = [];
			for (var iter = value.iterator(); iter.hasNext; ) {
				var el = iter.next();
				if (el === null) {
					json.push(el);
				} else {					
					el = this.elementType.toDatabaseValue(state, el);
					if (el !== null)
						json.push(el);
				}
			}

			return json;
		} else {
			return null;
		}
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @param {Object} json
     */
	setDatabaseValue: function(state, obj, json) {
		var value = null;

        if (json) {
			value = this.getValue(obj);
			
			if (!this.trackedConstructor.isInstance(value)) {
				value = new this.trackedConstructor();

                Object.defineProperty(value, '__jspaEntity__', {
                    value: state.entity
                });
			}

            var items = value.seq;
            if (items.length > json.length)
                items.splice(json.length, items.length - json.length);

			for (var i = 0, len = json.length; i < len; ++i) {
                items[i] = this.elementType.fromDatabaseValue(state, items[i], json[i]);
			}

            value.size = json.length;
		}
		
		this.setValue(obj, value);
	}
});/**
 * @class jspa.metamodel.CollectionAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
jspa.metamodel.CollectionAttribute = jspa.metamodel.PluralAttribute.inherit({

    collectionType: jspa.metamodel.PluralAttribute.CollectionType.COLLECTION,

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} declaringType
     * @param {String} name
     * @param {Function} typeConstructor
     * @param {jspa.metamodel.Type} elementType
     */
	initialize: function(declaringType, name, typeConstructor, elementType) {
		this.superCall(declaringType, name, typeConstructor, elementType);

		this.trackedConstructor = typeConstructor.inherit(jspa.collection.Collection, {});
	}
});/**
 * @class jspa.metamodel.ManagedType
 * @extends jspa.metamodel.Type
 */
jspa.metamodel.ManagedType = jspa.metamodel.Type.inherit({
	AttributeIterator: Object.inherit(jspa.Iterator, {
		nextAttr: null,

        initialize: function(type) {
			this.type = type;

            this.initAttr();
            this.next();
		},
		
		initAttr: function() {
            this.index = 0;
            this.names = Object.getOwnPropertyNames(this.type.declaredAttributes);
		},

        /**
         * @return {jspa.metamodel.Attribute}
         */
		next: function() {
			var attr = this.nextAttr;

            while (this.names.length == this.index && (this.type = this.type.supertype)) {
                this.initAttr();
            }
			
			this.hasNext = this.type != null;
            if (this.hasNext) {
                this.nextAttr = this.type.declaredAttributes[this.names[this.index++]];
            }

			return attr;
		}
	}),

    /**
     * @type {jspa.metamodel.Attribute[]}
     */
	declaredAttributes: null,
	
	/**
	 * @param {jspa.binding.ClassUtil} classUtil
	 */
	init: function(classUtil) {
		if (!this.typeConstructor) {
			this.typeConstructor = classUtil.loadClass(this);

			this.superCall(classUtil);
			this.classUtil.enhance(this, this.typeConstructor);
		} else {
			this.superCall(classUtil);
		}
	},

    /**
     * @return {jspa.metamodel.ManagedType.AttributeIterator}
     */
	attributes: function() {
		return new this.AttributeIterator(this);
	},
	
	/**
	 * @param {!String} name
	 * @returns {jspa.metamodel.Attribute}
	 */
	getAttribute: function(name) {
		if (name in this.declaredAttributes) {			
			return this.declaredAttributes[name];
		} else if (this.supertype) {
			return this.supertype.getAttribute(name);
		} else {
			return null;
		}
	},
	
	/**
	 * @param {String} name
	 * @returns {jspa.metamodel.Attribute}
	 */
	getDeclaredAttribute: function(name) {
        return this.declaredAttributes[name] || null;
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @param {Object} value
     * @return {*}
     */
    fromDatabaseValue: function(state, obj, value) {
        if (value && value._objectInfo['class'] == this.identifier) {
            for (var iter = this.attributes(); iter.hasNext; ) {
                var attribute = iter.next();

                attribute.setDatabaseValue(state, obj, value[attribute.name]);
            }
        } else {
            obj = null;
        }

        return obj;
    },

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @return {Object}
     */
    toDatabaseValue: function(state, obj) {
        var value = null;

        if (this.typeConstructor.isInstance(obj)) {
            value = {
                _objectInfo: {
                    'class': this.identifier
                }
            };

            for (var iter = this.attributes(); iter.hasNext; ) {
                var attribute = iter.next();

                value[attribute.name] = attribute.getDatabaseValue(state, obj);
            }
        }

        return value;
    }
});/**
 * @class jspa.metamodel.EmbeddableType
 * @extends jspa.metamodel.ManagedType
 */
jspa.metamodel.EmbeddableType = jspa.metamodel.ManagedType.inherit({
	persistenceType: jspa.metamodel.Type.PersistenceType.EMBEDDABLE,

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @param {Object} value
     * @return {*}
     */
    fromDatabaseValue: function(state, obj, value) {
        if (!obj && value) {
            obj = this.create();

            Object.defineProperty(obj, '__jspaEntity__', {
                value: state.entity
            });
        }

        return this.superCall(state, obj, value);
    }
});/**
 * @class jspa.metamodel.EntityType
 * @extends jspa.metamodel.ManagedType
 */
jspa.metamodel.EntityType = jspa.metamodel.ManagedType.inherit({
	persistenceType: jspa.metamodel.Type.PersistenceType.ENTITY,
	
	declaredId: null,
	declaredVersion: null,
	
	/**
	 * @type {String}
	 */
	id: {
		get: function() {
			return this.declaredId || this.supertype.id;
		}
	},
	
	/**
	 * @type {String}
	 */
	version: { 
		get: function() {
			return this.declaredVersion || this.supertype.version;
		}
	},

    /**
     * @constructor
     * @param {String} identifier
     * @param {jspa.metamodel.EntityType} supertype
     * @param {Function} typeConstructor
     */
    initialize: function(identifier, supertype, typeConstructor) {
        this.superCall(identifier, typeConstructor);

        this.supertype = supertype;
    },

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @param {Object} value
     * @return {*}
     */
	fromDatabaseValue: function(state, obj, value) {
        if (state.entity == obj) {
            this.superCall(state, obj, value);
            return obj;
        } else if (value) {
			return state.entityManager.getReference(value);
		} else {
			return null;
		}
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @return {Object}
     */
	toDatabaseValue: function(state, obj) {
        if (state.entity == obj) {
            var value = this.superCall(state, obj);
            var info = value._objectInfo;

            var oid = state.getReference();
            if (oid) {
                info['oid'] = oid;
            }

            var version = state.getVersion();
            if (version) {
                info['version'] = version;
            }

            var transaction = state.getTransactionIdentifier();
            if (transaction) {
                info['transaction'] = transaction;
            }

            return value;
        } else if (this.typeConstructor.isInstance(obj)) {
            var valueState = jspa.util.State.get(obj);
            if (valueState && !valueState.isDeleted) {
                var data = valueState.getReference();
                if (data) {
                    return data;
                } else {
                    state.isDirty = true;
                }
            }
        }
		
		return null;
	}
});/**
 * @class jspa.metamodel.ListAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
jspa.metamodel.ListAttribute = jspa.metamodel.PluralAttribute.inherit({

	collectionType: jspa.metamodel.PluralAttribute.CollectionType.LIST,

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} declaringType
     * @param {String} name
     * @param {Function} typeConstructor
     * @param {jspa.metamodel.Type} elementType
     */
	initialize: function(declaringType, name, typeConstructor, elementType) {
		this.superCall(declaringType, name, typeConstructor, elementType);
		
		this.trackedConstructor = typeConstructor.inherit(jspa.collection.List, {});
	}
});/**
 * @class jspa.metamodel.Metamodel
 */
jspa.metamodel.Metamodel = Object.inherit({
	/**
	 * @constructor
	 */
	initialize: function() {
		this.baseTypes = {};
		this.entities = {};
        this.embeddables = {};
		
		this.classUtil = new jspa.binding.ClassUtil();

		this.addType(new jspa.metamodel.BasicType('Boolean', Boolean));

		this.addType(new jspa.metamodel.BasicType('Float', Number));
		this.addType(new jspa.metamodel.BasicType('Integer', Number));
		this.addType(new jspa.metamodel.BasicType('String', String));

        this.addType(new (jspa.metamodel.BasicType.inherit({
            toDatabaseValue: function(state, currentValue) {
                var value = this.superCall(state, currentValue);
                if (value) {
                    value = value.toISOString();
                    value = value.substring(0, value.indexOf('T'));
                }
                return value;
            }
        }))('Date', Date));

        this.addType(new (jspa.metamodel.BasicType.inherit({
            toDatabaseValue: function(state, currentValue) {
                var value = this.superCall(state, currentValue);
                if (value) {
                    value = value.toISOString();
                    value = value.substring(value.indexOf('T') + 1);
                }
                return value;
            },
            fromDatabaseValue: function(state, currentValue, json) {
                return this.superCall(state, currentValue, json? 'T' + json: json);
            }
        }))('Time', Date));

        this.addType(new jspa.metamodel.BasicType('DateTime', Date));
		
		var objectModel = new jspa.metamodel.EntityType('/db/_native.Object', null, Object);
		objectModel.declaredAttributes = {};
		objectModel.declaredId = new jspa.metamodel.SingularAttribute(objectModel, 'oid', this.baseType(String));
        objectModel.declaredId.isId = true;

		objectModel.declaredVersion = new jspa.metamodel.SingularAttribute(objectModel, 'version', this.baseType(String));
        objectModel.declaredVersion.isVersion = true;

		this.addType(objectModel);
	},

    /**
     * @param {(Function|String)} arg
     * @return {String}
     */
    identifierArg: function(arg) {
        var identifier;
        if (String.isInstance(arg)) {
            identifier = arg;

            if (identifier.indexOf('/db/') != 0) {
                identifier = '/db/' + arg;
            }
        } else {
            identifier = this.classUtil.getIdentifier(arg);
        }

        return identifier;
    },
	
	/**
	 * @param {(Function|String)} typeConstructor
	 * @returns {jspa.metamodel.EntityType}
	 */
	entity: function(typeConstructor) {
		var identifier = this.identifierArg(typeConstructor);
		return identifier? this.entities[identifier]: null;
	},
	
	/**
	 * @param {(Function|String)} typeConstructor
	 * @returns {jspa.metamodel.BasicType}
	 */
	baseType: function(typeConstructor) {
        if (String.isInstance(typeConstructor) && typeConstructor.indexOf('_native.') == -1)
            typeConstructor = '/db/_native.' + typeConstructor;

        var identifier = this.identifierArg(typeConstructor);
		return identifier? this.baseTypes[identifier]: null;
	},

    /**
     * @param {(Function|String)} typeConstructor
     * @returns {jspa.metamodel.EmbeddableType}
     */
    embeddable: function(typeConstructor) {
        var identifier = this.identifierArg(typeConstructor);
        return identifier? this.embeddables[identifier]: null;
    },
	
	addType: function(type) {
        var types;

        if (type.isBasic) {
            types = this.baseTypes;
        } else if (type.isEmbeddable) {
            types = this.embeddables;
        } else if (type.isEntity) {
            types = this.entities;
        }

        if (!(type.identifier in types)) {
            type.init(this.classUtil);
            types[type.identifier] = type;
        }
	}
});/**
 * @class jspa.metamodel.MapAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
jspa.metamodel.MapAttribute = jspa.metamodel.PluralAttribute.inherit({

	collectionType: jspa.metamodel.PluralAttribute.CollectionType.MAP,
	
	/**
	 * @constructor
	 * @param {jspa.metamodel.EntityType} declaringType
	 * @param {String} name
	 * @param {Function} typeConstructor
	 * @param {jspa.metamodel.Type} keyType
	 * @param {jspa.metamodel.Type} elementType
	 */
	initialize: function(declaringType, name, typeConstructor, keyType, elementType) {
		this.superCall(declaringType, name, typeConstructor, elementType);
		
		this.keyType = keyType;
        this.trackedConstructor = typeConstructor.inherit(jspa.collection.Map, {});
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @return {Object}
     */
	getDatabaseValue: function(state, obj) {
		var value = this.getValue(obj);

		if (value) {
			if (!this.trackedConstructor.isInstance(value)) {
				value = new this.trackedConstructor(value);

                Object.defineProperty(value, '__jspaEntity__', {
                    value: state.entity
                });

				this.setValue(obj, value);
			}

			var json = [];
			for (var iter = value.items(); iter.hasNext; ) {
				var item = iter.next();
				var key = this.keyType.toDatabaseValue(state, item[0]);
				if (item[0] === null || key !== null) {
					json.push({
						key: key,
						value: this.elementType.toDatabaseValue(state, item[1])
					});
				}
			}

			return json;
		} else {
			return null;
		}
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @param {Object} json
     */
	setDatabaseValue: function(state, obj, json) {
		var value = null;
		if (json) {			
			value = this.getValue(obj);
			
			if (!this.trackedConstructor.isInstance(value)) {
				value = new this.trackedConstructor();
                Object.defineProperty(value, '__jspaEntity__', {
                    value: state.entity
                });
			}

            var keys = value.seq;
            var vals = value.vals;

            if (keys.length > json.length) {
                keys.splice(json.length, keys.length - json.length);
                vals.splice(json.length, vals.length - json.length);
            }

			for (var i = 0, len = json.length; i < len; ++i) {
				var item = json[i];
				keys[i] = this.keyType.fromDatabaseValue(state, keys[i], item.key);
				vals[i] = this.elementType.fromDatabaseValue(state, vals[i], item.value);
			}

            value.size = json.length;
		}

		this.setValue(obj, value);
	}
});/**
 * @class jspa.metamodel.ModelBuilder
 */
jspa.metamodel.ModelBuilder = Object.inherit({
	/**
	 * @constructor
	 * @param {jspa.metamodel.Metamodel} metamodel
	 */
	initialize: function(metamodel) {
		this.metamodel = metamodel;
		this.objectType = metamodel.entity(Object);
	},
	
	/**
	 * @param {String} identifier
	 * @returns {jspa.metamodel.EntityType}
	 */
	getModel: function(identifier) {
		var model = null;
		if (identifier.indexOf('/db/_native') == 0) {
			model = this.metamodel.baseType(identifier);
		} else {
			model = this.metamodel.entity(identifier);
            if (!model)  {
                model = this.metamodel.embeddable(identifier);
            }

			if (!model && identifier in this.models) {
				model = this.models[identifier];
			}
			
			if (!model) {
				model = this.buildModel(identifier);
			}
		}
		
		if (model) {
			return model;
		} else {			
			throw new TypeError('no model available for ' + identifier);
		}		
	},
	
	/**
	 * @param {Object}
	 * @returns {jspa.metamodel.EntityType[]}
	 */
	buildModels: function(modelDescriptors) {
		this.modelDescriptors = {};
		for (var i = 0, modelDescriptor; modelDescriptor = modelDescriptors[i]; ++i) {
			this.modelDescriptors[modelDescriptor['class']] = modelDescriptor;
		}
		
		this.models = {};
		for (var identifier in this.modelDescriptors) {
			try {
				var model = this.getModel(identifier);
				model.declaredAttributes = this.buildAttributes(model);				
			} catch (e) {
				throw new jspa.error.PersistentError('Can\'t create model for entity class ' + identifier, e);
			}
		}
		
		return this.models;
	},
	
	/**
	 * @param {String} identifier
	 * @returns {jspa.metamodel.EntityType}
	 */
	buildModel: function(identifier) {
		var modelDescriptor = this.modelDescriptors[identifier];
		if (modelDescriptor) {
			var superTypeIdentifier = modelDescriptor['superClass'];
			var superType = superTypeIdentifier? this.getModel(superTypeIdentifier): this.objectType;

            var type;
            if (modelDescriptor.embedded) {
                type = new jspa.metamodel.EmbeddableType(identifier)
            } else {
                type = new jspa.metamodel.EntityType(identifier, superType);
            }
			
			this.models[identifier] = type;
			return type;			
		} else {
			return null;
		}
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} model
	 * @returns {jspa.metamodel.Attribute[]}
	 */
	buildAttributes: function(model) {
		if (model.identifier in this.models) {
			var fields = this.modelDescriptors[model.identifier]['fields'];
			
			var attributes = {};
			for (var name in fields) {
				if (fields.hasOwnProperty(name)) {
					attributes[name] = this.buildAttribute(model, name, fields[name]);
				}
			}
			
			return attributes;
		} else {
			return null;
		}
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} model
	 * @param {String} name
	 * @param {String} identifier
	 * @returns {jspa.metamodel.Attribute}
	 */
	buildAttribute: function(model, name, identifier) {
		if (identifier.indexOf('/db/_native.collection') == 0) {
			var collectionType = identifier.substring(0, identifier.indexOf('['));
			
			var elementType = identifier.substring(identifier.indexOf('[') + 1, identifier.indexOf(']')).trim();
			switch (collectionType) {
				case '/db/_native.collection.List':
					return new jspa.metamodel.ListAttribute(model, name, jspa.List, this.getModel(elementType));
				case '/db/_native.collection.Set':
					return new jspa.metamodel.SetAttribute(model, name, jspa.Set, this.getModel(elementType));
				case '/db/_native.collection.Map':
					var keyType = elementType.substring(0, elementType.indexOf(',')).trim();
					elementType = elementType.substring(elementType.indexOf(',') + 1).trim();
					
					return new jspa.metamodel.MapAttribute(model, name, jspa.Map, this.getModel(keyType), this.getModel(elementType));
				default:
					throw new TypeError('no collection available for ' + identifier); 
			}
		} else {
			return new jspa.metamodel.SingularAttribute(model, name, this.getModel(identifier));
		}
	}
});/**
 * @class jspa.metamodel.SingularAttribute
 * @extends jspa.metamodel.Attribute
 */
jspa.metamodel.SingularAttribute = jspa.metamodel.Attribute.inherit({
	
	typeConstructor: {
		get: function() {
			return this.type.typeConstructor;
		}
	},

    /**
     * @type Number
     */
    persistentAttributeType: -1,

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} declaringType
     * @param {String} name
     * @param {jspa.metamodel.Type} type
     */
	initialize: function(declaringType, name, type) {
		this.superCall(declaringType, name);
		
		this.type = type;

		switch (type.persistenceType) {
			case jspa.metamodel.Type.PersistenceType.BASIC:				
				this.persistentAttributeType = jspa.metamodel.Attribute.PersistentAttributeType.BASIC;
				break;
			case jspa.metamodel.Type.PersistenceType.EMBEDDABLE:
				this.persistentAttributeType = jspa.metamodel.Attribute.PersistentAttributeType.EMBEDDED;
				break;
			case jspa.metamodel.Type.PersistenceType.ENTITY:
				this.persistentAttributeType = jspa.metamodel.Attribute.PersistentAttributeType.ONE_TO_MANY;
				break;
		}
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @return {*}
     */
	getDatabaseValue: function(state, obj) {
		return this.type.toDatabaseValue(state, this.getValue(obj));
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @param {*} value
     */
	setDatabaseValue: function(state, obj, value) {
		this.setValue(obj, this.type.fromDatabaseValue(state, this.getValue(obj), value));
	}
});/**
 * @class jspa.metamodel.SetAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
jspa.metamodel.SetAttribute = jspa.metamodel.PluralAttribute.inherit({

    collectionType: jspa.metamodel.PluralAttribute.CollectionType.SET,

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} declaringType
     * @param {String} name
     * @param {Function} typeConstructor
     * @param {jspa.metamodel.Type} elementType
     */
	initialize: function(declaringType, name, typeConstructor, elementType) {
		this.superCall(declaringType, name, typeConstructor, elementType);

		this.trackedConstructor = typeConstructor.inherit(jspa.collection.Set, {});
	}
});/**
 * @class jspa.util.Queue
 */
jspa.util.Queue = Object.inherit(Bind, {
	
	extend: {
		State: {
			STOPPED: 0,
			PAUSED: 1,
			WAITING: 2,
			RUNNING: 3
		}
	},

    /**
     * @type Boolean
     */
	isStopped: {
		get: function() {
			return this.state == jspa.util.Queue.State.STOPPED;
		}
	},

    /**
     * @type Boolean
     */
	isPaused: {
		get: function() {
			return this.state == jspa.util.Queue.State.PAUSED;
		}
	},

    /**
     * @type Boolean
     */
	isWaiting: {
		get: function() {
			return this.state == jspa.util.Queue.State.WAITING;
		}
	},

    /**
     * @type Boolean
     */
	isRunning: {
		get: function() {
			return this.state == jspa.util.Queue.State.RUNNING;
		}
	},

    /**
     * @type Boolean
     */
	isPrevented: {
		get: function() {
			return this.prevented;
		}
	},

	/**
	 * @constructor
	 */
	initialize: function() {
		this.currentQueue = [];
		this.queue = this.currentQueue;
		
		this.state = jspa.util.Queue.State.STOPPED;
		
		this.count = 0;
		this.prevented = false;
	},

    /**
     * @param {*} context
     * @param {jspa.Promise=} promise
     * @return {jspa.Promise}
     */
	wait: function(context, promise) {
		if (!this.isRunning && this.isPrevented)
			throw new Error("The queue was prevented");
		
		var deferred = new jspa.Deferred();	
		
		var self = this;
		this.currentQueue.push(function() {
			if (promise) {
				promise.done(function() {
					var args = arguments;
					self.run(function() {
						deferred.resolveWith(context, args);
					});
				}).fail(function() {
					var args = arguments;
					self.run(function() {
						deferred.rejectWith(context, args);
					});
				});
			} else {
				self.run(function() {
					deferred.resolveWith(context);
				});
			}
		});
		
		this.next();
		
		return deferred.promise();
	},

	start: function() {
		if (this.isStopped && !this.isPrevented) {
			this.state = jspa.util.Queue.State.PAUSED;
		}		

		this.next();
	},

    /**
     * @param {Function} callback
     */
	run: function(callback) {
		if (!this.isWaiting)
			throw new Error('Illegal state ' + this.state);
		
		this.state = jspa.util.Queue.State.RUNNING;
		
		this.currentQueue = [];
		
		callback();
		
		if (this.currentQueue.length)
			Array.prototype.unshift.apply(this.queue, this.currentQueue);
		
		this.currentQueue = this.queue;
		
		this.state = jspa.util.Queue.State.PAUSED;
		
		this.next();
	},
	
	next: function() {
		if (this.isPaused && this.queue.length) {
			this.state = jspa.util.Queue.State.WAITING;
			setTimeout(this.queue.shift(), 1);
		}
		
		if (this.isPrevented && !this.queue.length) {
			this.state = jspa.util.Queue.State.STOPPED;
		}
	},
	
	stop: function() {
		this.prevented = true;
	}
});/**
 * @class jspa.util.State
 */
jspa.util.State = Object.inherit({
	
	extend: {
		Type: {
			TEMPORARY: 0,
			PERSISTENT: 1,
			DIRTY: 2,
			DELETED: 3
		},

        /**
         * @param {*} entity
         */
        get: function(entity) {
            return entity._objectInfo && entity._objectInfo.state;
        },
		
		readAccess: function(obj) {
            if (obj.__jspaEntity__)
                obj = obj.__jspaEntity__;

			var info = obj._objectInfo;
            if (!info)
                return;

			if (info.state) {
				info.state.makeAvailable();
			}

			if (info.notAvailable) {
				throw new jspa.error.PersistentError('Object state can not be initialized.');
			}
		},
		
		writeAccess: function(obj) {
            if (obj.__jspaEntity__)
                obj = obj.__jspaEntity__;

            var info = obj._objectInfo;
            if (!info)
                return;

			if (info.state) {
				info.state.makeDirty();
			}

			if (info.notAvailable) {
				throw new jspa.error.PersistentError('Object state can not be initialized.');
			}
		}
	},
	
	/**
	 * @returns {Boolean}
	 */
	isTemporary: {
		get: function() {
			return this.state == jspa.util.State.Type.TEMPORARY;
		}
	},
	
	/**
	 * @returns {Boolean}
	 */
	isPersistent: {
		get: function() {
			return this.state == jspa.util.State.Type.PERSISTENT;
		}
	},
	
	/**
	 * @returns {Boolean}
	 */
	isDeleted: {
		get: function() {
			return this.state == jspa.util.State.Type.DELETED;
		}
	},
	
	/**
	 * @param entityManager
	 * @param {jspa.metamodel.EntityType} type
	 * @param {*} entity
	 */
	initialize: function(entityManager, type, entity) {
		this.entityManager = entityManager;
		this.type = type;
		this.entity = entity;

        Object.defineProperty(this.entity, '_objectInfo', {
            value: {
                'class': this.type.identifier,
                'notAvailable': true,
                'state': this
            }
        });
		
		this.isDirty = false;
		this.state = jspa.util.State.Type.PERSISTENT;
		
		this.enabled = true;
	},
	
	setTemporary: function() {
		if (this.entity._objectInfo.notAvailable) {
			this.entity._objectInfo.notAvailable = false;
			this.state = jspa.util.State.Type.TEMPORARY;
			this.isDirty = true;
		}
	},
	
	setPersistent: function() {
		if (this.isDeleted)
			this.isDirty = true;
		
		this.state = jspa.util.State.Type.PERSISTENT;
	},
	
	setDeleted: function() {
		this.state = jspa.util.State.Type.DELETED;
		this.isDirty = true;
	},
	
	enable: function() {
		this.enabled = true;
	},

	disable: function() {
		this.enabled = false;
	},

	/**
	 *
	 */
	makeDirty: function() {
		if (this.enabled) {
			if (this.entity._objectInfo.notAvailable) {
				this.makeAvailable();
			}
			
			if (!this.isDeleted) {				
				this.isDirty = true;
			}
		}
	},
	
	makeAvailable: function() {
		if (this.enabled && this.entity._objectInfo.notAvailable) {
			try {
				this.entityManager.findBlocked(this);
			} catch (e) {}
		}
	},

    remove: function() {
        this.entity._objectInfo.state = null;
    },
	
	getIdentifier: function() {
		return this.type.id.getDatabaseValue(this, this.entity);
	},
	
	getVersion: function() {
		return this.type.version.getDatabaseValue(this, this.entity);
	},
	
	getReference: function() {
		var value = this.getIdentifier();
		
		if (this.isTemporary) {
			var transaction = this.entityManager.transaction;
			if (transaction.isActive) {
				value = '/transaction/' + transaction.tid + value;			
			} else {
				value = null;
			}
		}
		
		return value;
	},

    getTransactionIdentifier: function() {
        var transaction = this.entityManager.transaction;

        if (transaction.isActive) {
            return '/transaction/' + transaction.tid;
        }

        return null;
    },
	
	getDatabaseObjectInfo: function() {
		var info = {
			'class': this.type.identifier
		};
		
		var oid = this.getReference();
		if (oid) {
			info['oid'] = oid;
		}
		
		var version = this.getVersion();
		if (version) {
			info['version'] = version;
		}

        var transaction = this.getTransactionIdentifier();
        if (transaction) {
            info['transaction'] = transaction;
        }
		
		return info;
	},
	
	setDatabaseObjectInfo: function(json) {
		if (this.isTemporary)
			this.type.id.setDatabaseValue(this, this.entity, json['oid']);
		
		this.type.version.setDatabaseValue(this, this.entity, json['version']);
	},

	getDatabaseObject: function() {
		this.disable();

		this.isDirty = false;
        var json = this.type.toDatabaseValue(this, this.entity);
		
		this.enable();
		return json;
	},
	
	setDatabaseObject: function(json) {
		this.setDatabaseObjectInfo(json['_objectInfo']);

        this.entity._objectInfo.notAvailable = false;

        //refresh values only if the object was not changed
        if (!this.isDirty) {
            this.disable();

            this.type.fromDatabaseValue(this, this.entity, json);

            this.enable();
        }
	}
});