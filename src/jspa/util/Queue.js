/**
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
});