/**
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
            .fail(jspa.EntityManagerFactory.onError)
            .then(doneCallback, failCallback);
	},

    /**
     * @param {Function=} doneCallback
     * @return {jspa.Promise}
     */
	yield: function(doneCallback) {
		return this.queue.wait(this).then(doneCallback).fail(jspa.EntityManagerFactory.onError);
	}
});