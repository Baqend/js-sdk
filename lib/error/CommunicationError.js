var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.CommunicationError
 * @extends baqend.error.PersistentError
 *
 * @param {baqend.connector.Message} httpMessage
 */
var CommunicationError = module.exports = PersistentError.inherit(/** @lends baqend.error.CommunicationError */ {

  statusCode: 0,

	initialize: function(httpMessage) {
		var state = (httpMessage.response.statusCode == 0? 'Request': 'Response');
		this.superCall('baqend.error.CommunicationError: Communication failed by handling the ' + state + ' for ' +
				httpMessage.request.method + ' ' + httpMessage.request.path);

    this.statusCode = httpMessage.response.statusCode;

		var cause = httpMessage.response.entity;

    if(cause && cause.data)
      this.data = cause.data;

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