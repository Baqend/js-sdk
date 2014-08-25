var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class jspa.error.CommunicationError
 * @extends jspa.error.PersistentError
 */
exports.CommunicationError = PersistentError.inherit(/** @lends jspa.error.CommunicationError */ {

  statusCode: 0,

  /**
   * @param {jspa.message.Message} httpMessage
   */
	initialize: function(httpMessage) {
		var state = (httpMessage.response.statusCode == 0? 'Request': 'Response');
		this.superCall('jspa.error.CommunicationError: Communication failed by handling the ' + state + ' for ' +
				httpMessage.request.method + ' ' + httpMessage.request.path);

    this.statusCode = httpMessage.response.statusCode;

		var cause = httpMessage.response.entity;

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
});