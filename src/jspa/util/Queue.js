jspa.util.Queue = Object.inherit(Bind, {
	
	extend: {
		State: {
			STOPPED: 0,
			PAUSED: 1,
			WAITING: 2,
			RUNNING: 3
		}
	},
	
	isStopped: {
		get: function() {
			return this.state == jspa.util.Queue.State.STOPPED;
		}
	},
	
	isPaused: {
		get: function() {
			return this.state == jspa.util.Queue.State.PAUSED;
		}
	},
	
	isWaiting: {
		get: function() {
			return this.state == jspa.util.Queue.State.WAITING;
		}
	},
	
	isRunning: {
		get: function() {
			return this.state == jspa.util.Queue.State.RUNNING;
		}
	},
	
	isPrevented: {
		get: function() {
			return this.prevented;
		}
	},

	/**
	 * @constructor
	 * @memberOf jspa.util.Queue
	 */
	initialize: function() {
		this.currentQueue = [];
		this.queue = this.currentQueue;
		
		this.state = jspa.util.Queue.State.PAUSED;
		
		this.count = 0;
		this.prevented = false;
	},
	
	wait: function(count) {
		if (count === undefined)
			count = 1;
		
		if (count > 0) {			
			if (this.isRunning || this.isPaused) {
				this.state = jspa.util.Queue.State.WAITING;
			}
			
			if (this.isWaiting) {
				this.count += count;
			}
		}
	},
	
	resume: function(count) {
		if (count === undefined)
			count = 1;
		
		if (this.isWaiting && count > 0) {
			this.count -= count;
			if (this.count < 0)
				this.count = 0;
			
			if (this.count == 0) {				
				this.state = jspa.util.Queue.State.PAUSED;
				this.run();
			}
		}
	},
	
	add: function(context, callback) {
		if (!callback) {
			callback = context;
			context = null;
		}
		
		if (callback && !this.isPrevented) {
			if (context)
				callback = callback.bind(context);
			
			this.currentQueue.push(callback);
		}
		
		this.run();
	},
	
	run: function() {
		if (!this.isPaused)
			return;

		this.state = jspa.util.Queue.State.RUNNING;
				
		this.currentQueue = [];
		
		try {				
			var callback = this.queue.shift();
			callback();
		} catch (e) {
			console.log(e);
			this.stop();
		}
		
		if (this.currentQueue.length)
			Array.prototype.unshift.apply(this.queue, this.currentQueue);
		
		this.currentQueue = this.queue;
		
		if (this.isRunning) {
			if (this.isPrevented) {
				this.state = jspa.util.Queue.State.STOPPED;
			} else {
				this.state = jspa.util.Queue.State.PAUSED;
				
				if (this.queue.length)
					window.setTimeout(this.bind.run, 1);
			}
		}
	},
	
	stop: function() {
		this.prevented = true;
	}
});