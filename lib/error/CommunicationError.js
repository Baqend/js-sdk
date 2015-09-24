"use strict";

var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.CommunicationError
 * @extends baqend.error.PersistentError
 *
 * @param {baqend.connector.Message} httpMessage
 */
class CommunicationError extends PersistentError {

	constructor(httpMessage) {
		var response = httpMessage.response.entity;
		var state = (httpMessage.response.status == 0? 'Request': 'Response');
		var message = response.message || 'Handling the ' + state + ' for ' + httpMessage.request.method + ' ' + httpMessage.request.path;

		super(message);

		this.name = response.className || 'CommunicationError';
		this.reason = response.reason || 'Communication failed';
    this.status = httpMessage.response.status;

    if(response.data)
      this.data = response.data;

		var cause = response;
		while (cause) {
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