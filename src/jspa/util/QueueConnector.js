
jspa.util.QueueConnector = Object.inherit({
	/**
	 * @constructor
	 * @memberOf jspa.util.QueueConnector
	 */
	initialize: function(queue, connector) {
		this.queue = queue;
		this.connector = connector;
	},
	
	send: function(message) {
		return this.connector.send(this, message);
	},
	
	sendBlocked: function(message) {
		this.connector.send(this, message, true);

		return message;
	},
	
	wait: function(promise, doneCallback, failCallback) {
		return this.queue.wait(this, promise)
			.done(doneCallback)
			.fail(failCallback);
	},
	
	yield: function(doneCallback) {
		return this.queue.wait(this).done(doneCallback);
	}
});