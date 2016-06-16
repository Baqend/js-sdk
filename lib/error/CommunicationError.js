"use strict";

var PersistentError = require('./PersistentError');

/**
 * @alias baqend.error.CommunicationError
 * @extends baqend.error.PersistentError
 */
class CommunicationError extends PersistentError {

	/**
	 * @param {baqend.connector.Message} httpMessage The http message which was send
	 * @param {Object} response The received entity headers and content
   */
	constructor(httpMessage, response) {
		var entity = response.entity || {};
		var state = (response.status == 0? 'Request': 'Response');
		var message = entity.message || 'Handling the ' + state + ' for ' + httpMessage.request.method + ' ' + httpMessage.request.path;

		super(message, entity);

		this.name = entity.className || 'CommunicationError';
		this.reason = entity.reason || 'Communication failed';
    this.status = response.status;

    if(entity.data)
      this.data = entity.data;

		var cause = entity;
		while (cause && cause.stackTrace) {
			this.stack += '\nServerside Caused by: ' + cause.className + ' ' + cause.message;

			var stackTrace = cause.stackTrace;
			for (var i = 0; i < stackTrace.length; ++i) {
				var el = stackTrace[i];

				this.stack += '\n    at ' + el.className + '.' + el.methodName;
				this.stack += ' (' + el.fileName + ':' + el.lineNumber + ')';
			}
			
			cause = cause.cause;
		}
	}
}

module.exports = CommunicationError;