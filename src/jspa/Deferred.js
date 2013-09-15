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
});