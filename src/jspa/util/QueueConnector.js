
jspa.util.QueueConnector = Object.inherit({
	/**
	 * @constructor
	 * @memberOf jspa.util.QueueConnector
	 */
	initialize: function(queue, connector) {
		this.queue = queue;
		this.connector = connector;
	},
	
	send: function(message, success, error) {
		var event, self = this;
		
		message.on('receive', function(e) {
			event = e;
			self.queue.resume();
		});
		
		message.on('error', function(e) {
			event = e;
			self.queue.resume();
		});
		
		if (success && error) {
			this.yield(function() {
				if (event.type == 'receive') {
					success.call(self, event);
				} else {
					error.call(self, event);
				}
			});
		}
		
		if (message.send()) {
			this.queue.wait();
			this.connector.send(message);
		}
	},
	
	sendBlocked: function(message) {
		if (message.send())
			this.connector.send(message, true);

		return message;
	},
	
	yield: function(context, callback) {
		if (context && !callback) {
			callback = context;
			context = this;
		}
		
		this.queue.add(context, callback);
	}
});